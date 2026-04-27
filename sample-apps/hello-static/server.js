const { createServer } = require("node:http");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const port = Number(process.env.PORT || 3000);
const html = readFileSync(join(__dirname, "index.html"), "utf8");

createServer((_, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(port, "0.0.0.0", () => {
  console.log(`hello-static listening on ${port}`);
});
