var admin = require("firebase-admin");
var database = admin.database();
var microtime = require("microtime");
var crypto = require("crypto-js");
var nJwt = require('njwt');

exports.createAccount = async function (req, res) {
    var avatar = "";
    if (req.body.gender == 2) {
        avatar = "/assets/img/girl.jpg";
    } else {
        avatar = "/assets/img/man.jpeg";
    }
    var id = microtime.now();
    db.ref("accounts/" + id).set({
        id: id,
        username: (req.body.username).toLowerCase(),
        password: crypto.AES.encrypt(req.body.password, 'iSilent').toString(),
        email: req.body.email,
        fullname: req.body.fullname,
        gender: req.body.gender,
        birthday: req.body.birthday,
        createdAt: new Date().toLocaleDateString(),
        avatar: avatar,
        status: 1
    });
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts/" + id).on("value", function (snapshot, prevChildKey) {
            resolve(snapshot.val());
        });
    });
    if (rs) {
        res.send(rs);
    }
};

exports.checkExistsUsername = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts").orderByChild("username").equalTo((req.query.q).toLowerCase()).on("value", function (snapshot) {
            if (snapshot.val() != null || snapshot.val() != undefined) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
    res.send(rs);
};

exports.login = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts").orderByChild("username").equalTo((req.body.username).toLowerCase()).on("value", function (snapshot) {
            if (snapshot.val() != null || snapshot.val() != undefined) {
                var obj = snapshot.val();
                for (var key in obj) {
                    var value = obj[key];
                    var password = crypto.AES.decrypt(value.password, 'iSilent').toString(crypto.enc.Utf8);
                    if (value.status == 1) {
                        if (req.body.password == password) {
                            var claims = {
                                "username": value.username,
                                "id": value.id
                            }
                            var jwt = nJwt.create(claims, "secret", "HS256");
                            var token = jwt.compact();
                            resolve({
                                id: value.id,
                                token: token,
                                username: value.username,
                                avatar: value.avatar,
                                fullname: value.fullname,
                                gender: value.gender,
                                birthday: value.birthday,
                                email: value.email,
                                chatlist: value.chatlist
                            });
                        } else {
                            resolve({
                                code: 401,
                                error: 'Tên đăng nhập hoặc mật khẩu không chính xác!'
                            });
                        }
                    } else if (value.status == 0) {
                        resolve({
                            code: 200,
                            error: 'Tài khoản của bạn đã bị khóa!'
                        });
                    }
                }
            } else {
                resolve({
                    code: 401,
                    error: 'Tên đăng nhập hoặc mật khẩu không chính xác!'
                });
            }
        });
    });
    res.json(rs);
};

exports.loginRequired = function (req, res, next) {
    var token = req.headers.authorization;
    nJwt.verify(token, "secret", function (err, verifiedJwt) {
        if (err) {
            res.status(401).json({ message: 'Token hết hạn hoặc không tồn tại!' });
        } else {
            next();
        }
    });
};

exports.saveMessage = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("messages" + req.body.idChat + "/messages/" + microtime.now()).set({
            id: req.body.id,
            msg: req.body.msg,
            createdAt: Date.now()
        });
        resolve(true);
    });
    res.send(rs);
};

exports.getAvatar = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts/" + req.params.id).on("value", function (snapshot) {
            resolve(snapshot.val());
        });
    });
    var data = {
        avatar: rs.avatar,
        fullname: rs.fullname
    }
    try {
        res.send(data);
    } catch (error) {
        console.log('Error Avatar: ', error);
    }
};

exports.getInfo = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts/" + req.params.id).on("value", function (snapshot) {
            resolve(snapshot.val());
        });
    });
    let data = {
        avatar: rs.avatar,
        username: rs.username,
        fullname: rs.fullname,
        gender: rs.gender,
        email: rs.email,
        birthday: rs.birthday
    }
    res.send(data);
};

