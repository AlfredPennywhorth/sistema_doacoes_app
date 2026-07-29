import fs from "fs";
import path from "path";

describe("cleanup_user_account_data migration", () => {
  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260729_harden_delete_user_cleanup.sql",
  );

  it("includes cleanup of item requests and reservations", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(
      /UPDATE\s+public\.items[\s\S]*requested_by\s*=\s*NULL[\s\S]*WHERE\s+requested_by\s*=\s*p_user_id/i,
    );
    expect(sql).toMatch(
      /DELETE\s+FROM\s+public\.item_requests[\s\S]*WHERE\s+user_id\s*=\s*p_user_id/i,
    );
  });

  it("contains transactional safeguards against partial relational cleanup", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(
      /IF EXISTS\s*\(SELECT 1 FROM public\.item_requests WHERE user_id = p_user_id\) THEN/i,
    );
    expect(sql).toMatch(
      /IF EXISTS\s*\(SELECT 1 FROM public\.items WHERE user_id = p_user_id OR requested_by = p_user_id\) THEN/i,
    );
    expect(sql).toMatch(
      /IF EXISTS\s*\(SELECT 1 FROM public\.profiles WHERE id = p_user_id\) THEN/i,
    );
  });
});
