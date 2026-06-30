import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, companiesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth";

const router = Router();



async function formatUser(user: typeof usersTable.$inferSelect) {
  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, user.companyId));
  return {
    id: user.id,
    username: user.username,
    companyId: user.companyId,
    companyCode: company?.code ?? "",
    companyName: company?.name ?? "",
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const { companyId } = req.query;

  let users;
  if (req.auth!.role === "super_admin") {
    if (companyId) {
      const cid = parseInt(companyId as string, 10);
      users = await db.select().from(usersTable).where(eq(usersTable.companyId, cid));
    } else {
      users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    }
  } else {
    users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.companyId, req.auth!.companyId!));
  }

  const formatted = await Promise.all(users.map(formatUser));
  res.json(formatted);
});

router.post("/users", requireSuperAdmin, async (req, res): Promise<void> => {
  const { username, password, companyId, role } = req.body;

  if (!username || !password || !companyId || !role) {
    res.status(400).json({ error: "Username, password, company, and role are required" });
    return;
  }

  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, companyId));

  if (!company) {
    res.status(400).json({ error: "Company not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.username, username), eq(usersTable.companyId, companyId)));

  if (existing) {
    res.status(400).json({ error: "Username already exists in this company" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash, companyId, role })
    .returning();

  res.status(201).json(await formatUser(user));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (req.auth!.role !== "super_admin" && user.companyId !== req.auth!.companyId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(await formatUser(user));
});

router.patch("/users/:id", requireSuperAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const { password, role, isActive } = req.body;

  const updates: Record<string, unknown> = {};
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(await formatUser(user));
});

router.delete("/users/:id", requireSuperAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [user] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
