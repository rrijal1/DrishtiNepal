import { expect, test } from "@playwright/test";

test.describe("API Routes", () => {
  test("GET /api/search returns JSON", async ({ request }) => {
    const res = await request.get("/api/search?q=minister");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("results");
    expect(Array.isArray(json.results)).toBe(true);
  });

  test("GET /api/search rejects short query", async ({ request }) => {
    const res = await request.get("/api/search?q=a");
    const json = await res.json();
    // Should return empty or error for very short queries
    expect(res.status()).toBe(200);
    expect(json.results.length).toBe(0);
  });

  test("GET /api/search handles empty query", async ({ request }) => {
    const res = await request.get("/api/search?q=");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.results.length).toBe(0);
  });

  test("POST /api/moderate rejects invalid action", async ({ request }) => {
    const res = await request.post("/api/moderate", {
      data: {
        review_item_id: "test",
        action: "invalid_action",
        reviewer: "test",
      },
    });
    // Should return 400 or similar for invalid action
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("POST /api/moderate rejects missing fields", async ({ request }) => {
    const res = await request.post("/api/moderate", {
      data: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("POST /api/manifesto/[slug]/edit validates fields", async ({
    request,
  }) => {
    const res = await request.post("/api/manifesto/bp-001/edit", {
      data: {
        field: "invalid_field",
        proposed_text: "some text that is long enough",
        reason: "test reason",
        submitter_name: "Test User",
        submitter_email: "test@example.com",
      },
    });
    // Should reject invalid field
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("POST /api/manifesto/[slug]/edit rejects short text", async ({
    request,
  }) => {
    const res = await request.post("/api/manifesto/bp-001/edit", {
      data: {
        field: "item_text_en",
        proposed_text: "short",
        reason: "test",
        submitter_name: "Test User",
        submitter_email: "test@example.com",
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
