import { BillingService } from './billing.service.js';
import { getPlanLimits } from './plan.constants.js';
import { subscribeSchema, successSchema } from './billing.validation.js';
export class BillingController {
    service;
    constructor() {
        this.service = new BillingService();
    }
    getBillingInfo = async (req, res) => {
        if (!req.user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        const info = await this.service.getBillingInfo(req.user.id, req.user.plan);
        res.json({
            ...info,
            limits: getPlanLimits(req.user.plan),
        });
    };
    subscribe = async (req, res) => {
        if (!req.user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        const { plan } = subscribeSchema.parse(req.body);
        const result = await this.service.subscribe(req.user.id, req.user.name, req.user.email, req.user.razorpayCustomerId || null, plan);
        res.json(result);
    };
    handleWebhook = async (req, res) => {
        const signature = req.headers['x-razorpay-signature'];
        // We expect express.raw() to be used for this route in the future app setup
        const body = JSON.parse(req.body.toString());
        await this.service.handleWebhook(body, signature);
        res.json({ ok: true });
    };
    cancel = async (req, res) => {
        if (!req.user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        await this.service.cancelSubscription(req.user.id, req.user.razorpaySubscriptionId || null);
        res.json({ ok: true });
    };
    success = async (req, res) => {
        if (!req.user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        const { razorpay_subscription_id, plan } = successSchema.parse(req.body);
        await this.service.success(req.user.id, razorpay_subscription_id, plan || 'pro');
        res.json({ ok: true });
    };
}
