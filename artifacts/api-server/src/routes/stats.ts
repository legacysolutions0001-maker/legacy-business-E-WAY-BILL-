import { Router } from "express";
import { db, companiesTable, usersTable, ewaybillsTable } from "@workspace/db";
import { count, eq, desc } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

router.get("/stats", requireAuth, async (req, res): Promise<void> => {
  const [companiesCount] = await db.select({ count: count() }).from(companiesTable);
  const [usersCount] = await db.select({ count: count() }).from(usersTable);

  let billsCount;
  let recentBills;

  if (req.session.role === "super_admin") {
    [billsCount] = await db.select({ count: count() }).from(ewaybillsTable);
    recentBills = await db
      .select()
      .from(ewaybillsTable)
      .orderBy(desc(ewaybillsTable.createdAt))
      .limit(10);
  } else {
    [billsCount] = await db
      .select({ count: count() })
      .from(ewaybillsTable)
      .where(eq(ewaybillsTable.companyId, req.session.companyId!));
    recentBills = await db
      .select()
      .from(ewaybillsTable)
      .where(eq(ewaybillsTable.companyId, req.session.companyId!))
      .orderBy(desc(ewaybillsTable.createdAt))
      .limit(10);
  }

  res.json({
    totalCompanies: companiesCount.count,
    totalUsers: usersCount.count,
    totalEwaybills: billsCount.count,
    recentEwaybills: recentBills.map((bill) => ({
      ...bill,
      quantity: parseFloat(bill.quantity),
      taxableValue: parseFloat(bill.taxableValue),
      cgstRate: parseFloat(bill.cgstRate),
      sgstRate: parseFloat(bill.sgstRate),
      igstRate: parseFloat(bill.igstRate),
      cessRate: bill.cessRate ? parseFloat(bill.cessRate) : null,
      totalValue: parseFloat(bill.totalValue),
      createdAt: bill.createdAt.toISOString(),
    })),
  });
});

export default router;
