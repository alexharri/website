import { defaultConfig } from "./default";
import { threeSamplesConfig } from "./three-samples";
import { sixSamplesConfig } from "./six-samples";
import { twoSamplesConfig } from "./two-samples";
import { ascii60Config } from "./ascii-60";
import { programmingConfig } from "./programming";
import { pixelConfig } from "./pixel";
import { pixelShortConfig } from "./pixel-short";

export const configs = {
  default: defaultConfig,
  "ascii-60": ascii60Config,
  programming: programmingConfig,
  pixel: pixelConfig,
  "pixel-short": pixelShortConfig,
  "three-samples": threeSamplesConfig,
  "two-samples": twoSamplesConfig,
  "six-samples": sixSamplesConfig,
} as const;

// Configs are the single source of truth
export type ConfigName = keyof typeof configs;

export function getConfig(name: ConfigName) {
  return configs[name];
}

export function getAllConfigs() {
  return Object.values(configs);
}

export function getAvailableConfigNames(): ConfigName[] {
  return Object.keys(configs) as ConfigName[];
}
