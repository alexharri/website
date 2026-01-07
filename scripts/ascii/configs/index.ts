import { defaultConfig } from "./default";
import { simpleDirectionalCrunch } from "./simple-directional-crunch";
import { sixSamplesConfig } from "./six-samples";
import { twoSamplesConfig } from "./two-samples";
import { pixelShortConfig } from "./pixel-short";

export const configs = {
  default: defaultConfig,
  "simple-directional-crunch": simpleDirectionalCrunch,
  "pixel-short": pixelShortConfig,
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