exports.listMessage = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        if (req.params.mode == 'single') {
            db.ref("messages/" + req.params.mode + "/" + req.params.id + "/info").on("value", function (info) {
                if (req.query.me == undefined) {
                    resolve('Đừng phá nữa my fen :))');
                } else if (info.val().key != req.query.me) {
                    db.ref("accounts/" + info.val().key).on("value", function (account) {
                        db.ref("messages/" + req.params.mode + "/" + req.params.id + "/messages").limitToLast(1).on("value", function (lastMsg) {
                            let data = {
                                avatar: account.val().avatar,
                                fullname: account.val().fullname,
                                chat: lastMsg.val()
                            }
                            resolve(data);
                        });
                    });
                } else if (info.val().client != req.query.me) {
                    db.ref("accounts/" + info.val().client).on("value", function (account) {
                        db.ref("messages/" + req.params.mode + "/" + req.params.id + "/messages").limitToLast(1).on("value", function (lastMsg) {
                            let data = {
                                avatar: account.val().avatar,
                                fullname: account.val().fullname,
                                chat: lastMsg.val()
                            }
                            resolve(data);
                        });
                    });
                }

            });
        } else if (req.params.mode == 'group') {
            db.ref("messages/" + req.params.mode + "/" + req.params.id + "/info").on("value", function (info) {
                if (req.query.me == undefined) {
                    resolve('Đừng phá nữa my fen :))');
                } else {
                    db.ref("messages/" + req.params.mode + "/" + req.params.id + "/messages").limitToLast(1).on("value", function (lastMsg) {
                        let data = {
                            avatar: info.val().avatar,
                            fullname: info.val().name,
                            chat: lastMsg.val()
                        }
                        resolve(data);
                    });
                }
            });
        }
    });
    res.send(rs);
};

exports.searchUser = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts").orderByChild("id").equalTo(parseInt(req.params.id)).on("value", function (snapshot) {
            resolve(snapshot.val());
        });
    });
    if (rs != null) {
        for (var key in rs) {
            if (rs.hasOwnProperty(key)) {
                let data = {
                    avatar: rs[key].avatar,
                    birthday: rs[key].birthday,
                    createdAt: rs[key].createdAt,
                    email: rs[key].email,
                    fullname: rs[key].fullname,
                    gender: rs[key].gender,
                    id: rs[key].id,
                    username: rs[key].username
                }
                res.send(data);
            }
        }
    } else {
        res.json({
            code: 404,
            message: 'Không có kết quả tìm kiếm!'
        });
    }
}

exports.sendMsg = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        var id = microtime.now();
        db.ref("messages/" + req.body.mode + "/" + id + "/info").set({
            client: req.body.idClient,
            key: req.body.idKey
        });
        db.ref("messages/" + req.body.mode + "/" + id + "/messages/" + microtime.now()).set({
            id: req.body.idKey,
            msg: req.body.msg,
            createdAt: Date.now()
        });
        db.ref("accounts/" + req.body.idKey + "/chatlist").update({
            [id]: req.body.mode
        });
        db.ref("accounts/" + req.body.idClient + "/chatlist").update({
            [id]: req.body.mode
        });
        resolve(id);
    });
    res.send('/' + req.body.mode + '/' + rs);
}

exports.sendMsgGr = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        var id = microtime.now();
        db.ref("messages/" + req.body.mode + "/" + id + "/info").set({
            avatar: req.body.avatar,
            listUser: req.body.listUser,
            name: req.body.name
        });
        db.ref("messages/" + req.body.mode + "/" + id + "/messages/" + microtime.now()).set({
            id: req.body.idKey,
            msg: req.body.msg,
            createdAt: Date.now()
        });
        db.ref("accounts/" + req.body.idKey + "/chatlist").update({
            [id]: req.body.mode
        });
        db.ref("accounts/" + req.body.idClient + "/chatlist").update({
            [id]: req.body.mode
        });
        resolve(id);
    });
    res.send('/' + req.body.mode + '/' + rs);
}

exports.saveAvt = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("/accounts/" + req.params.id + "/avatar").set(req.body.url);
        resolve('Update avatar success!');
    });
    res.send(req.body.url);
}

exports.sendMsgGr = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        var id = microtime.now();
        db.ref("messages/" + req.body.mode + "/" + id + "/info").set({
            avatar: req.body.avt,
            name: req.body.name,
            key: req.body.idKey
        });
        db.ref("messages/" + req.body.mode + "/" + id + "/messages/" + microtime.now()).set({
            id: req.body.idKey,
            msg: req.body.msg,
            createdAt: Date.now()
        });
        var lus = JSON.parse(req.body.listUser);
        for (const i in lus) {
            db.ref("messages/" + req.body.mode + "/" + id + "/info/listUser").update({
                [lus[i]]: req.body.mode
            });
            db.ref("accounts/" + lus[i] + "/chatlist").update({
                [id]: req.body.mode
            });
        }
        db.ref("accounts/" + req.body.idKey + "/chatlist").update({
            [id]: req.body.mode
        });
        resolve(id);
    });
    res.send('/' + req.body.mode + '/' + rs);
}

