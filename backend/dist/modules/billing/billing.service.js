import { env } from '../../config/env.js';
import { AppError } from '../../core/errors/AppError.js';
import { BillingRepository } from './billing.repository.js';
import { RazorpayService } from './razorpay.service.js';
export class BillingService {
    repository;
    razorpay;
    constructor() {
        this.repository = new BillingRepository();
        this.razorpay = new RazorpayService();
    }
    async getBillingInfo(userId, userPlan) {
        const subscription = await this.repository.getSubscriptionByUserId(userId);
        return {
            currentPlan: userPlan,
            subscription,
            razorpayKeyId: env.RAZORPAY_KEY_ID,
        };
    }
    async subscribe(userId, userName, userEmail, currentCustomerId, plan) {
        const planId = plan === 'pro' ? env.RAZORPAY_PRO_PLAN_ID : env.RAZORPAY_BUSINESS_PLAN_ID;
        let customerId = currentCustomerId;
        if (!customerId) {
            const customer = await this.razorpay.createCustomer({
                name: userName,
                email: userEmail,
            });
            customerId = customer.id;
            await this.repository.updateRazorpayCustomerId(userId, customerId);
        }
        const subscription = await this.razorpay.createSubscription(planId, customerId);
        return {
            subscriptionId: subscription.id,
            razorpayKeyId: env.RAZORPAY_KEY_ID,
        };
    }
    async handleWebhook(body, signature) {
        if (!this.razorpay.verifyWebhookSignature(body, signature)) {
            throw new AppError('Invalid signature', 400);
        }
        const { event, payload } = body;
        if (event === 'subscription.activated' || event === 'subscription.charged') {
            const subData = payload.subscription?.entity;
            if (!subData)
                return;
            const planId = subData.plan_id;
            let plan = 'free';
            if (planId === env.RAZORPAY_PRO_PLAN_ID)
                plan = 'pro';
            if (planId === env.RAZORPAY_BUSINESS_PLAN_ID)
                plan = 'business';
            const user = await this.repository.findUserByRazorpayCustomerId(subData.customer_id);
            if (user) {
                await this.repository.updateUserPlan(user.id, plan, subData.id);
                await this.repository.createSubscription({
                    userId: user.id,
                    plan,
                    razorpaySubscriptionId: subData.id,
                    razorpayPlanId: planId,
                    status: 'active',
                    currentPeriodStart: subData.current_start ? new Date(subData.current_start * 1000).toISOString() : null,
                    currentPeriodEnd: subData.current_end ? new Date(subData.current_end * 1000).toISOString() : null,
                });
            }
        }
        if (event === 'subscription.cancelled' || event === 'subscription.completed') {
            const subData = payload.subscription?.entity;
            if (subData) {
                const user = await this.repository.findUserByRazorpaySubscriptionId(subData.id);
                if (user) {
                    await this.repository.updateUserPlan(user.id, 'free', null);
                    await this.repository.updateSubscriptionStatus(subData.id, 'cancelled');
                }
            }
        }
    }
    async cancelSubscription(userId, subscriptionId) {
        if (subscriptionId) {
            try {
                await this.razorpay.cancelSubscription(subscriptionId);
            }
            catch (err) {
                console.error('Cancel error:', err);
            }
        }
        await this.repository.updateUserPlan(userId, 'free', null);
    }
    async success(userId, razorpaySubscriptionId, plan = 'pro') {
        await this.repository.updateUserPlan(userId, plan, razorpaySubscriptionId);
    }
}
