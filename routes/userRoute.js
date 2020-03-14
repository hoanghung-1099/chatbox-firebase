var messageController = require('../controller/messageController');

module.exports = function(app){
    app.route('/user')
    .post(messageController.checkExistsAccountByUsername, messageController.saveUser)

    app.route('/login')
    .post(messageController.login)
};