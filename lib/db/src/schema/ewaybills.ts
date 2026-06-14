import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ewaybillsTable = pgTable("ewaybills", {
  id: serial("id").primaryKey(),
  ewbNumber: text("ewb_number").notNull().unique(),
  companyId: integer("company_id").notNull(),
  userId: integer("user_id").notNull(),
  generatedBy: text("generated_by").notNull(),
  generatedDate: text("generated_date").notNull(),
  validUpto: text("valid_upto").notNull(),
  supplyType: text("supply_type").notNull(),
  transactionType: text("transaction_type").notNull(),
  transactionSubType: text("transaction_sub_type"),
  documentType: text("document_type"),
  documentNumber: text("document_number"),
  documentDate: text("document_date"),
  fromGstin: text("from_gstin").notNull(),
  fromTradeName: text("from_trade_name").notNull(),
  fromAddr1: text("from_addr1").notNull(),
  fromAddr2: text("from_addr2"),
  fromPincode: text("from_pincode").notNull(),
  fromStateCode: text("from_state_code").notNull(),
  toGstin: text("to_gstin").notNull(),
  toTradeName: text("to_trade_name").notNull(),
  toAddr1: text("to_addr1").notNull(),
  toAddr2: text("to_addr2"),
  toPincode: text("to_pincode").notNull(),
  toStateCode: text("to_state_code").notNull(),
  itemName: text("item_name").notNull(),
  hsnCode: text("hsn_code").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  taxableValue: numeric("taxable_value", { precision: 15, scale: 2 }).notNull(),
  cgstRate: numeric("cgst_rate", { precision: 5, scale: 2 }).notNull(),
  sgstRate: numeric("sgst_rate", { precision: 5, scale: 2 }).notNull(),
  igstRate: numeric("igst_rate", { precision: 5, scale: 2 }).notNull(),
  cessRate: numeric("cess_rate", { precision: 5, scale: 2 }),
  totalValue: numeric("total_value", { precision: 15, scale: 2 }).notNull(),
  transporterDocNo: text("transporter_doc_no").notNull(),
  transporterDocDate: text("transporter_doc_date").notNull(),
  vehicleNo: text("vehicle_no").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  transportMode: text("transport_mode").notNull(),
  distance: integer("distance"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEwaybillSchema = createInsertSchema(ewaybillsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEwaybill = z.infer<typeof insertEwaybillSchema>;
export type Ewaybill = typeof ewaybillsTable.$inferSelect;
