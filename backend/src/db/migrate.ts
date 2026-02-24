const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'docusend.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    razorpay_customer_id TEXT,
    razorpay_subscription_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    share_slug TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    password TEXT,
    require_email INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT,
    allow_download INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS document_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    viewer_email TEXT,
    viewer_ip TEXT,
    user_agent TEXT,
    duration INTEGER DEFAULT 0,
    pages_viewed INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    country TEXT,
    city TEXT,
    referrer TEXT,
    viewed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS page_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    view_id INTEGER NOT NULL REFERENCES document_views(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    time_spent INTEGER DEFAULT 0,
    entered_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workspace_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    razorpay_subscription_id TEXT,
    razorpay_plan_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TEXT,
    current_period_end TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_documents_share_slug ON documents(share_slug);
  CREATE INDEX IF NOT EXISTS idx_document_views_document_id ON document_views(document_id);
  CREATE INDEX IF NOT EXISTS idx_page_events_view_id ON page_events(view_id);
  CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
  CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
  CREATE INDEX IF NOT EXISTS idx_workspace_documents_workspace_id ON workspace_documents(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    viewer_email TEXT,
    viewer_ip TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notification_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_on_view INTEGER NOT NULL DEFAULT 1,
    email_on_email_capture INTEGER NOT NULL DEFAULT 1,
    in_app_notifications INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
`);

console.log('Database migrated successfully!');
db.close();
