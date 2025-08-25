export type NumberVariableSpec = {
  type: "number";
  label?: string;
  range: [number, number];
  value: number;
  step?: number;
  format?: "number" | "percent" | "multiplier";
};

export type NormalVariableSpec = {
  label?: string;
  type: "normal";
  value: [number, number, number];
};

export type VariableSpec = NumberVariableSpec | NormalVariableSpec;

export type VariableDict = {
  [key: string]: VariableSpec;
};

export type VariableValues = {
  [key: string]: VariableSpec["value"];
};
