const Stripe = require("stripe");

let client = null;

/**
 * Returns a Stripe SDK instance when STRIPE_SECRET_KEY is set; otherwise null.
 * Avoids crashing the process on startup when env is missing (local dev).
 */
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

module.exports = { getStripe };
