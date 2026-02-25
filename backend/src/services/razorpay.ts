import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';

let instance: any = null;

export function getRazorpay() {
  if (instance) return instance;
  if (!env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID === 'rzp_test_xxxxx') return null;

  instance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  return instance;
}

export function verifyWebhookSignature(body: any, signature: string) {
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
  return expectedSignature === signature;
}

export async function createSubscription(planId: string, customerId: string) {
  const rz = getRazorpay();
  if (!rz) throw new Error('Razorpay not configured');

  return rz.subscriptions.create({
    plan_id: planId,
    customer_id: customerId,
    total_count: 120, // 10 years monthly
    quantity: 1,
  });
}

export async function createCustomer({ name, email }: { name: string, email: string }) {
  const rz = getRazorpay();
  if (!rz) throw new Error('Razorpay not configured');

  return rz.customers.create({ name, email });
}

export async function cancelSubscription(subscriptionId: string) {
  const rz = getRazorpay();
  if (!rz) throw new Error('Razorpay not configured');

  return rz.subscriptions.cancel(subscriptionId);
}
