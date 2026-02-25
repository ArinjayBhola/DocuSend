import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env.js';
export class RazorpayService {
    instance = null;
    getRazorpay() {
        if (this.instance)
            return this.instance;
        if (!env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID === 'rzp_test_xxxxx') {
            return null;
        }
        this.instance = new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_KEY_SECRET,
        });
        return this.instance;
    }
    verifyWebhookSignature(body, signature) {
        const expectedSignature = crypto
            .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(body))
            .digest('hex');
        return expectedSignature === signature;
    }
    async createSubscription(planId, customerId) {
        const rz = this.getRazorpay();
        if (!rz)
            throw new Error('Razorpay not configured');
        return rz.subscriptions.create({
            plan_id: planId,
            customer_id: customerId,
            total_count: 120, // 10 years monthly
            quantity: 1,
        });
    }
    async createCustomer(data) {
        const rz = this.getRazorpay();
        if (!rz)
            throw new Error('Razorpay not configured');
        return rz.customers.create(data);
    }
    async cancelSubscription(subscriptionId) {
        const rz = this.getRazorpay();
        if (!rz)
            throw new Error('Razorpay not configured');
        return rz.subscriptions.cancel(subscriptionId);
    }
}
