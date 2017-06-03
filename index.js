module.exports = exports = sseMiddleware;

/**
 * Middleware that adds support of Server Sent Events
 * @param req
 * @param res
 * @param next
 * @void
 */
function sseMiddleware(req, res, next) {
  res.sse = sse(res);

  next();
}

/**
 * Encapsulates middleware's logic
 * @param res
 * @returns {sendSse}
 */
function sse(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  keepAlive(res, 3000);

  return sendSse;
}

/**
 * Sends "server sent event"
 * Bound to http.ServerResponse
 * @param evt
 * @param json
 * @param [id]
 */
function sendSse(evt, json, id) {
  const res = this;

  res.write('\n');

  if (id) {
    res.write(`id: ${id}\n`);
  }
  if (evt) {
    res.write(`event: ${evt}\n`);
  }
  res.write(`retry: 3000\n`);
  res.write(`data: ${JSON.stringify(json)}\n\n`);
}

/**
 * Periodically sends messages to client to keep connection alive
 * @param res
 * @param updateInterval
 */
function keepAlive(res, updateInterval) {
  const handshakeInterval = setInterval(() => res.write(': sse-handshake'), updateInterval);

  res.on('finish', clearInterval(handshakeInterval));
  res.on('close', clearInterval(handshakeInterval));
}