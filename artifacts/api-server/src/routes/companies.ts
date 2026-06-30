import { Router } from "express";
import { db, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();



router.get("/companies", requireSuperAdmin, async (_req, res): Promise<void> => {
  const companies = await db
    .select()
    .from(companiesTable)
    .orderBy(companiesTable.createdAt);
  res.json(companies.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/companies", requireSuperAdmin, async (req, res): Promise<void> => {
  const { code, name, address, gstin, contactEmail, contactPhone } = req.body;

  if (!code || !name) {
    res.status(400).json({ error: "Company code and name are required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.code, code));

  if (existing) {
    res.status(400).json({ error: "Company code already exists" });
    return;
  }

  const [company] = await db
    .insert(companiesTable)
    .values({ code, name, address, gstin, contactEmail, contactPhone })
    .returning();

  res.status(201).json({ ...company, createdAt: company.createdAt.toISOString() });
});

router.get("/companies/:id", requireSuperAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, id));

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json({ ...company, createdAt: company.createdAt.toISOString() });
});

router.patch("/companies/:id", requireSuperAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const { name, address, gstin, contactEmail, contactPhone, isActive } = req.body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (gstin !== undefined) updates.gstin = gstin;
  if (contactEmail !== undefined) updates.contactEmail = contactEmail;
  if (contactPhone !== undefined) updates.contactPhone = contactPhone;
  if (isActive !== undefined) updates.isActive = isActive;

  const [company] = await db
    .update(companiesTable)
    .set(updates)
    .where(eq(companiesTable.id, id))
    .returning();

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.json({ ...company, createdAt: company.createdAt.toISOString() });
});

router.delete("/companies/:id", requireSuperAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [company] = await db
    .delete(companiesTable)
    .where(eq(companiesTable.id, id))
    .returning();

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
