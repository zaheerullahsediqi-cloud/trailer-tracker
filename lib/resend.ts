import { Resend } from "resend";

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export const FROM_EMAIL = process.env.INVOICE_FROM_EMAIL || "invoices@yourdomain.com";
export const COMPANY_NAME = process.env.COMPANY_NAME || "Star Link Freight Inc.";
export const OWNER_EMAIL = process.env.OWNER_EMAIL || "";
