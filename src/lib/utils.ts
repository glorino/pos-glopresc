import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency?: string, locale?: string): string {
  return new Intl.NumberFormat(locale || "en-NG", {
    style: "currency",
    currency: currency || "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string, locale?: string): string {
  return new Intl.DateTimeFormat(locale || "en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale?: string): string {
  return new Intl.DateTimeFormat(locale || "en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function secureRandom(max: number): number {
  const bytes = randomBytes(4);
  const num = bytes.readUInt32BE(0);
  return num % max;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const prefix = "INV";
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = secureRandom(10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${datePart}-${random}`;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const prefix = "PO";
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = secureRandom(10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${datePart}-${random}`;
}

export function generateBookingNumber(): string {
  const date = new Date();
  const prefix = "BK";
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = secureRandom(10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${datePart}-${random}`;
}

export function generateSKU(prefix: string): string {
  const random = secureRandom(100000)
    .toString()
    .padStart(5, "0");
  return `${prefix}-${random}`;
}

export const APP_URL = process.env.APP_URL || "http://localhost:3000";
export const APP_NAME = process.env.APP_NAME || "SSV Shop POS";
export const APP_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "NGN";
export const APP_LOCALE = process.env.NEXT_PUBLIC_LOCALE || "en-NG";
