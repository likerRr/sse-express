module.exports = exports = sseMiddleware;

/**
 * Middleware that adds support of Server Sent Events
 * @param __
 * @param res
 * @param next
 * @void
 */
function sseMiddleware(__, res, next) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const handshakeInterval = setInterval(() => {
    res.write(': sse-handshake');
  }, 3000);

  res.on('finish', () => clearInterval(handshakeInterval));
  res.on('close', () => clearInterval(handshakeInterval));

  /**
   * Add function to response which allow to send events to the client
   * @param evt
   * @param json
   * @param [id]
   */
  res.sse = (evt, json, id) => {
    res.write('\n');

    if (id) {
      res.write(`id: ${id}\n`);
    }

    res.write(`retry: 3000\n`);
    res.write(`event: ${evt}\n`);
    res.write(`data: ${JSON.stringify(json)}\n\n`);
  };
  next();
}
