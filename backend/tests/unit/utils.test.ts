import { describe, it, expect } from "bun:test";
import { formatCurrency, calculateProfitLoss } from "../../src/utils/utils";

describe("Utils", () => {
  describe("formatCurrency", () => {
    it("should format USD currency correctly", () => {
      expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
      expect(formatCurrency(0, "USD")).toBe("$0.00");
      expect(formatCurrency(-123.45, "USD")).toBe("-$123.45");
    });

    it("should format EUR currency correctly", () => {
      expect(formatCurrency(1234.56, "EUR")).toBe("€1,234.56");
    });

    it("should handle zero values", () => {
      expect(formatCurrency(0, "USD")).toBe("$0.00");
    });
  });

  describe("calculateProfitLoss", () => {
    it("should calculate profit correctly", () => {
      const result = calculateProfitLoss(100, 120, 10);
      expect(result.profit).toBe(200);
      expect(result.percentage).toBe(20);
    });

    it("should calculate loss correctly", () => {
      const result = calculateProfitLoss(100, 80, 10);
      expect(result.profit).toBe(-200);
      expect(result.percentage).toBe(-20);
    });

    it("should handle zero quantity", () => {
      const result = calculateProfitLoss(100, 120, 0);
      expect(result.profit).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });
});
