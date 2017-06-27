(function() {
  'use strict';

  let path = require('path');
  let express = require('express');
  let http = require('http');
  let _ = require('lodash');
  let bodyParser = require('body-parser');
  let sseExpress = require('sse-express');

  let app = express();
  let globalId = 1;
  let connections = [];

  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  }));
  app.use((req, res, next) => {
    // setup cors headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  app.post('/sendMessage', (req, res) => {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*'
    });

    connections.forEach(function(connection) {
      connection.sse({
        event: 'message',
        data: {
          text: req.body.message,
          userId: req.body.userId
        },
        id: Date.now() + req.body.userId
      });
    });

    res.end();
  });

  app.get('/updates', sseExpress(), function(req, res) {
    connections.push(res);
    res.sse([{
      data: 'hello'
    }, {
      // send id to user
      event: 'connected',
      data: {
        id: globalId
      }
    }]);
    globalId++;

    req.on("close", function() {
      _.remove(connections, res);
      console.log('clients: ' + connections.length);
    });

    console.log(`Hello, ${globalId}!`);
  });

  app.listen(99, function() {
    console.log('Example app listening on port 99!');
  });
})();