const { drizzle } = require("drizzle-orm/better-sqlite3");
const Database = require("better-sqlite3");
const path = require("path");
const schema = require("../db/schema");

const dbPath = path.join(__dirname, "..", "..", "docusend.db");
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

module.exports = { db, sqlite };
