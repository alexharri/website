import { defaultConfig } from "./default";
import { programmingConfig } from "./programming";

export const configs = {
  default: defaultConfig,
  programming: programmingConfig,
} as const;

export type ConfigName = keyof typeof configs;

export function getConfig(name: ConfigName) {
  return configs[name];
}

export function getAllConfigs() {
  return Object.values(configs);
}
