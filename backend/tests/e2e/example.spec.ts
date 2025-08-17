import { test, expect } from "@playwright/test";

test.describe("Trade Bot API", () => {
  test("health check endpoint returns 200", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.status()).toBe(200);
  });

  test("API returns JSON response", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.headers()["content-type"]).toContain("application/json");
  });

  test("health endpoint returns expected structure", async ({ request }) => {
    const response = await request.get("/health");
    const data = (await response.json()) as Record<string, string>;

    expect(data).toHaveProperty("status");
    expect(data.status).toBe("ok");
    expect(data).toHaveProperty("timestamp");
    expect(typeof data.timestamp).toBe("string");
  });
});
