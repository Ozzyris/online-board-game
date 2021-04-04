// PACKAGES
const express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server, { 
        cors: {
            origin: "http://192.168.86.120:4200",
            methods: ["GET", "POST"],
        },
        "close timeout": 300,
        "heartbeat timeout": 300,
        "heartbeat interval": 15,
    }),
    config = require('./config'),    
    morgan = require('morgan');

//HELPERS
const littlebirds = require('./helpers/littlebirds');

// CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token");
    if ('OPTIONS' == req.method){
        res.sendStatus(200);
    }else{
        next();
    }
});

//SOCKET.IO
littlebirds.init_socket_io( io );

// MORGAN LOGGING THE CALLS
app.use(morgan('dev'));

// ROUTES
app.use('/activity', require('./controllers/activity').activity);
app.use('/game', require('./controllers/game').game);

// CONFIGURATION
server.listen(config.port);
