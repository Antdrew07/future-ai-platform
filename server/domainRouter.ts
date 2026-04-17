import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { domainPurchases } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Dynadot Legacy API helpers ───────────────────────────────────────────────

const DYNADOT_API = "https://api.dynadot.com/api3.json";
const DYNADOT_KEY = process.env.DYNADOT_API_KEY ?? "";

/**
 * Call Dynadot Legacy API.
 * Docs: https://www.dynadot.com/domain/api-document
 */
async function dynadotRequest(command: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(DYNADOT_API);
  url.searchParams.set("key", DYNADOT_KEY);
  url.searchParams.set("command", command);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Dynadot HTTP ${res.status}`);
  const json = await res.json();
  return json;
}

// ─── Our markup pricing per TLD ───────────────────────────────────────────────

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

// ─── RDAP availability check (ICANN standard — no API key needed) ─────────────

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

async function checkDomainAvailabilityRDAP(domain: string): Promise<boolean> {
  const tld = domain.split(".").slice(1).join(".");
  const registry = RDAP_REGISTRIES[tld];
  if (!registry) return true;
  try {
    const res = await fetch(`${registry}/domain/${domain}`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.status === 404;
  } catch {
    return true;
  }
}

// ─── Domain Router ────────────────────────────────────────────────────────────

export const domainRouter = router({
  // Search domain availability + pricing via RDAP
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(63),
    }))
    .query(async ({ input }) => {
      const base = input.query.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-|-$/g, "");
      if (!base) throw new Error("Invalid domain name");

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

  // Suggest domains based on a website title (for post-build upsell)
  suggest: protectedProcedure
    .input(z.object({
      websiteTitle: z.string(),
      websiteDescription: z.string().optional(),
    }))
    .query(async ({ input }) => {
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

      const domainsToCheck = variations.flatMap(v => [`${v}.com`, `${v}.io`]).slice(0, 10);

      const results = await Promise.all(
        domainsToCheck.map(async (domain) => {
          const available = await checkDomainAvailabilityRDAP(domain);
          const tld = domain.split(".").slice(1).join(".");
          const pricing = TLD_PRICING[tld] ?? { price: 24.99, cost: 14.99, renewal: 24.99 };
          return { domain, price: pricing.price, available };
        })
      );

      return { suggestions: results.filter(r => r.available).slice(0, 5) };
    }),

  // Purchase a domain — creates Stripe checkout session
  purchase: protectedProcedure
    .input(z.object({
      domain: z.string(),
      years: z.number().min(1).max(5).default(1),
      origin: z.string().url(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(7),
      address: z.string().min(5),
      city: z.string().min(2),
      stateProvince: z.string().min(2),
      postalCode: z.string().min(3),
      country: z.string().length(2),
    }))
    .mutation(async ({ input, ctx }) => {
      const tld = input.domain.split(".").slice(1).join(".");
      const pricing = TLD_PRICING[tld] ?? { price: 24.99, cost: 14.99, renewal: 24.99 };
      const totalPrice = pricing.price * input.years;

      // Verify domain is still available via RDAP
      const available = await checkDomainAvailabilityRDAP(input.domain);
      if (!available) throw new Error(`${input.domain} is no longer available`);

      // Create pending DB record
      const dbConn = await getDb();
      if (!dbConn) throw new Error("Database unavailable");
      await dbConn.insert(domainPurchases).values({
        userId: ctx.user.id,
        domain: input.domain,
        tld,
        registrar: "dynadot",
        priceCharged: totalPrice,
        costToUs: pricing.cost * input.years,
        status: "pending",
      });

      // Create Stripe checkout session
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
              description: `${input.years} year${input.years > 1 ? "s" : ""} registration`,
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

  // Complete domain registration after successful Stripe payment (called from success page)
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

      // Register domain with Dynadot Legacy API
      // Format phone: Dynadot expects +1.2125551234 format
      const rawPhone = meta.reg_phone ?? "";
      const phone = rawPhone.startsWith("+") ? rawPhone : `+1.${rawPhone.replace(/\D/g, "")}`;

      let registrationSuccess = false;
      let registrationError = "";

      try {
        const regResult = await dynadotRequest("register", {
          domain: input.domain,
          duration: years.toString(),
          currency: "USD",
          // Contact info
          registrant_contact0_first_name: meta.reg_firstName ?? "",
          registrant_contact0_last_name: meta.reg_lastName ?? "",
          registrant_contact0_email: meta.reg_email ?? "",
          registrant_contact0_phone_num: phone,
          registrant_contact0_address1: meta.reg_address ?? "",
          registrant_contact0_city: meta.reg_city ?? "",
          registrant_contact0_state: meta.reg_stateProvince ?? "",
          registrant_contact0_zipcode: meta.reg_postalCode ?? "",
          registrant_contact0_country: meta.reg_country ?? "US",
        });

        // Dynadot returns { RegisterResponse: { ResponseCode: "0", Status: "success" } }
        const resp = regResult?.RegisterResponse;
        if (resp?.Status === "success" || resp?.ResponseCode === "0") {
          registrationSuccess = true;
        } else {
          registrationError = resp?.Error ?? JSON.stringify(regResult);
        }
      } catch (err: any) {
        registrationError = err.message ?? "Registration failed";
      }

      // Update DB record
      const pricing = TLD_PRICING[tld] ?? { price: 24.99, cost: 14.99, renewal: 24.99 };
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + years);

      const dbConn = await getDb();
      if (!dbConn) throw new Error("Database unavailable");
      await dbConn.update(domainPurchases)
        .set({
          status: registrationSuccess ? "active" : "failed",
          stripePaymentId: session.payment_intent as string,
          expiresAt: registrationSuccess ? expiresAt : undefined,
          updatedAt: new Date(),
        })
        .where(eq(domainPurchases.domain, input.domain));

      if (!registrationSuccess) {
        throw new Error(`Payment received but domain registration failed: ${registrationError}. Please contact support with your payment ID: ${session.payment_intent}`);
      }

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
