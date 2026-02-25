const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../config/db");
const { users, subscriptions } = require("../db/schema");
const { requireAuth, loadUser } = require("../middleware/auth");
const { getPlanLimits } = require("../utils/helpers");
const razorpayService = require("../services/razorpay");
const env = require("../config/env");

const router = express.Router();

router.get("/", requireAuth, loadUser, (req, res) => {
  const subscription = db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, req.user.id))
    .orderBy(subscriptions.id)
    .get();

  res.json({
    currentPlan: req.user.plan,
    subscription,
    limits: getPlanLimits(req.user.plan),
    razorpayKeyId: env.RAZORPAY_KEY_ID,
  });
});

router.post("/subscribe", requireAuth, loadUser, async (req, res) => {
  const { plan } = req.body;
  const planId = plan === "pro" ? env.RAZORPAY_PRO_PLAN_ID : env.RAZORPAY_BUSINESS_PLAN_ID;

  try {
    let customerId = req.user.razorpayCustomerId;
    if (!customerId) {
      const customer = await razorpayService.createCustomer({
        name: req.user.name,
        email: req.user.email,
      });
      customerId = customer.id;
      db.update(users).set({ razorpayCustomerId: customerId }).where(eq(users.id, req.user.id)).run();
    }

    const subscription = await razorpayService.createSubscription(planId, customerId);

    res.json({
      subscriptionId: subscription.id,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ error: "Failed to create subscription. Check Razorpay configuration." });
  }
});

router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.parse(req.body.toString());

  if (!razorpayService.verifyWebhookSignature(body, signature)) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = body.event;
  const payload = body.payload;

  if (event === "subscription.activated" || event === "subscription.charged") {
    const subData = payload.subscription?.entity;
    if (!subData) return res.json({ ok: true });

    const planId = subData.plan_id;
    let plan = "free";
    if (planId === env.RAZORPAY_PRO_PLAN_ID) plan = "pro";
    if (planId === env.RAZORPAY_BUSINESS_PLAN_ID) plan = "business";

    const user = db.select().from(users).where(eq(users.razorpayCustomerId, subData.customer_id)).get();

    if (user) {
      db.update(users)
        .set({
          plan,
          razorpaySubscriptionId: subData.id,
        })
        .where(eq(users.id, user.id))
        .run();

      db.insert(subscriptions)
        .values({
          userId: user.id,
          plan,
          razorpaySubscriptionId: subData.id,
          razorpayPlanId: planId,
          status: "active",
          currentPeriodStart: subData.current_start ? new Date(subData.current_start * 1000).toISOString() : null,
          currentPeriodEnd: subData.current_end ? new Date(subData.current_end * 1000).toISOString() : null,
        })
        .run();
    }
  }

  if (event === "subscription.cancelled" || event === "subscription.completed") {
    const subData = payload.subscription?.entity;
    if (subData) {
      const user = db.select().from(users).where(eq(users.razorpaySubscriptionId, subData.id)).get();

      if (user) {
        db.update(users).set({ plan: "free", razorpaySubscriptionId: null }).where(eq(users.id, user.id)).run();

        db.update(subscriptions)
          .set({ status: "cancelled" })
          .where(eq(subscriptions.razorpaySubscriptionId, subData.id))
          .run();
      }
    }
  }

  res.json({ ok: true });
});

router.post("/cancel", requireAuth, loadUser, async (req, res) => {
  if (req.user.razorpaySubscriptionId) {
    try {
      await razorpayService.cancelSubscription(req.user.razorpaySubscriptionId);
    } catch (err) {
      console.error("Cancel error:", err);
    }
  }

  db.update(users).set({ plan: "free", razorpaySubscriptionId: null }).where(eq(users.id, req.user.id)).run();

  res.json({ ok: true });
});

router.post("/success", requireAuth, loadUser, (req, res) => {
  const { razorpay_subscription_id, plan } = req.body;

  if (razorpay_subscription_id) {
    db.update(users)
      .set({
        plan: plan || "pro",
        razorpaySubscriptionId: razorpay_subscription_id,
      })
      .where(eq(users.id, req.user.id))
      .run();
  }

  res.json({ ok: true });
});

module.exports = router;
