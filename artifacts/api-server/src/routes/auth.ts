import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, companiesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { signToken, verifyToken, requireAuth, requireSuperAdmin } from "../middlewares/auth";

const router = Router();

const COOKIE_NAME = "ewb_token";
const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const COOKIE_CLEAR_OPTS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
};

router.post("/auth/login", async (req, res): Promise<void> => {
  const { companyCode, username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const upperCode = (companyCode || "").trim().toUpperCase();

  // Super admin bypass — company code "SUPER", empty, or env-configured code
  const superCode = (process.env.EWAY_BILL_COMPANY_CODE || "SUPER").trim().toUpperCase();
  if (upperCode === "SUPER" || upperCode === superCode || !upperCode) {
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

    const token = signToken({ userId: user.id, role: user.role, companyId: null, username: user.username });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
    res.json({
      id: user.id,
      username: user.username,
      companyCode: "SUPER",
      companyName: "Super Admin",
      role: user.role,
      token,
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

  const token = signToken({ userId: user.id, role: user.role, companyId: company.id, username: user.username });
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.json({
    id: user.id,
    username: user.username,
    companyCode: company.code,
    companyName: company.name,
    role: user.role,
    token,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  res.clearCookie(COOKIE_NAME, COOKIE_CLEAR_OPTS);
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.auth!.userId));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

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
    .where(eq(companiesTable.id, user.companyId!));

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
