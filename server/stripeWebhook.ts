import Stripe from "stripe";
import type { Request, Response } from "express";
import { addCredits, getUserById } from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

export { stripe };

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
        const credits = session.metadata?.credits ? parseInt(session.metadata.credits) : null;

        if (userId && credits) {
          await addCredits(userId, credits, "purchase", `Credit pack purchase via Stripe (${session.id})`);
          console.log(`[Stripe] Added ${credits} credits to user ${userId}`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = (invoice as { metadata?: { user_id?: string } }).metadata?.user_id
          ? parseInt((invoice as { metadata?: { user_id?: string } }).metadata!.user_id!)
          : null;
        const credits = (invoice as { metadata?: { monthly_credits?: string } }).metadata?.monthly_credits
          ? parseInt((invoice as { metadata?: { monthly_credits?: string } }).metadata!.monthly_credits!)
          : null;

        if (userId && credits) {
          await addCredits(userId, credits, "subscription", `Monthly subscription credits (${invoice.id})`);
          console.log(`[Stripe] Added ${credits} subscription credits to user ${userId}`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe] Payment succeeded: ${pi.id} - $${(pi.amount / 100).toFixed(2)}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Subscription cancelled: ${sub.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }

  return res.json({ received: true });
}

export async function createCheckoutSession({
  userId,
  userEmail,
  userName,
  credits,
  priceUsd,
  packName,
  origin,
}: {
  userId: number;
  userEmail: string;
  userName: string;
  credits: number;
  priceUsd: number;
  packName: string;
  origin: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: priceUsd * 100,
          product_data: {
            name: `Future AI — ${packName}`,
            description: `${credits.toLocaleString()} credits for Future AI Platform`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      credits: credits.toString(),
      pack_name: packName,
    },
    success_url: `${origin}/dashboard/billing?success=1`,
    cancel_url: `${origin}/dashboard/billing?cancelled=1`,
  });

  return session.url;
}
