var controller = require('../controller/messageController');

module.exports = function(app){
    app.route('/login')
        .post(controller.login);
    app.route('/create')
        .get(controller.checkExistsUsername)
        .post(controller.createAccount);
    app.route('/sendmsg')
        .post(controller.loginRequired, controller.saveMessage);
    app.route('/avatar/:id')
        .get(controller.getAvatar)
        .post(controller.loginRequired, controller.saveAvt);
    app.route('/info/:id')
        .get(controller.getInfo);
    app.route('/list/:mode/:id')
        .get(controller.loginRequired, controller.listMessage);
    app.route('/search/user/:id')
        .get(controller.loginRequired, controller.searchUser);
    app.route('/createMsg')
        .post(controller.loginRequired, controller.sendMsg);
    app.route('/createMsgGr')
        .post(controller.loginRequired, controller.sendMsgGr);
    app.route('/help')
        .get(controller.help);
    app.route('/createMsgGr')
        .post(controller.loginRequired, controller.sendMsgGr);
    app.route('/rename')
        .post(controller.loginRequired, controller.rename);
    app.route('/repass')
        .post(controller.loginRequired, controller.repass);
    app.route('/update/:username/:id')
        .get(controller.loginRequired, controller.updateAccount);
    app.route('/chat/:mode/:id')
        .get(controller.loginRequired, controller.getListUser);
    app.route('/admin/list/user')
        .get(controller.loginRequired, controller.getListUserAdmin);
    app.route('/remove/:mode/:id')
        .post(controller.loginRequired, controller.removeUserFromChatGr);
    app.route('/add/:mode/:id')
        .post(controller.loginRequired, controller.addUserFromChatGr);
    app.route('/rename/:mode/:id')
        .post(controller.loginRequired, controller.renameChatGr);
    app.route('/delete/:mode/:id')
        .post(controller.loginRequired, controller.deleteChat);
};