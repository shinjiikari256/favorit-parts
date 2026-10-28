import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { BREAKPOINTS } from "@/config/breakpoints";

describe("BREAKPOINTS", () => {
  it("совпадают с --breakpoint-* в styles/breakpoints.css", () => {
    const css = readFileSync("src/styles/breakpoints.css", "utf8");
    const fromCss = Object.fromEntries(
      [...css.matchAll(/--breakpoint-([\w-]+):\s*(\d+)px/g)].map(([, name, px]) => [name, Number(px)]),
    );
    expect(BREAKPOINTS).toEqual(fromCss);
  });
});
