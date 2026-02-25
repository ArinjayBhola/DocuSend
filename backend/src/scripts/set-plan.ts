const Database = require("better-sqlite3");
const path = require("path");

const args = process.argv.slice(2);
const validPlans = ["free", "pro", "business"];

if (args.length === 0 || args.length > 2) {
  console.log(`
Usage:
  npm run set-plan <plan>              Update ALL users
  npm run set-plan <plan> <user-id>    Update a specific user

Plans: ${validPlans.join(", ")}

Examples:
  npm run set-plan pro          All users → pro
  npm run set-plan business 1   User #1 → business
  npm run set-plan free 2       User #2 → free
`);
  process.exit(1);
}

const plan = args[0];
const userId = args[1] ? parseInt(args[1]) : null;

if (!validPlans.includes(plan)) {
  console.error(`Invalid plan "${plan}". Valid plans: ${validPlans.join(", ")}`);
  process.exit(1);
}

if (userId !== null && isNaN(userId)) {
  console.error(`Invalid user ID "${args[1]}". Must be a number.`);
  process.exit(1);
}

const dbPath = path.join(__dirname, "..", "..", "docusend.db");
const db = new Database(dbPath);

if (userId !== null) {
  const user = db.prepare("SELECT id, name, email, plan FROM users WHERE id = ?").get(userId);
  if (!user) {
    console.error(`User #${userId} not found.`);
    db.close();
    process.exit(1);
  }
  db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, userId);
  console.log(`\n  #${user.id} ${user.name} (${user.email}): ${user.plan} → ${plan}\n`);
} else {
  const users = db.prepare("SELECT id, name, email, plan FROM users").all();
  if (users.length === 0) {
    console.error("No users found in the database.");
    db.close();
    process.exit(1);
  }
  db.prepare("UPDATE users SET plan = ?").run(plan);
  console.log(`\nAll users updated to "${plan}":\n`);
  for (const u of users) {
    console.log(`  #${u.id} ${u.name} (${u.email}): ${u.plan} → ${plan}`);
  }
  console.log("");
}

db.close();
