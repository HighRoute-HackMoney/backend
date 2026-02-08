import express from "express";
import { createRouter } from "./shared/http/router";
import { loadConfig } from "./core/config/env";

/**
 * Bootstrap function that starts the backend HTTP server.
 */
function startServer() {
  const config = loadConfig();
  const app = express();

  app.use(express.json());
  app.use("/api", createRouter());

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`OpenClaw backend listening on port ${config.port}`);
  });
}

startServer();

