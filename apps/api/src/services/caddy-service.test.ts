import assert from "node:assert/strict";
import test from "node:test";

import { renderRouteSnippet } from "./caddy-service.js";

test("renderRouteSnippet creates redirect and reverse proxy blocks for a deployment path", () => {
  const snippet = renderRouteSnippet("/d/dep_123", "brimble-dep_123:3000");

  assert.equal(
    snippet,
    [
      "redir /d/dep_123 /d/dep_123/ 308",
      "",
      "handle_path /d/dep_123/* {",
      "  reverse_proxy brimble-dep_123:3000",
      "}",
      ""
    ].join("\n")
  );
});
