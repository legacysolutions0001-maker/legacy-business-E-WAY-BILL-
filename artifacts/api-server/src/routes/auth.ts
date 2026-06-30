import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, companiesTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: number;
    companyId: number | null;
    role: string;
  }
}

const router = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { companyCode, username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const upperCode = (companyCode || "").trim().toUpperCase();

  // Super admin bypass — company code "SUPER" or empty
  if (upperCode === "SUPER" || !upperCode) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.username, username), eq(usersTable.role, "super_admin")));

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    req.session.userId = user.id;
    req.session.companyId = null;
    req.session.role = user.role;

    res.json({
      id: user.id,
      username: user.username,
      companyCode: "SUPER",
      companyName: "Super Admin",
      role: user.role,
    });
    return;
  }

  // Regular company user login
  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.code, upperCode));

  if (!company || !company.isActive) {
    res.status(401).json({ error: "Invalid company code or company is inactive" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.username, username), eq(usersTable.companyId, company.id)));

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.companyId = company.id;
  req.session.role = user.role;

  res.json({
    id: user.id,
    username: user.username,
    companyCode: company.code,
    companyName: company.name,
    role: user.role,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Super admin has no company
  if (user.role === "super_admin") {
    res.json({
      id: user.id,
      username: user.username,
      companyCode: "SUPER",
      companyName: "Super Admin",
      role: user.role,
    });
    return;
  }

  const [company] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, user.companyId));

  if (!company) {
    res.status(401).json({ error: "Company not found" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    companyCode: company.code,
    companyName: company.name,
    role: user.role,
  });
});

export default router;
