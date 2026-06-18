import { ensureDatabaseSchema } from "../src/lib/db/database.js";

console.log("Initializing database schemas...");

ensureDatabaseSchema()
  .then(() => {
    console.log("Database schema initialized successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to initialize database schema:", err);
    process.exit(1);
  });
