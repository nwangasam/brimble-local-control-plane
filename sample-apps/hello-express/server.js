const express = require("express");

const app = express();
const port = Number(process.env.PORT || 3000);

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Hello Express</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          font-family: "IBM Plex Sans", sans-serif;
          background: #f7f7f5;
          color: #1d1f21;
        }
        main {
          width: min(680px, calc(100% - 48px));
          padding: 32px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          background: white;
        }
        code {
          background: #f0f1f2;
          padding: 0.15rem 0.4rem;
          border-radius: 6px;
        }
      </style>
    </head>
    <body>
      <main>
        <h1>Hello from Express</h1>
        <p>This sample uses an Express server to exercise a more common Node web-service shape.</p>
        <p>Port: <code>${port}</code></p>
      </main>
    </body>
  </html>`);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`hello-express listening on ${port}`);
});
