import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { domainPurchases } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Namecheap API helpers (used for purchase only) ──────────────────────────

const NC_API = "https://api.namecheap.com/xml.response";
const NC_USER = process.env.NAMECHEAP_USERNAME ?? "";
const NC_KEY = process.env.NAMECHEAP_API_KEY ?? "";
const NC_IP = process.env.NAMECHEAP_CLIENT_IP ?? "37.77.53.49";

// Our markup pricing per TLD (we charge this, Namecheap costs ~60-70% of this)
const TLD_PRICING: Record<string, { price: number; cost: number; renewal: number }> = {
  com:   { price: 19.99,  cost: 9.99,  renewal: 19.99  },
  net:   { price: 19.99,  cost: 10.99, renewal: 19.99  },
  org:   { price: 17.99,  cost: 9.99,  renewal: 17.99  },
  io:    { price: 49.99,  cost: 32.99, renewal: 49.99  },
  co:    { price: 34.99,  cost: 22.99, renewal: 34.99  },
  ai:    { price: 99.99,  cost: 69.99, renewal: 99.99  },
  app:   { price: 24.99,  cost: 14.99, renewal: 24.99  },
  dev:   { price: 24.99,  cost: 14.99, renewal: 24.99  },
  info:  { price: 14.99,  cost: 7.99,  renewal: 14.99  },
  biz:   { price: 17.99,  cost: 9.99,  renewal: 17.99  },
};

// RDAP registries for each TLD (ICANN standard — no API key or IP whitelist needed)
const RDAP_REGISTRIES: Record<string, string> = {
  com:  "https://rdap.verisign.com/com/v1",
  net:  "https://rdap.verisign.com/net/v1",
  org:  "https://rdap.publicinterestregistry.org/rdap",
  io:   "https://rdap.nic.io",
  co:   "https://rdap.nic.co",
  ai:   "https://rdap.nic.ai",
  app:  "https://rdap.nic.google",
  dev:  "https://rdap.nic.google",
  info: "https://rdap.afilias.info",
  biz:  "https://rdap.nic.biz",
};

/**
 * Check domain availability via RDAP (ICANN standard protocol).
 * Returns true if available (404 = not registered), false if taken (200 = registered).
 * Falls back to "unknown" on network errors.
 */
async function checkDomainAvailabilityRDAP(domain: string): Promise<boolean> {
  const tld = domain.split(".").slice(1).join(".");
  const registry = RDAP_REGISTRIES[tld];
  if (!registry) return true; // Unknown TLD — assume available
  try {
    const res = await fetch(`${registry}/domain/${domain}`, {
      signal: AbortSignal.timeout(5000),
    });
    // 404 = not found in registry = available
    // 200 = found = taken
    return res.status === 404;
  } catch {
    // Network error — assume available (better UX than blocking)
    return true;
  }
}

async function ncRequest(command: string, params: Record<string, string>) {
  const url = new URL(NC_API);
  url.searchParams.set("ApiUser", NC_USER);
  url.searchParams.set("ApiKey", NC_KEY);
  url.searchParams.set("UserName", NC_USER);
  url.searchParams.set("ClientIp", NC_IP);
  url.searchParams.set("Command", command);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  const text = await res.text();
  return text;
}

function parseXmlValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`));
  return match ? match[1].trim() : "";
}

function parseXmlAttr(xml: string, tag: string, attr: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i"));
  return match ? match[1] : "";
}

function isApiError(xml: string): string | null {
  if (xml.includes('Status="ERROR"')) {
    const match = xml.match(/<Error[^>]*>([^<]+)<\/Error>/);
    return match ? match[1] : "Unknown Namecheap error";
  }
  return null;
}

// ─── Domain Router ────────────────────────────────────────────────────────────

export const domainRouter = router({
  // Search domain availability + pricing via RDAP (ICANN standard — no IP whitelist needed)
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(63),
    }))
    .query(async ({ input }) => {
      const base = input.query.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-|-$/g, "");
      if (!base) throw new Error("Invalid domain name");

      // Check all TLDs in parallel via RDAP
      const tlds = ["com", "io", "ai", "co", "app", "net", "org", "dev", "info", "biz"];
      const availabilityChecks = await Promise.all(
        tlds.map(async (tld) => {
          const domain = `${base}.${tld}`;
          const available = await checkDomainAvailabilityRDAP(domain);
          const pricing = TLD_PRICING[tld] ?? { price: 24.99, cost: 14.99, renewal: 24.99 };
          return {
            domain,
            tld,
            available,
            price: pricing.price,
            renewal: pricing.renewal,
          };
        })
      );

      // Sort: available first, then by price
      availabilityChecks.sort((a, b) => {
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return a.price - b.price;
      });

      return { base, results: availabilityChecks, source: "rdap" };
    }),

  // Get pricing for a specific domain
  getPrice: publicProcedure
    .input(z.object({ domain: z.string() }))
    .query(async ({ input }) => {
      const tld = input.domain.split(".").slice(1).join(".");
      const pricing = TLD_PRICING[tld] ?? { price: 24.99, cost: 14.99, renewal: 24.99 };
      return {
        domain: input.domain,
        price: pricing.price,
        renewal: pricing.renewal,
        available: true,
      };
    }),

  // Suggest domains based on a website description (for post-build upsell)
  suggest: protectedProcedure
    .input(z.object({
      websiteTitle: z.string(),
      websiteDescription: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Generate slug variations from the title
      const slug = input.websiteTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "")
        .substring(0, 20);

      const variations = [
        slug,
        `get${slug}`,
        `try${slug}`,
        `${slug}app`,
        `${slug}hq`,
      ].filter(v => v.length >= 3);

      // Check availability for top variations with .com and .io
      const domainsToCheck = variations.flatMap(v => [`${v}.com`, `${v}.io`]).slice(0, 10).join(",");
      const xml = await ncRequest("namecheap.domains.check", { DomainList: domainsToCheck });
      const err = isApiError(xml);
      if (err) return { suggestions: [] };

      const suggestions: Array<{ domain: string; price: number; available: boolean }> = [];
      const matches = Array.from(xml.matchAll(/<DomainCheckResult Domain="([^"]+)" Available="([^"]+)"/g));
      for (const m of matches) {
        const domain = m[1];
        const available = m[2] === "true";
        const tld = domain.split(".").slice(1).join(".");
        const pricing = TLD_PRICING[tld] ?? { price: 24.99, cost: 14.99, renewal: 24.99 };
        if (available) {
          suggestions.push({ domain, price: pricing.price, available });
        }
      }

      return { suggestions: suggestions.slice(0, 5) };
    }),

  // Purchase a domain (creates Stripe checkout session)
  purchase: protectedProcedure
    .input(z.object({
      domain: z.string(),
      years: z.number().min(1).max(5).default(1),
      origin: z.string().url(),
      // Contact info for domain registration
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(7),
      address: z.string().min(5),
      city: z.string().min(2),
      stateProvince: z.string().min(2),
      postalCode: z.string().min(3),
      country: z.string().length(2), // ISO 2-letter country code
    }))
    .mutation(async ({ input, ctx }) => {
      const tld = input.domain.split(".").slice(1).join(".");
      const sld = input.domain.split(".")[0];
      const pricing = TLD_PRICING[tld] ?? { price: 24.99, cost: 14.99, renewal: 24.99 };
      const totalPrice = pricing.price * input.years;

      // First verify domain is still available
      const checkXml = await ncRequest("namecheap.domains.check", { DomainList: input.domain });
      const checkErr = isApiError(checkXml);
      if (checkErr) throw new Error(checkErr);
      const available = parseXmlAttr(checkXml, "DomainCheckResult", "Available");
      if (available !== "true") throw new Error(`${input.domain} is no longer available`);

      // Create a pending record in DB
      const dbConn = await getDb();
      if (!dbConn) throw new Error("Database unavailable");
      const [record] = await dbConn.insert(domainPurchases).values({
        userId: ctx.user.id,
        domain: input.domain,
        tld,
        registrar: "namecheap",
        priceCharged: totalPrice,
        costToUs: pricing.cost * input.years,
        status: "pending",
      });

      // Create Stripe checkout session for the domain purchase
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2024-06-20" as any });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: ctx.user.email ?? input.email,
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: `Domain: ${input.domain}`,
              description: `${input.years} year${input.years > 1 ? "s" : ""} registration — auto-renews annually`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        }],
        success_url: `${input.origin}/domains?purchased=${input.domain}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/domains?cancelled=true`,
        metadata: {
          user_id: ctx.user.id.toString(),
          domain: input.domain,
          years: input.years.toString(),
          // Store contact info for registration after payment
          reg_firstName: input.firstName,
          reg_lastName: input.lastName,
          reg_email: input.email,
          reg_phone: input.phone,
          reg_address: input.address,
          reg_city: input.city,
          reg_stateProvince: input.stateProvince,
          reg_postalCode: input.postalCode,
          reg_country: input.country,
        },
        client_reference_id: ctx.user.id.toString(),
        allow_promotion_codes: true,
      });

      return { checkoutUrl: session.url, domain: input.domain, price: totalPrice };
    }),

  // Complete domain registration after successful Stripe payment
  completePurchase: protectedProcedure
    .input(z.object({
      domain: z.string(),
      stripeSessionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2024-06-20" as any });

      // Verify payment
      const session = await stripe.checkout.sessions.retrieve(input.stripeSessionId);
      if (session.payment_status !== "paid") throw new Error("Payment not completed");

      const meta = session.metadata ?? {};
      const years = parseInt(meta.years ?? "1", 10);
      const tld = input.domain.split(".").slice(1).join(".");
      const sld = input.domain.split(".")[0];

      // Register domain with Namecheap
      const regParams: Record<string, string> = {
        DomainName: input.domain,
        Years: years.toString(),
        "Registrant.FirstName": meta.reg_firstName ?? "",
        "Registrant.LastName": meta.reg_lastName ?? "",
        "Registrant.Address1": meta.reg_address ?? "",
        "Registrant.City": meta.reg_city ?? "",
        "Registrant.StateProvince": meta.reg_stateProvince ?? "",
        "Registrant.PostalCode": meta.reg_postalCode ?? "",
        "Registrant.Country": meta.reg_country ?? "US",
        "Registrant.Phone": meta.reg_phone ?? "",
        "Registrant.EmailAddress": meta.reg_email ?? "",
        "Tech.FirstName": meta.reg_firstName ?? "",
        "Tech.LastName": meta.reg_lastName ?? "",
        "Tech.Address1": meta.reg_address ?? "",
        "Tech.City": meta.reg_city ?? "",
        "Tech.StateProvince": meta.reg_stateProvince ?? "",
        "Tech.PostalCode": meta.reg_postalCode ?? "",
        "Tech.Country": meta.reg_country ?? "US",
        "Tech.Phone": meta.reg_phone ?? "",
        "Tech.EmailAddress": meta.reg_email ?? "",
        "Admin.FirstName": meta.reg_firstName ?? "",
        "Admin.LastName": meta.reg_lastName ?? "",
        "Admin.Address1": meta.reg_address ?? "",
        "Admin.City": meta.reg_city ?? "",
        "Admin.StateProvince": meta.reg_stateProvince ?? "",
        "Admin.PostalCode": meta.reg_postalCode ?? "",
        "Admin.Country": meta.reg_country ?? "US",
        "Admin.Phone": meta.reg_phone ?? "",
        "Admin.EmailAddress": meta.reg_email ?? "",
        "AuxBilling.FirstName": meta.reg_firstName ?? "",
        "AuxBilling.LastName": meta.reg_lastName ?? "",
        "AuxBilling.Address1": meta.reg_address ?? "",
        "AuxBilling.City": meta.reg_city ?? "",
        "AuxBilling.StateProvince": meta.reg_stateProvince ?? "",
        "AuxBilling.PostalCode": meta.reg_postalCode ?? "",
        "AuxBilling.Country": meta.reg_country ?? "US",
        "AuxBilling.Phone": meta.reg_phone ?? "",
        "AuxBilling.EmailAddress": meta.reg_email ?? "",
        AddFreeWhoisguard: "yes",
        WGEnabled: "yes",
      };

      const regXml = await ncRequest("namecheap.domains.create", regParams);
      const regErr = isApiError(regXml);

      // Update DB record
      const pricing = TLD_PRICING[tld] ?? { price: 24.99, cost: 14.99, renewal: 24.99 };
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + years);

      const dbConn2 = await getDb();
      if (!dbConn2) throw new Error("Database unavailable");
      await dbConn2.update(domainPurchases)
        .set({
          status: regErr ? "failed" : "active",
          stripePaymentId: session.payment_intent as string,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(domainPurchases.domain, input.domain));

      if (regErr) throw new Error(`Domain registered but registration failed: ${regErr}`);

      return { success: true, domain: input.domain, expiresAt };
    }),

  // List user's purchased domains
  listMyDomains: protectedProcedure
    .query(async ({ ctx }) => {
      const dbConn = await getDb();
      if (!dbConn) return [];
      const domains = await dbConn.select()
        .from(domainPurchases)
        .where(eq(domainPurchases.userId, ctx.user.id));
      return domains;
    }),
});
