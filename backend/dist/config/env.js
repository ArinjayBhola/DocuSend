import dotenv from 'dotenv';
dotenv.config();
export const env = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
    COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev-cookie-secret',
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    RAZORPAY_PRO_PLAN_ID: process.env.RAZORPAY_PRO_PLAN_ID || '',
    RAZORPAY_BUSINESS_PLAN_ID: process.env.RAZORPAY_BUSINESS_PLAN_ID || '',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || 'DocuSend <noreply@docusend.com>',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
};
