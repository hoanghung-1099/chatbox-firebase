'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto-js');
const cors = require('cors')
const path = require('path');
require('dotenv').config();

var admin = require("firebase-admin");

var serviceAccount = require("./chatbox.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://chatboxdb.firebaseio.com"
});

var database = admin.database();

var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('./public'));

var userRoute = require('./routes/userRoute')
userRoute(app);

app.get('/', function (req, res) {
  res.sendFile(path.resolve('./public/index.html'));
});
app.listen(process.env.PORT, function () {
  console.log(`Server connect success. PORT ${process.env.PORT}`);
});