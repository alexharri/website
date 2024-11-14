import { describe, it, expect } from "vitest";
import { applyPrettyTypography } from "./typography";

describe("applyPrettyTypography", () => {
  const EM_DASH = "—";

  const LDQ = "“"; // Left double quote
  const RDQ = "”"; // Right double quote

  const LSQ = "\u2018"; // Left single quote
  const RSQ = "\u2019"; // Right single quote

  function check(value: string, expected: string) {
    expect(applyPrettyTypography(value, "\n", "\n")).toEqual(expected);
  }

  it("replaces two dashes with an em dash", () => {
    check("--", EM_DASH);
    check("Yes -- that sounds great", `Yes ${EM_DASH} that sounds great`);
    check("Here is a quote--no space", `Here is a quote${EM_DASH}no space`);
    check(
      "One em dash -- two em dashes -- this works!",
      `One em dash ${EM_DASH} two em dashes ${EM_DASH} this works!`,
    );
  });

  it("replaces double quotes with open and close double quotes", () => {
    check('"Hello, world"', `${LDQ}Hello, world${RDQ}`);
    check('"Hello, world."', `${LDQ}Hello, world.${RDQ}`);
    check('"Hello, world!".', `${LDQ}Hello, world!${RDQ}.`);
    check('random " quote', `random ${RDQ} quote`);
  });

  it("replaces single quotes with open and close single quotes", () => {
    check("'Hello, world'", `${LSQ}Hello, world${RSQ}`);
    check("'Hello, world.'", `${LSQ}Hello, world.${RSQ}`);
    check("'Hello, world!'.", `${LSQ}Hello, world!${RSQ}.`);
    check("random ' apos", `random ${RSQ} apos`);
  });

  it("handles nested double and single quotes", () => {
    check(
      `He said "yes, that's what he said -- 'yada yada'."`,
      `He said ${LDQ}yes, that${RSQ}s what he said ${EM_DASH} ${LSQ}yada yada${RSQ}.${RDQ}`,
    );
  });

  it("replaces apostrophes with a pretty apostrophe", () => {
    check("Here's", `Here${RSQ}s`);
    check("He's there's groups' things", `He${RSQ}s there${RSQ}s groups${RSQ} things`);
    check("Back in ''99", `Back in ${RSQ}99`); // Use double '' to indicate
  });
});
