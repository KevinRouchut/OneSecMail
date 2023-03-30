import { pathToFileURL } from "node:url";
import { configure, processCliArgs, run } from "@japa/runner";
import { expect } from "@japa/expect";
import { specReporter } from "@japa/spec-reporter";

configure({
  ...processCliArgs(process.argv.slice(2)),
  files: ["test/**/*.spec.ts"],
  plugins: [expect()],
  reporters: [specReporter()],
  importer: (filePath) => import(pathToFileURL(filePath).href),
});

run();
