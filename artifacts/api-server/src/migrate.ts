import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { companiesTable, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./lib/logger";

export async function runMigrationsAndSeed() {
  logger.info("Running startup migrations...");

  // ewb_companies
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ewb_companies (
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
  logger.info("ewb_companies ready");

  // ewb_users — company_id nullable (super_admin has no company)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ewb_users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      company_id INTEGER,
      role TEXT NOT NULL DEFAULT 'company_user',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Make company_id nullable if it was previously NOT NULL (migration fix)
  await db.execute(sql`
    ALTER TABLE ewb_users ALTER COLUMN company_id DROP NOT NULL
  `).catch(() => { /* already nullable */ });

  logger.info("ewb_users ready");

  // ewb_ewaybills
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ewb_ewaybills (
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
  logger.info("ewb_ewaybills ready");

  // Seed / ensure super admin (no company required — uses SUPER as company code)
  const passwordHash = await bcrypt.hash("Bhullar_01", 10);
  const existingAdmin = await db
    .select()
    .from(usersTable)
    .where(sql`username = 'bhullar01' AND role = 'super_admin'`);

  if (existingAdmin.length === 0) {
    await db.insert(usersTable).values({
      username: "bhullar01",
      passwordHash,
      companyId: null as any,
      role: "super_admin",
      isActive: true,
    });
    logger.info("Super admin seeded: bhullar01 / Bhullar_01 (login with company code: SUPER)");
  } else {
    // Always keep password in sync
    await db.execute(sql`
      UPDATE ewb_users SET password_hash = ${passwordHash}, is_active = true
      WHERE username = 'bhullar01' AND role = 'super_admin'
    `);
    logger.info("Super admin password synced");
  }

  logger.info("Startup migrations complete");
}
