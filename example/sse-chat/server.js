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

  app.post('/sendMessage', (req, res) => {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*'
    });

    connections.forEach(function(connection) {
      connection.sse('message', {
        text: req.body.message,
        userId: req.body.userId
      });
    });

    res.end();
  });

  app.get('/updates', sseExpress, function(req, res) {
    connections.push(res);
    // send id to user
    res.sse('connected', {
      id: globalId
    });
    globalId++;

    req.on("close", function() {
      _.remove(connections, res);
      console.log('clients: ' + connections.length);
    });

    console.log(`Hello, ${globalId}!`);
  });

  app.listen(99, function () {
    console.log('Example app listening on port 99!');
  });
})();