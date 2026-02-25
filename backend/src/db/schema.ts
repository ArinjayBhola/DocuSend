const { sqliteTable, text, integer, real } = require("drizzle-orm/sqlite-core");

const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("free"), // free, pro, business
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  shareSlug: text("share_slug").notNull().unique(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  password: text("password"),
  requireEmail: integer("require_email", { mode: "boolean" }).notNull().default(false),
  expiresAt: text("expires_at"),
  allowDownload: integer("allow_download", { mode: "boolean" }).notNull().default(false),
  fileType: text("file_type").notNull().default("pdf"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const documentViews = sqliteTable("document_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  viewerEmail: text("viewer_email"),
  viewerIp: text("viewer_ip"),
  userAgent: text("user_agent"),
  duration: integer("duration").default(0), // seconds
  pagesViewed: integer("pages_viewed").default(0),
  totalPages: integer("total_pages").default(0),
  country: text("country"),
  city: text("city"),
  referrer: text("referrer"),
  viewedAt: text("viewed_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const pageEvents = sqliteTable("page_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  viewId: integer("view_id")
    .notNull()
    .references(() => documentViews.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  timeSpent: integer("time_spent").default(0), // milliseconds
  enteredAt: text("entered_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const workspaces = sqliteTable("workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const workspaceDocuments = sqliteTable("workspace_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
});

const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // view, email_captured
  title: text("title").notNull(),
  message: text("message").notNull(),
  viewerEmail: text("viewer_email"),
  viewerIp: text("viewer_ip"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const notificationPreferences = sqliteTable("notification_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  emailOnView: integer("email_on_view", { mode: "boolean" }).notNull().default(true),
  emailOnEmailCapture: integer("email_on_email_capture", { mode: "boolean" }).notNull().default(true),
  inAppNotifications: integer("in_app_notifications", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  razorpayPlanId: text("razorpay_plan_id"),
  status: text("status").notNull().default("active"), // active, cancelled, expired
  currentPeriodStart: text("current_period_start"),
  currentPeriodEnd: text("current_period_end"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const deals = sqliteTable("deals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  accountName: text("account_name").notNull(),
  stage: text("stage").notNull().default("prospecting"), // prospecting/discovery/proposal/negotiation/closed_won/closed_lost
  value: real("value").default(0),
  currency: text("currency").notNull().default("USD"),
  closeDate: text("close_date"),
  stageEnteredAt: text("stage_entered_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  healthStatus: text("health_status").notNull().default("healthy"), // healthy/at_risk/critical
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const stakeholders = sqliteTable("stakeholders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dealId: integer("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("influencer"), // champion/decision_maker/influencer/blocker/legal/technical
  addedManually: integer("added_manually", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const dealActivities = sqliteTable("deal_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dealId: integer("deal_id")
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // stage_change/stakeholder_added/view_detected/risk_changed
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("waiting"), // waiting/active/ended
  maxParticipants: integer("max_participants").notNull().default(5),
  startedAt: text("started_at"),
  endedAt: text("ended_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const sessionParticipants = sqliteTable("session_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // host/member
  color: text("color").notNull(),
  joinedAt: text("joined_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  leftAt: text("left_at"),
});

const sessionMessages = sqliteTable("session_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  annotationId: integer("annotation_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const annotations = sqliteTable("annotations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  type: text("type").notNull(), // highlight/comment/freehand/shape/text
  data: text("data").notNull(), // JSON
  color: text("color").notNull(),
  resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

module.exports = {
  users,
  documents,
  documentViews,
  pageEvents,
  workspaces,
  workspaceDocuments,
  notifications,
  notificationPreferences,
  subscriptions,
  deals,
  stakeholders,
  dealActivities,
  sessions,
  sessionParticipants,
  sessionMessages,
  annotations,
};
