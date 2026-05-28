import http, { IncomingMessage, ServerResponse, RequestOptions } from 'http';

const PUBLIC_PORT = 3001;

const TARGET_HOST = 'localhost';

const TARGET_PORT = 8080;

http
  .createServer((req: IncomingMessage, res: ServerResponse) => {
    console.log(`➡️ ${req.method} ${req.url}`);

    const requestUrl = req.url || '/';

    // PAYMENTS + API → BACKEND
    if (requestUrl.startsWith('/payments') || requestUrl.startsWith('/api')) {
      const options: RequestOptions = {
        hostname: TARGET_HOST,

        port: TARGET_PORT,

        path: requestUrl,

        method: req.method,

        headers: req.headers,
      };

      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);

        proxyRes.pipe(res, {
          end: true,
        });
      });

      req.pipe(proxyReq, {
        end: true,
      });

      proxyReq.on('error', (err: Error) => {
        console.error('❌ Proxy error:', err.message);

        res.statusCode = 502;

        res.end('Bad gateway');
      });

      return;
    }

    // EVERYTHING ELSE → FRONTEND
    const safePath = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`;

    res.writeHead(302, {
      Location: `http://localhost:3000${safePath}`,
    });

    res.end();
  })
  .listen(PUBLIC_PORT, () => {
    console.log(`🚀 Redirect server running on ${PUBLIC_PORT}`);
  });
