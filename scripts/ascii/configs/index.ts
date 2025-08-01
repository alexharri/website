import { defaultConfig } from "./default";
import { denseConfig } from "./dense";
import { programmingConfig } from "./programming";

export { Config } from "../types";

export const configs = {
  default: defaultConfig,
  dense: denseConfig,
  programming: programmingConfig,
} as const;

export type ConfigName = keyof typeof configs;

export function getConfig(name: ConfigName) {
  return configs[name];
}

export function getAllConfigs() {
  return Object.values(configs);
}