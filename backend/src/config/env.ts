import dotenv from 'dotenv';

dotenv.config();

interface Config {
  PORT: string | number;
  JWT_SECRET: string;
  COOKIE_SECRET: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  RAZORPAY_PRO_PLAN_ID: string;
  RAZORPAY_BUSINESS_PLAN_ID: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  APP_URL: string;
}

export const env: Config = {
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
