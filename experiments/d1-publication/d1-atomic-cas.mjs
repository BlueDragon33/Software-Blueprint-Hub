// Candidate primitive only. Internal repository calls must use fixed SQL and
// bound parameters, never caller-provided SQL. Not wired to the live runtime.
export const guardSchema = `CREATE TABLE blueprint_atomic_guard (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  ok INTEGER NOT NULL CHECK(ok = 1)
);`;

// D1 batch is atomic. A zero-row (or multi-row) CAS is not an SQL error by
// itself, so force a constraint error inside the batch, before any append.
export async function guardedAtomicBatch(db, cas, appends) {
  if (!db || !cas || !Array.isArray(appends) || !appends.length) {
    throw new TypeError("CAS and append statements required");
  }
  const statements = [cas,
    db.prepare("INSERT INTO blueprint_atomic_guard(id,ok) VALUES(1, CASE WHEN changes() = 1 THEN 1 ELSE 0 END)"),
    db.prepare("DELETE FROM blueprint_atomic_guard WHERE id = 1"),
    ...appends];
  const result = await db.batch(statements);
  if (!Array.isArray(result) || result.length !== statements.length || result.some(row => row?.success !== true)) {
    throw new Error("Atomic batch result unavailable; reconcile canonical state before retry");
  }
  return result;
}
