var admin = require("firebase-admin");
var database = admin.database();
var microtime = require("microtime");
var crypto = require("crypto-js");
var nJwt = require('njwt');

exports.saveUser = async function (req, res) {
    var id = microtime.now();
    database.ref(`accounts/${id}`).set({
        id: id,
        username: (req.body.username).toLowerCase(),
        password: crypto.AES.encrypt(req.body.password, 'ChatBox').toString(),
        email: (req.body.email).toLowerCase(),
        fullname: req.body.fullname,
        createdAt: new Date().toLocaleDateString(),
        status: 1
    });
    try {
        database.ref(`accounts/${id}`).on("value", (s, prevChildKey) => {
            res.status(201).json({
                code: 201,
                message: "Account created",
                data: s.val()
            });
        });
    } catch (error) {
        res.status(400).json({
            code: 400,
            message: "Account create failed",
            data: error
        });
    }
};

exports.checkExistsAccountByUsername = async function (req, res, next) {
    let result = await new Promise((resolve, reject) => {
        database.ref("accounts").orderByChild("username").equalTo((req.body.username).toLowerCase()).on("value", function (snapshot) {
            if (snapshot.val() != null || snapshot.val() != undefined) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });

    if (result) {
        next();
        return;
    } else {
        res.status(409).json({
            status: 409,
            message: "Account already exists",
            data: null
        });
    }
}

exports.login = async function (req, res) {
    await new Promise((resolve, reject) => {
        database.ref('accounts').orderByChild('username').equalTo((req.body.username).toLowerCase()).on('value', function (snapshot) {
            if (snapshot.val() != null || snapshot.val() != undefined) {
                var obj = snapshot.val();
                for (var key in obj) {
                    var value = obj[key];
                    var password = crypto.AES.decrypt(value.password, 'ChatBox').toString(crypto.enc.Utf8);
                    if (value.status == 1) {
                        if (req.body.password == password) {
                            var claims = {
                                "username": value.username,
                                "id": value.id
                            }
                            var jwt = nJwt.create(claims, "secret", "HS256");
                            var token = jwt.compact();
                            resolve({
                                status: 200,
                                message: "Login successfully",
                                data: {
                                    id: value.id,
                                    token: token,
                                    username: value.username,
                                    fullname: value.fullname,
                                    email: value.email
                                }
                            });
                        } else {
                            resolve({
                                status: 401,
                                message: "Username or password incorrect!",
                                data: null
                            });
                        }
                    } else if (value.status == 0) {
                        resolve({
                            status: 404,
                            message: "Account not found!",
                            data: null
                        });
                    }
                };
            } else {
                resolve({
                    status: 404,
                    message: "Account not found!",
                    data: null
                });
            }
        });
    }).then((rs) => {
        res.status(rs.status).json(rs);
    });
};