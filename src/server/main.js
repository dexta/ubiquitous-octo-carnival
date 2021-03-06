var http = require('http');
var path = require('path');

var async = require('async');

var config = require('./config.js');
config.lang = 'de';
var db = require('./mysqlServer.js');

var express = require('express');
var router = express();

var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

router.use(bodyParser.json());
router.use(expressValidator([]));

var smtpConfig = {
    host: config.smtp.host,
    port: 587,
    auth: {
        user: config.smtp.email,
        pass: config.smtp.pass
    }
};


var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var transporter = nodemailer.createTransport(smtpTransport(smtpConfig));

var Pass = require('./passport.js');
var pass = new Pass(router,db);

var fileUpload = require('./upload.js');
var upload = new fileUpload(router,db);

var userAgent = require('./userAgent.js');
var userService = new userAgent(router,pass,db);

router.staticFiles = function staticFiles(staticPath) {
  router.use(express.static(path.resolve(staticPath)));
};

router.post('/',
  function(req,res) {
    res.send('Wrong Way !!!1!!1!!');
});

router.get('/testMail',
  function(req,res) {
    var mailOptions = {
      from: '"Password Reset" <not-here@zazer.de>', // sender address
      to: 'dexta.de@gmail.com, root@dexta.de', // list of receivers
      subject: 'Hello dexta ✔', // Subject line
      text: 'Hello world ? we send in plain Text', // plaintext body
      html: '<b>Hello world ?</b><br><h1>dexta was here !1</h1>'+(new Date()) // html body
    };
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        return console.log(error);
      }
      res.send(info.response)
    });
    // setTimeout(function(){return res.send('Timeout');},1000);
});


router.post('/loginLocal',
  pass.port.authenticate('local'),
  function(req,res){
    res.send(req.session["passport"]);
});

router.get('/user',
  pass.port.ensureAuthenticated,
  function(req,res){
    res.send(req.session["passport"]);
});

router.get('/logout', function(req, res){
  req.logout();
  res.send({logout:true});
});

router.get('/error',function(req,res){
  res.send('You are OUT !!1!');
});


router.get('/get/series/seen',
  pass.port.ensureAuthenticated,
  function(req,res){
  console.log("session Passport "+JSON.stringify(req.session["passport"].user.sqlId) );
  var outoff = {};
  var uid = req.session["passport"].user.sqlId||0;
  var queryStr = 'select series_id,date from seen_serie where user_id = '+uid+';';
  db.query(queryStr,function(rows){
    for(var s in rows) {
      outoff[rows[s].series_id] = rows[s];
    }
    res.send(outoff);
  });  
});

module.exports = router;