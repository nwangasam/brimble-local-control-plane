const fastify = require("fastify")({
  logger: true,
});

const port = Number(process.env.PORT || 3000);

fastify.get("/", async () => ({
  app: "hello-fastify",
  status: "ok",
  port,
  message: "Fastify sample running behind the local control plane.",
}));

fastify.listen({ port, host: "0.0.0.0" }).catch((error) => {
  fastify.log.error(error);
  process.exit(1);
});
