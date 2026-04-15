import { describe, expect, it } from "vitest";

describe("API Key Environment Variables", () => {
  it("OPENAI_API_KEY is set in environment", () => {
    const key = process.env.OPENAI_API_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect(key!.length).toBeGreaterThan(10);
  });

  it("ANTHROPIC_API_KEY is set in environment", () => {
    const key = process.env.ANTHROPIC_API_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect(key!.length).toBeGreaterThan(10);
  });

  it("STRIPE_SECRET_KEY is set in environment", () => {
    const key = process.env.STRIPE_SECRET_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect(key!.length).toBeGreaterThan(10);
  });
});
