const Razorpay = require("razorpay");
const crypto = require("crypto");
const env = require("../config/env");
let instance = null;
function getRazorpay() {
    if (instance)
        return instance;
    if (!env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID === "rzp_test_xxxxx")
        return null;
    instance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
    });
    return instance;
}
function verifyWebhookSignature(body, signature) {
    const expectedSignature = crypto
        .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest("hex");
    return expectedSignature === signature;
}
async function createSubscription(planId, customerId) {
    const rz = getRazorpay();
    if (!rz)
        throw new Error("Razorpay not configured");
    return rz.subscriptions.create({
        plan_id: planId,
        customer_id: customerId,
        total_count: 120, // 10 years monthly
        quantity: 1,
    });
}
async function createCustomer({ name, email }) {
    const rz = getRazorpay();
    if (!rz)
        throw new Error("Razorpay not configured");
    return rz.customers.create({ name, email });
}
async function cancelSubscription(subscriptionId) {
    const rz = getRazorpay();
    if (!rz)
        throw new Error("Razorpay not configured");
    return rz.subscriptions.cancel(subscriptionId);
}
module.exports = {
    getRazorpay,
    verifyWebhookSignature,
    createSubscription,
    createCustomer,
    cancelSubscription,
};
export {};
