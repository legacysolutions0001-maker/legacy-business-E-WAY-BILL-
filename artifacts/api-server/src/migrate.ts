import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { companiesTable, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./lib/logger";

export async function runMigrationsAndSeed() {
  logger.info("Running startup migrations...");

  // ── companies ──────────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT,
      gstin TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Ensure all columns exist even if the table already existed from another app
  await db.execute(sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS gstin TEXT`);
  await db.execute(sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email TEXT`);
  await db.execute(sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_phone TEXT`);
  await db.execute(sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`);
  await db.execute(sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT`);
  await db.execute(sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
  await db.execute(sql`ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
  logger.info("companies table ready");

  // ── users ──────────────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      company_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'company_user',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'company_user'`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
  logger.info("users table ready");

  // ── ewaybills ──────────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ewaybills (
      id SERIAL PRIMARY KEY,
      ewb_number TEXT NOT NULL UNIQUE,
      company_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      generated_by TEXT NOT NULL,
      generated_date TEXT NOT NULL,
      valid_upto TEXT NOT NULL,
      supply_type TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      transaction_sub_type TEXT,
      document_type TEXT,
      document_number TEXT,
      document_date TEXT,
      from_gstin TEXT NOT NULL,
      from_trade_name TEXT NOT NULL,
      from_addr1 TEXT NOT NULL,
      from_addr2 TEXT,
      from_pincode TEXT NOT NULL,
      from_state_code TEXT NOT NULL,
      to_gstin TEXT NOT NULL,
      to_trade_name TEXT NOT NULL,
      to_addr1 TEXT NOT NULL,
      to_addr2 TEXT,
      to_pincode TEXT NOT NULL,
      to_state_code TEXT NOT NULL,
      item_name TEXT NOT NULL,
      hsn_code TEXT NOT NULL,
      quantity NUMERIC(10,3) NOT NULL,
      unit TEXT NOT NULL,
      taxable_value NUMERIC(15,2) NOT NULL,
      cgst_rate NUMERIC(5,2) NOT NULL,
      sgst_rate NUMERIC(5,2) NOT NULL,
      igst_rate NUMERIC(5,2) NOT NULL,
      cess_rate NUMERIC(5,2),
      total_value NUMERIC(15,2) NOT NULL,
      transporter_doc_no TEXT NOT NULL,
      transporter_doc_date TEXT NOT NULL,
      vehicle_no TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      transport_mode TEXT NOT NULL,
      distance INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  logger.info("ewaybills table ready");

  logger.info("All tables verified");

  // ── seed super admin ───────────────────────────────────────────────────────
  const existing = await db
    .select()
    .from(companiesTable)
    .where(sql`code = 'bhullar'`);

  if (existing.length === 0) {
    const inserted = await db
      .insert(companiesTable)
      .values({
        code: "bhullar",
        name: "Bhullar Admin",
        address: "Admin HQ",
        isActive: true,
      })
      .returning();

    const company = inserted[0];
    const passwordHash = await bcrypt.hash("Bhullar_01", 10);
    await db.insert(usersTable).values({
      username: "bhullar01",
      passwordHash,
      companyId: company.id,
      role: "super_admin",
      isActive: true,
    });
    logger.info("Super admin seeded: bhullar01");
  } else {
    logger.info("Super admin already exists — skipping seed");
  }

  logger.info("Startup migrations complete");
}
