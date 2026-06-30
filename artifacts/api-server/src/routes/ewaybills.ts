import { Router } from "express";
import { db, ewaybillsTable, companiesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();


function generateEwbNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const combined = (timestamp + random).slice(-12);
  return combined.padStart(12, "0");
}

function formatBill(bill: typeof ewaybillsTable.$inferSelect) {
  return {
    ...bill,
    quantity: parseFloat(bill.quantity),
    taxableValue: parseFloat(bill.taxableValue),
    cgstRate: parseFloat(bill.cgstRate),
    sgstRate: parseFloat(bill.sgstRate),
    igstRate: parseFloat(bill.igstRate),
    cessRate: bill.cessRate ? parseFloat(bill.cessRate) : null,
    totalValue: parseFloat(bill.totalValue),
    createdAt: bill.createdAt.toISOString(),
  };
}

router.get("/ewaybills", requireAuth, async (req, res): Promise<void> => {
  const { companyId } = req.query;

  let bills;
  if (req.auth!.role === "super_admin") {
    if (companyId) {
      const cid = parseInt(companyId as string, 10);
      bills = await db.select().from(ewaybillsTable).where(eq(ewaybillsTable.companyId, cid));
    } else {
      bills = await db.select().from(ewaybillsTable).orderBy(ewaybillsTable.createdAt);
    }
  } else {
    bills = await db
      .select()
      .from(ewaybillsTable)
      .where(eq(ewaybillsTable.companyId, req.auth!.companyId!));
  }

  res.json(bills.map(formatBill));
});

router.post("/ewaybills", requireAuth, async (req, res): Promise<void> => {
  const {
    supplyType, transactionType, transactionSubType, documentType, documentNumber, documentDate,
    fromGstin, fromTradeName, fromAddr1, fromAddr2, fromPincode, fromStateCode,
    toGstin, toTradeName, toAddr1, toAddr2, toPincode, toStateCode,
    itemName, hsnCode, quantity, unit, taxableValue, cgstRate, sgstRate, igstRate, cessRate, totalValue,
    transporterDocNo, transporterDocDate, vehicleNo, vehicleType, transportMode, distance,
  } = req.body;

  const requiredFields = [
    supplyType, transactionType, fromGstin, fromTradeName, fromAddr1, fromPincode, fromStateCode,
    toGstin, toTradeName, toAddr1, toPincode, toStateCode,
    itemName, hsnCode, quantity, unit, taxableValue, totalValue,
    transporterDocNo, transporterDocDate, vehicleNo, vehicleType, transportMode,
  ];

  if (requiredFields.some((f) => f == null || f === "")) {
    res.status(400).json({ error: "All required fields must be filled" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.auth!.userId!));

  const ewbNumber = generateEwbNumber();
  const now = new Date();
  const generatedDate = now.toISOString().split("T")[0];

  const distanceKm = distance ? parseInt(distance, 10) : 100;
  const validDays = Math.max(1, Math.ceil(distanceKm / 200));
  const validDate = new Date(now);
  validDate.setDate(validDate.getDate() + validDays);
  const validUpto = validDate.toISOString().split("T")[0];

  const [bill] = await db
    .insert(ewaybillsTable)
    .values({
      ewbNumber,
      companyId: req.auth!.companyId!,
      userId: req.auth!.userId!,
      generatedBy: user?.username ?? "unknown",
      generatedDate,
      validUpto,
      supplyType,
      transactionType,
      transactionSubType: transactionSubType ?? null,
      documentType: documentType ?? null,
      documentNumber: documentNumber ?? null,
      documentDate: documentDate ?? null,
      fromGstin,
      fromTradeName,
      fromAddr1,
      fromAddr2: fromAddr2 ?? null,
      fromPincode,
      fromStateCode,
      toGstin,
      toTradeName,
      toAddr1,
      toAddr2: toAddr2 ?? null,
      toPincode,
      toStateCode,
      itemName,
      hsnCode,
      quantity: quantity.toString(),
      unit,
      taxableValue: taxableValue.toString(),
      cgstRate: (cgstRate ?? 0).toString(),
      sgstRate: (sgstRate ?? 0).toString(),
      igstRate: (igstRate ?? 0).toString(),
      cessRate: cessRate ? cessRate.toString() : null,
      totalValue: totalValue.toString(),
      transporterDocNo,
      transporterDocDate,
      vehicleNo,
      vehicleType,
      transportMode,
      distance: distanceKm,
      status: "active",
    })
    .returning();

  res.status(201).json(formatBill(bill));
});

router.get("/ewaybills/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [bill] = await db.select().from(ewaybillsTable).where(eq(ewaybillsTable.id, id));

  if (!bill) {
    res.status(404).json({ error: "E-Way Bill not found" });
    return;
  }

  if (req.auth!.role !== "super_admin" && bill.companyId !== req.auth!.companyId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(formatBill(bill));
});

router.delete("/ewaybills/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [bill] = await db
    .delete(ewaybillsTable)
    .where(eq(ewaybillsTable.id, id))
    .returning();

  if (!bill) {
    res.status(404).json({ error: "E-Way Bill not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
