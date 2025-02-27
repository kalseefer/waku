#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";

const require = createRequire(new URL(".", import.meta.url));

const { values, positionals } = parseArgs({
  args: process.argv.splice(2),
  allowPositionals: true,
  options: {
    config: {
      type: "string",
    },
    version: {
      type: "boolean",
      short: "v",
    },
    help: {
      type: "boolean",
      short: "h",
    },
  },
});

const cmd = positionals[0];

if (values.config) {
  if (!fs.existsSync(values.config)) {
    throw new Error("config file does not exist");
  } else {
    process.env.CONFIG_FILE = values.config;
  }
}

if (values.version) {
  const { version } = require("../package.json");
  console.log(version);
} else if (values.help) {
  displayUsage();
} else {
  switch (cmd) {
    case "dev":
      runDev();
      break;
    case "build":
      runBuild();
      break;
    case "start":
      runStart();
      break;
    default:
      if (cmd) {
        console.error("Unknown command:", cmd);
      }
      displayUsage();
      break;
  }
}

async function runDev() {
  const { default: express } = await import("express");
  const { rsc } = await import("./lib/middleware/rsc.js");
  const { devServer } = await import("./lib/middleware/devServer.js");
  const app = express();
  app.use(rsc({ mode: "development" }));
  app.use(devServer());
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.info("Listening on", port);
  });
}

async function runBuild() {
  const { build } = await import("./lib/builder.js");
  await build();
}

async function runStart() {
  const { default: express } = await import("express");
  const { resolveConfig } = await import("./lib/config.js");
  const config = await resolveConfig("serve");
  const { rsc } = await import("./lib/middleware/rsc.js");
  const app = express();
  app.use(rsc({ mode: "production" }));
  app.use(express.static(path.join(config.root, config.framework.outPublic)));
  (express.static.mime as any).default_type = "";
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.info("Listening on", port);
  });
}

function displayUsage() {
  console.log(`
Usage: waku [options] <command>

Commands:
  dev         Start the development server
  build       Build the application for production
  start       Start the production server

Options:
  -c, --config <path>   Path to the configuration file
  -v, --version         Display the version number
  -h, --help            Display this help message
`);
}