exports.rename = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("/accounts/" + req.body.id + "/fullname").set(req.body.name);
        resolve('Đổi tên thành công!');
    });
    res.send(rs);
}

exports.repass = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts").orderByChild("id").equalTo(parseInt(req.body.id)).on("value", function (snapshot) {
            resolve(snapshot.val());
        });
    });
    if (rs != null) {
        for (var key in rs) {
            if (rs.hasOwnProperty(key)) {
                var password = crypto.AES.decrypt(rs[key].password, 'iSilent').toString(crypto.enc.Utf8);
                if (req.body.oldpass == password) {
                    db.ref("/accounts/" + req.body.id + "/password").set(crypto.AES.encrypt(req.body.newpass, 'iSilent').toString());
                    res.json({
                        code: 200,
                        message: 'Đổi mật khẩu thành công!'
                    });;
                } else {
                    res.json({
                        code: 409,
                        message: 'Mật khẩu cũ không chính xác!'
                    });;
                }
            }
        }
    } else {
        res.json({
            code: 404,
            message: 'Không tìm thấy user!'
        });
    }
}

exports.updateAccount = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts").orderByChild("username").equalTo(req.params.username).on("value", function (snapshot) {
            if (snapshot.val() != null || snapshot.val() != undefined) {
                var obj = snapshot.val();
                for (var key in obj) {
                    var value = obj[key];
                    if (value.status == 1) {
                        var claims = {
                            "username": value.username,
                            "id": value.id
                        }
                        var jwt = nJwt.create(claims, "secret", "HS256");
                        var token = jwt.compact();
                        resolve({
                            id: value.id,
                            token: token,
                            username: value.username,
                            avatar: value.avatar,
                            fullname: value.fullname,
                            gender: value.gender,
                            birthday: value.birthday,
                            email: value.email,
                            chatlist: value.chatlist
                        });
                    }
                }
            }
        });
    });
    res.send(rs);
}

exports.getListUser = async function (req, res) {
    let rs = await new Promise((resolve, reject) => {
        var list = [];
        var count = 0;
        db.ref("messages/" + req.params.mode + "/" + req.params.id + "/info").on("value", function (listUser) {
            db.ref("accounts/" + listUser.val().key).on("value", function (snapshot) {
                let data = {
                    avatar: snapshot.val().avatar,
                    username: snapshot.val().username,
                    fullname: snapshot.val().fullname,
                    gender: snapshot.val().gender,
                    email: snapshot.val().email,
                    birthday: snapshot.val().birthday
                }
                list.push(data);
            });
            for (var key in listUser.val().listUser) {
                if (listUser.val().listUser.hasOwnProperty(key)) {
                    db.ref("accounts/" + key).on("value", function (snapshot) {
                        let data = {
                            id: snapshot.val().id,
                            avatar: snapshot.val().avatar,
                            username: snapshot.val().username,
                            fullname: snapshot.val().fullname,
                            gender: snapshot.val().gender,
                            email: snapshot.val().email,
                            birthday: snapshot.val().birthday
                        }
                        list.push(data);
                        if(count == Object.keys(listUser.val().listUser).length - 1) {
                            resolve(list);
                        }
                        count++;
                    });
                }
            };
        });
    });
    res.send(rs);
}

exports.getListUserAdmin = async function(req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts").on("value", function (snapshot) {
            resolve(snapshot.val());
        });
    });
    res.send(rs);
};

exports.removeUserFromChatGr = async function(req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("messages/" + req.params.mode + "/" + req.params.id + "/info/listUser/" + req.body.idremove).remove();
        db.ref("accounts/" + req.body.idremove + "/chatlist/" + req.params.id).remove();
        resolve('Xóa thành công!');
    });
    res.send(rs);
};

exports.addUserFromChatGr = async function(req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("messages/" + req.params.mode + "/" + req.params.id + "/info/listUser").update({
            [req.body.idadd]: req.params.mode
        });
        db.ref("accounts/" + req.body.idadd + "/chatlist").update({
            [req.params.id]: req.params.mode
        });
        resolve('Thêm thành công!');
    });
    res.send(rs);
};

exports.renameChatGr = async function(req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("messages/" + req.params.mode + "/" + req.params.id + "/info/name").set(req.body.name);
        resolve('Đổi tên thành công!');
    });
    res.send(rs);
};

exports.deleteChat = async function(req, res) {
    let rs = await new Promise((resolve, reject) => {
        db.ref("accounts/" + req.body.idme + "/chatlist/" + req.params.id).remove();
        resolve('Xóa trò chuyện thành công!');
    });
    res.send(rs);
};