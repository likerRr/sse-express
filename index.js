module.exports = exports = sseMiddlewareFactory;

const HANDSHAKE_QUERY = 'handshake-interval';
const RETRY_QUERY = 'retry';
const LAST_EVENT_ID_QUERY = 'lastEventId';
const LAST_EVENT_ID_HEADER = 'last-event-id';
const defaultConfig = {
  handShakeInterval: 3000,
  // https://www.w3.org/TR/eventsource/#concept-event-stream-reconnection-time
  retry: 3000
};

/**
 * Middleware that adds support of Server Sent Events
 * @param {{handShakeInterval: number, retry: number}} options
 * @void
 */
function sseMiddlewareFactory(options = defaultConfig) {
  return (req, res, next) => {
    const config = {
      handShakeInterval: req.query[HANDSHAKE_QUERY] || options.handShakeInterval || defaultConfig.handShakeInterval,
      retry: req.query[RETRY_QUERY] || options.retry || defaultConfig.retry
    };

    establishConnection(res, config);

    res.sse = sse(res, config);

    Object.defineProperty(res.sse, 'lastEventId', {
      writable: false,
      value: req.get(LAST_EVENT_ID_HEADER) || req.query[LAST_EVENT_ID_QUERY] || res.sse.lastEventId
    });

    next();
  }
}

/**
 * Sends proper headers to keep connection alive. Also starts a time which periodically sends handshake event
 * @param res
 * @param config
 */
function establishConnection(res, config) {
  keepAlive(res);
  setHandshakeInterval(res, config.handShakeInterval);
}

/**
 * Returns function which sends "server sent event" to client
 * @param res
 * @param {{handShakeInterval: number, retry: number}} config
 * @returns {function({data: string, [event]: string, [id]: string}|Array<{data: string, [event]: string, [id]: string}>)}
 */
function sse(res, config) {
  return (message) => {
    if (Array.isArray(message)) {
      message = message.map(msg => configureStreamObject(msg, config));
    } else {
      message = configureStreamObject(message, config);
    }

    const eventStream = buildEventStream(message);
    // Retrieve message
    const singleMessage = Array.isArray(message) ? message[message.length - 1] : message;

    if (singleMessage.id) {
      res.sse.lastEventId = singleMessage.id;
    }

    res.write(eventStream);
  };
}

/**
 * Add/modify message from config
 * @param message
 * @param retry
 * @returns {*}
 */
function configureStreamObject(message, {retry}) {
  message.retry = retry;

  return message;
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
  let message = `retry: ${retry}\n`;

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
 * Sends headers to keep connection alive
 * @param res
 */
function keepAlive(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
}

/**
 * Periodically sends messages to client to keep connection alive
 * @param res
 * @param updateInterval
 */
function setHandshakeInterval(res, updateInterval) {
  const handshakeInterval = setInterval(() => res.write(': sse-handshake'), updateInterval);

  res.on('finish', () => clearInterval(handshakeInterval));
  res.on('close', () => clearInterval(handshakeInterval));
}