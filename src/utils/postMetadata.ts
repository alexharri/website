import { applyPrettyTypography } from "./typography";

export function adjustPostMetadata(data: { [key: string]: any }): void {
  if (typeof data.title === "string") {
    data.title = applyPrettyTypography(data.title);
  }
  if (typeof data.description === "string") {
    data.description = applyPrettyTypography(data.description);
  }
}
