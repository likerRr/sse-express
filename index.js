module.exports = exports = sseMiddleware;

const handshakeQueryName = 'handshake-interval';
const defaultConfig = {
  handShakeInterval: 3000
};

/**
 * Middleware that adds support of Server Sent Events
 * @param {{handShakeInterval: number}} options
 * @void
 */
function sseMiddleware(options) {
  return (req, res, next) => {
    const config = {
      handShakeInterval: req.query[handshakeQueryName] || options.handShakeInterval || defaultConfig.handShakeInterval
    };

    res.sse = sse(res, config);

    next();
  }
}

/**
 * Encapsulates middleware's logic
 * @param res
 * @param {{handShakeInterval: number}} config
 * @returns {sendSse}
 */
function sse(res, config) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  keepAlive(res, config.handShakeInterval);

  return sendSse;
}

/**
 * Sends "server sent event"
 * Bound to http.ServerResponse
 * @param event
 * @param data
 * @param [id]
 */
function sendSse(event, data, id) {
  const eventStream = buildEventStream({data, event, id});

  this.write(eventStream);
}

/**
 * Builds event stream. Accept either field set or array of field sets
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format
 * @param {{data: *, event?: string, id?: string|number, retry?: number}|Array} fields
 * @returns {string}
 */
function buildEventStream(fields) {
  if (Array.isArray(fields)) {
    return fields.map(fieldSet => buildEventStream(fieldSet)).join('');
  }

  const {event, id, retry} = fields;
  let data = fields.data;
  let message = 'retry: 3000\n';

  if (id) {
    message += `id: ${id}\n`;
  }

  if (event) {
    message += `event: ${event}\n`;
  }

  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }

  message += `data: ${data}\n\n`;

  return message;
}

/**
 * Periodically sends messages to client to keep connection alive
 * @param res
 * @param updateInterval
 */
function keepAlive(res, updateInterval) {
  const handshakeInterval = setInterval(() => res.write(': sse-handshake'), updateInterval);

  res.on('finish', () => clearInterval(handshakeInterval));
  res.on('close', () => clearInterval(handshakeInterval));
}