const { sqliteTable, text, integer, real } = require('drizzle-orm/sqlite-core');

const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  plan: text('plan').notNull().default('free'), // free, pro, business
  razorpayCustomerId: text('razorpay_customer_id'),
  razorpaySubscriptionId: text('razorpay_subscription_id'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  shareSlug: text('share_slug').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  password: text('password'),
  requireEmail: integer('require_email', { mode: 'boolean' }).notNull().default(false),
  expiresAt: text('expires_at'),
  allowDownload: integer('allow_download', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

const documentViews = sqliteTable('document_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  documentId: integer('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  viewerEmail: text('viewer_email'),
  viewerIp: text('viewer_ip'),
  userAgent: text('user_agent'),
  duration: integer('duration').default(0), // seconds
  pagesViewed: integer('pages_viewed').default(0),
  totalPages: integer('total_pages').default(0),
  country: text('country'),
  city: text('city'),
  referrer: text('referrer'),
  viewedAt: text('viewed_at').notNull().$defaultFn(() => new Date().toISOString()),
});

const pageEvents = sqliteTable('page_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  viewId: integer('view_id').notNull().references(() => documentViews.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  timeSpent: integer('time_spent').default(0), // milliseconds
  enteredAt: text('entered_at').notNull().$defaultFn(() => new Date().toISOString()),
});

const workspaces = sqliteTable('workspaces', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

const workspaceDocuments = sqliteTable('workspace_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  documentId: integer('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0),
});

const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull(),
  razorpaySubscriptionId: text('razorpay_subscription_id'),
  razorpayPlanId: text('razorpay_plan_id'),
  status: text('status').notNull().default('active'), // active, cancelled, expired
  currentPeriodStart: text('current_period_start'),
  currentPeriodEnd: text('current_period_end'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

module.exports = {
  users,
  documents,
  documentViews,
  pageEvents,
  workspaces,
  workspaceDocuments,
  subscriptions,
};
