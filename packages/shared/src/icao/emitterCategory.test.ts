import { describe, expect, it } from "vitest";
import {
  icaoCategoryLabel,
  icaoCategoryShortLabel,
  isIcaoEmitterCategory,
} from "./emitterCategory.js";

describe("emitterCategory", () => {
  describe("isIcaoEmitterCategory", () => {
    it("accepts official ICAO codes 0 through 20", () => {
      for (let code = 0; code <= 20; code += 1) {
        expect(isIcaoEmitterCategory(code)).toBe(true);
      }
    });

    it("rejects values outside the official range", () => {
      expect(isIcaoEmitterCategory(-1)).toBe(false);
      expect(isIcaoEmitterCategory(21)).toBe(false);
      expect(isIcaoEmitterCategory(1.5)).toBe(false);
    });
  });

  describe("icaoCategoryLabel", () => {
    it("returns the official label for a known code", () => {
      expect(icaoCategoryLabel(8)).toBe("Rotorcraft");
    });

    it("falls back to no information for unknown codes", () => {
      expect(icaoCategoryLabel(99)).toBe("No information at all");
    });
  });

  describe("icaoCategoryShortLabel", () => {
    it("returns a shorter panel label for a known code", () => {
      expect(icaoCategoryShortLabel(14)).toBe("Unmanned aerial vehicle");
    });

    it("falls back to no information for unknown codes", () => {
      expect(icaoCategoryShortLabel(-1)).toBe("No information");
    });
  });
});
