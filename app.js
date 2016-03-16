var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();
var expressWs = require('express-ws')(app); //app = express app 
var SocketStore = require('./sockets/socket-store');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var store = new SocketStore;


app.ws('/mon', function(ws ,req) {
  ws.on('message', function(msg) {
    var msgJson = JSON.parse(msg);
    if(msgJson.type === 'subscription') {
      store.setSubscriptions(ws, msgJson.value);
    }
  });

  ws.on('close', function() {
    store.removeSocket(ws);
  })

  store.addSocket(ws);
});

var streamListener;

require('./stream/stream-consumer')('10.12.4.60:2181', function(consumer) {
  streamListener = consumer;

  consumer.on('message', function(msg) {
    store.pushMessage(msg);
  });

  consumer.on('error', function(err) {
    console.log(err);
  });
});


process.on('SIGINT', function() {
    streamListener.close(true, function(){
        process.exit();
    })
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(3000);
module.exports = app;
