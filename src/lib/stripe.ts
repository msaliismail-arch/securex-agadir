import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY manquante");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function getAppUrl(request?: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
    ?.trim()
    .replace(/\/+$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  if (request) {
    return new URL(request.url).origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}