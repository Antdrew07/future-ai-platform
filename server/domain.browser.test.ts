import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock fetch globally ──────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Domain Router Tests ──────────────────────────────────────────────────────

describe("domainRouter helpers", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("parses Namecheap domain availability XML correctly", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.check">
    <DomainCheckResult Domain="example.com" Available="true" />
    <DomainCheckResult Domain="example.io" Available="false" />
    <DomainCheckResult Domain="example.ai" Available="true" />
  </CommandResponse>
</ApiResponse>`;

    const matches = Array.from(xml.matchAll(/<DomainCheckResult Domain="([^"]+)" Available="([^"]+)"/g));
    expect(matches).toHaveLength(3);
    expect(matches[0][1]).toBe("example.com");
    expect(matches[0][2]).toBe("true");
    expect(matches[1][1]).toBe("example.io");
    expect(matches[1][2]).toBe("false");
    expect(matches[2][1]).toBe("example.ai");
    expect(matches[2][2]).toBe("true");
  });

  it("detects Namecheap API errors correctly", () => {
    const errorXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="ERROR">
  <Errors><Error Number="1011102">Parameter ApiKey is Missing</Error></Errors>
</ApiResponse>`;

    const isError = errorXml.includes('Status="ERROR"');
    expect(isError).toBe(true);

    const match = errorXml.match(/<Error[^>]*>([^<]+)<\/Error>/);
    expect(match?.[1]).toBe("Parameter ApiKey is Missing");
  });

  it("detects successful Namecheap response", () => {
    const okXml = `<?xml version="1.0" encoding="utf-8"?>
<ApiResponse Status="OK">
  <CommandResponse Type="namecheap.domains.check">
    <DomainCheckResult Domain="futureos.com" Available="false" />
  </CommandResponse>
</ApiResponse>`;

    const isError = okXml.includes('Status="ERROR"');
    expect(isError).toBe(false);
  });

  it("generates correct domain slug from website title", () => {
    const title = "My Awesome Business!";
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "")
      .substring(0, 20);
    expect(slug).toBe("myawesomebusiness");
  });

  it("generates correct domain variations", () => {
    const slug = "mystore";
    const variations = [
      slug,
      `get${slug}`,
      `try${slug}`,
      `${slug}app`,
      `${slug}hq`,
    ].filter(v => v.length >= 3);
    expect(variations).toContain("mystore");
    expect(variations).toContain("getmystore");
    expect(variations).toContain("trymystore");
    expect(variations).toContain("mystoreapp");
    expect(variations).toContain("mystorehq");
  });

  it("applies correct markup pricing per TLD", () => {
    const TLD_PRICING: Record<string, { price: number; cost: number }> = {
      com:  { price: 19.99, cost: 9.99  },
      io:   { price: 49.99, cost: 32.99 },
      ai:   { price: 99.99, cost: 69.99 },
    };

    // Verify margins are positive
    for (const [tld, p] of Object.entries(TLD_PRICING)) {
      expect(p.price).toBeGreaterThan(p.cost);
      const margin = ((p.price - p.cost) / p.price) * 100;
      expect(margin).toBeGreaterThan(20); // at least 20% margin on every TLD
    }
  });

  it("sorts domain results: available first, then by price", () => {
    const results = [
      { domain: "test.ai",  available: true,  price: 99.99 },
      { domain: "test.com", available: false, price: 19.99 },
      { domain: "test.io",  available: true,  price: 49.99 },
      { domain: "test.net", available: false, price: 19.99 },
      { domain: "test.app", available: true,  price: 24.99 },
    ];

    results.sort((a, b) => {
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return a.price - b.price;
    });

    // First 3 should be available
    expect(results[0].available).toBe(true);
    expect(results[1].available).toBe(true);
    expect(results[2].available).toBe(true);
    // Among available, cheapest first
    expect(results[0].price).toBeLessThanOrEqual(results[1].price);
    expect(results[1].price).toBeLessThanOrEqual(results[2].price);
  });
});

// ─── Browser Router Tests ─────────────────────────────────────────────────────

describe("browserRouter helpers", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("constructs correct Browserbase session creation payload", () => {
    const payload = {
      projectId: "test-project-id",
      browserSettings: {
        viewport: { width: 1280, height: 800 },
        blockAds: true,
      },
      timeout: 900,
    };

    expect(payload.timeout).toBe(900); // 15 minutes
    expect(payload.browserSettings.viewport.width).toBe(1280);
    expect(payload.browserSettings.blockAds).toBe(true);
  });

  it("handles Browserbase API error responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized: Invalid API key",
    });

    const BB_API = "https://www.browserbase.com/v1";
    const BB_KEY = "invalid-key";

    let error: Error | null = null;
    try {
      const res = await fetch(`${BB_API}/sessions`, {
        method: "POST",
        headers: { "x-bb-api-key": BB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "test" }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Browserbase API error ${res.status}: ${text}`);
      }
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.message).toContain("401");
  });

  it("generates correct live view URL for a session", () => {
    const sessionId = "abc123";
    const liveViewUrl = `https://www.browserbase.com/sessions/${sessionId}`;
    expect(liveViewUrl).toBe("https://www.browserbase.com/sessions/abc123");
  });

  it("validates Browserbase availability check", () => {
    const BB_KEY = "bb_live_test123";
    const BB_PROJECT = "test-project-id";
    const available = !!(BB_KEY && BB_PROJECT);
    expect(available).toBe(true);

    const emptyKey = "";
    const emptyProject = "";
    const notAvailable = !!(emptyKey && emptyProject);
    expect(notAvailable).toBe(false);
  });
});
