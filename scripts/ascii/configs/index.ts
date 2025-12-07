import { defaultConfig } from "./default";
import { simpleDirectionalCrunch } from "./simple-directional-crunch";
import { threeSamplesConfig } from "./three-samples";
import { sixSamplesConfig } from "./six-samples";
import { twoSamplesConfig } from "./two-samples";
import { ascii60Config } from "./ascii-60";
import { pixelConfig } from "./pixel";
import { pixelShortConfig } from "./pixel-short";

export const configs = {
  default: defaultConfig,
  "simple-directional-crunch": simpleDirectionalCrunch,
  "ascii-60": ascii60Config,
  pixel: pixelConfig,
  "pixel-short": pixelShortConfig,
  "three-samples": threeSamplesConfig,
  "two-samples": twoSamplesConfig,
  "six-samples": sixSamplesConfig,
} as const;

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
