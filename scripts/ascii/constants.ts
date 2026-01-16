import * as path from "path";

// Directory where generated alphabet files will be saved
export const ALPHABETS_OUTPUT_DIR = path.resolve(
  __dirname,
  "../../src/components/AsciiScene/alphabets",
);

// Ensure the directory exists
export function ensureOutputDirectory(): void {
  const fs = require("fs");
  if (!fs.existsSync(ALPHABETS_OUTPUT_DIR)) {
    fs.mkdirSync(ALPHABETS_OUTPUT_DIR, { recursive: true });
  }
}

// Helper functions to derive filenames from config name
export function getOutputFilename(configName: string): string {
  return `${configName}.json`;
}

export function getDebugDirectory(configName: string): string {
  return `debug-images/${configName}`;
}
