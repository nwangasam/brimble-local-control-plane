const port = Number(process.env.PORT || 3000);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hello from Brimble Demo</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background: linear-gradient(180deg, #0e141b, #18212b);
        color: #f4f7fb;
      }
      main {
        width: min(640px, calc(100% - 48px));
        padding: 32px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
      }
      h1 {
        margin-top: 0;
      }
      p {
        line-height: 1.6;
      }
      code {
        padding: 0.15rem 0.35rem;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Hello from the sample app</h1>
      <p>This app is intentionally small so Railpack can build it without a handwritten Dockerfile.</p>
      <p>If you can see this behind Caddy, the deployment route is working.</p>
      <p>Port: <code>${port}</code></p>
    </main>
  </body>
</html>`;

const { createServer } = require("node:http");

createServer((_, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(port, "0.0.0.0", () => {
  console.log(`hello-node listening on ${port}`);
});
