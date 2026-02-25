import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env.js';

export class RazorpayService {
  private instance: any = null;

  private getRazorpay() {
    if (this.instance) return this.instance;
    if (!env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID === 'rzp_test_xxxxx') {
      return null;
    }

    this.instance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
    return this.instance;
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');
    return expectedSignature === signature;
  }

  async createSubscription(planId: string, customerId: string) {
    const rz = this.getRazorpay();
    if (!rz) throw new Error('Razorpay not configured');

    return rz.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: 120, // 10 years monthly
      quantity: 1,
    });
  }

  async createCustomer(data: { name: string; email: string }) {
    const rz = this.getRazorpay();
    if (!rz) throw new Error('Razorpay not configured');

    return rz.customers.create(data);
  }

  async cancelSubscription(subscriptionId: string) {
    const rz = this.getRazorpay();
    if (!rz) throw new Error('Razorpay not configured');

    return rz.subscriptions.cancel(subscriptionId);
  }
}
