import { defaultConfig } from "./default";
import { programmingConfig } from "./programming";
import { pixelConfig } from "./pixel";
import { pixelShortConfig } from "./pixel-short";
import { getAvailableAlphabets, AlphabetName } from "../../../src/components/AsciiRenderer/alphabets/AlphabetManager";

export const configs = {
  default: defaultConfig,
  programming: programmingConfig,
  pixel: pixelConfig,
  "pixel-short": pixelShortConfig,
} as const;

// Derive config names from AlphabetManager - they should match
export type ConfigName = AlphabetName;

export function getConfig(name: ConfigName) {
  return configs[name];
}

export function getAllConfigs() {
  return Object.values(configs);
}

export function getAvailableConfigNames(): ConfigName[] {
  return getAvailableAlphabets();
}

// Validation function to ensure configs match alphabets
export function validateConfigs() {
  const availableAlphabets = new Set(getAvailableAlphabets());
  const configNames = new Set(Object.keys(configs));
  
  const missingConfigs = [...availableAlphabets].filter(name => !configNames.has(name));
  const extraConfigs = [...configNames].filter(name => !availableAlphabets.has(name as AlphabetName));
  
  if (missingConfigs.length > 0 || extraConfigs.length > 0) {
    throw new Error(
      `Config/Alphabet mismatch:\n` +
      `Missing configs: ${missingConfigs.join(', ')}\n` +
      `Extra configs: ${extraConfigs.join(', ')}`
    );
  }
}
