const fs = require("fs");
const path = require("path");
const { execSync, exec, spawnSync } = require("child_process");

const BACKUP_FILE =
  "/home/ubuntu/Workspaces/master/distributed-systems/bento-social-be/backup.sql";

// Map tables to databases
const TABLE_DB_MAP = {
  users: ["auth_db", "user_db"],
  topics: ["topic_db"],
  posts: ["post_db"],
  post_saves: ["interaction_db"],
  post_likes: ["interaction_db"],
  notifications: ["notification_db"],
  followers: ["user_db", "interaction_db"],
  comments: ["comment_db"],
  comment_likes: [], // Skipping as no schema found
};

function parseBackupFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const tables = {};

  // Regex to find COPY blocks
  // COPY public.tablename (columns...) FROM stdin;
  // ... data ...
  // \.
  const regex = /COPY public\.(\w+) \((.*?)\) FROM stdin;\n([\s\S]*?)\\\./g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    const tableName = match[1];
    const columns = match[2];
    const data = match[3];
    tables[tableName] = { columns, data };
  }

  return tables;
}

function importTable(tableName, tableData, dbName) {
  if (!TABLE_DB_MAP[tableName] || TABLE_DB_MAP[tableName].length === 0) {
    console.log(`Skipping table ${tableName} (no target DB)`);
    return;
  }

  if (!TABLE_DB_MAP[tableName].includes(dbName)) {
    return;
  }

  console.log(`Importing ${tableName} into ${dbName}...`);

  // Construct the COPY command clearly
  const copyCommand = `COPY public.${tableName} (${tableData.columns}) FROM stdin;\n`;
  const fullInput = copyCommand + tableData.data + "\\.\n";

  try {
    // Truncate table first to avoid duplicates and ensure clean state
    spawnSync(
      "docker",
      [
        "exec",
        "-i",
        "bento-postgres",
        "psql",
        "-U",
        "bento",
        "-d",
        dbName,
        "-c",
        `TRUNCATE TABLE public.${tableName} CASCADE;`,
      ],
      { encoding: "utf-8" },
    );

    // Use docker exec -i to accept stdin
    const child = spawnSync(
      "docker",
      ["exec", "-i", "bento-postgres", "psql", "-U", "bento", "-d", dbName],
      {
        input: fullInput,
        encoding: "utf-8",
      },
    );

    if (child.error) {
      console.error(
        `Failed to start subprocess for ${tableName} in ${dbName}:`,
        child.error,
      );
      return;
    }

    if (child.status !== 0) {
      // Check for specific unique constraint errors to ignore them (idempotency)
      if (
        child.stderr.includes("duplicate key value violates unique constraint")
      ) {
        console.log(`  -> Skipped duplicates for ${tableName} in ${dbName}`);
      } else {
        console.error(
          `Error importing ${tableName} to ${dbName}:`,
          child.stderr,
        );
      }
    } else {
      console.log(`  -> Success: ${tableName} to ${dbName}`);
    }
  } catch (err) {
    console.error(`Exception during import for ${tableName}`, err);
  }
}

async function main() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`Backup file not found at ${BACKUP_FILE}`);
    process.exit(1);
  }

  console.log("Parsing backup file...");
  const tables = parseBackupFile(BACKUP_FILE);

  // We need to iterate over known databases to ensure dependencies?
  // Actually, users should be first generally.

  const priority = ["users", "topics", "posts"]; // Insert users first to avoid FK errors

  // Process priority tables first
  for (const tableName of priority) {
    if (tables[tableName]) {
      const dbs = TABLE_DB_MAP[tableName];
      for (const db of dbs) {
        importTable(tableName, tables[tableName], db);
      }
      // Wait a bit or sync? exec is async in loop.
      // Let's use sync exec for simplicity or Promise wrapper if needed.
      // Using execSync with input is harder. Let's make importTable async/promise.
    }
  }

  // Process remaining
  for (const tableName in tables) {
    if (!priority.includes(tableName)) {
      const dbs = TABLE_DB_MAP[tableName];
      if (dbs) {
        for (const db of dbs) {
          importTable(tableName, tables[tableName], db);
        }
      }
    }
  }
}

main();
