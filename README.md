# SSE express :satellite:
[Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) middleware implementation for [express](http://expressjs.com/)

# Install
`npm install --save sse-express`

The package requires `express`, because it was created directly for the framework. Also it utilizes `ES6` features, so be sure that `node` v5.0+ is installed.

# Usage
Use it simply a middleware for any of your routes. When is used as middleware method `sse()` is added to response object of the route. You can use it to send messages to a client.

```javascript
let sseExpress = require('./sse-express');
//...
app.get('/updates', sseExpress(), function(req, res) {
    res.sse('connected', {
      welcomeMsg: 'Hello world!'
    });
});
```

At the client side you can listen to message through `EventSource` instance:

```javascript
let eventSource = new EventSource('http://localhost:80/updates');

eventSource.addEventListener('connected', (e) => {
    console.log(e.data.welcomeMsg);
    // => Hello world!
});
```

> **Important!** Don't forget to check out browser compatibility of `EventSource`. At the moment it doesn't implemented in any versions of IE.

By default every 3000ms a handshake message will be sent to the client to not allow a browser lose a connection. Handshake message is just a comment that will not be caught by any of `EventSource`'s events.
You can configure the interval by passing `handshake-interval` query when initializing event source:

```javascript
let eventSource = new EventSource('http://localhost:80/updates?handshake-interval=1000');
```

Or/and you can configure a handshake interval on server side:

```javascript
let sseExpress = require('./sse-express');
//...
app.use(sseExpress({handshakeInterval: 1000}));
```

The priority of choosing which interval to use is (from low to high):

1. Default value
2. Server config
3. Client's query

#### Useful references about `EventSource`
* [MDN - Receiving events from the server](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
* [Stream Updates with Server-Sent Events](http://www.html5rocks.com/en/tutorials/eventsource/basics/#toc-reconnection-timeout)

# API
#### res.sse(evt, json, id)
`evt` - is event name
`json` - object that will be sent as json string to a client
`[id]` - optional id of event

## [MIT License](http://likerrr.mit-license.org/)