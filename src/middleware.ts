import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const roleDefaultRoutes: Record<string, string> = {
  OWNER: "/dashboard/owner",
  MANAGER: "/dashboard/manager",
  WAREHOUSE_MANAGER: "/dashboard/inventory",
  WAREHOUSE_REP: "/dashboard/inventory",
  PROCUREMENT_MANAGER: "/dashboard/procurement",
  PROCUREMENT_REP: "/dashboard/procurement",
  SALES_MANAGER: "/dashboard/sales-manager",
  SALES_REP: "/dashboard/cashier",
  ACCOUNTANT: "/dashboard/accounting",
  AUDITOR: "/dashboard/auditor",
  CUSTOMER: "/dashboard/customer",
};

const allowedRoutes: Record<string, string[]> = {
  OWNER: ["owner", "manager", "inventory", "products", "categories", "stock", "procurement", "sales-manager", "sales", "cashier", "pos", "accounting", "expenses", "invoices", "auditor", "customer", "users", "reports", "settings", "stock-adjustments", "suppliers", "purchase-orders", "stock-requests"],
  MANAGER: ["owner", "manager", "inventory", "products", "categories", "stock", "procurement", "sales-manager", "sales", "cashier", "pos", "accounting", "expenses", "invoices", "reports", "users", "settings", "stock-adjustments", "suppliers", "purchase-orders", "stock-requests"],
  WAREHOUSE_MANAGER: ["inventory", "products", "categories", "stock", "stock-adjustments"],
  WAREHOUSE_REP: ["inventory", "products", "stock", "stock-adjustments"],
  PROCUREMENT_MANAGER: ["procurement", "reports", "suppliers", "purchase-orders", "stock-requests"],
  PROCUREMENT_REP: ["procurement", "suppliers", "stock-requests"],
  SALES_MANAGER: ["sales-manager", "sales", "customers", "products"],
  SALES_REP: ["cashier", "pos", "sales-manager", "sales", "customers"],
  ACCOUNTANT: ["accounting", "expenses", "invoices", "cash-reports"],
  AUDITOR: ["auditor", "sales-manager", "inventory", "accounting", "expenses", "invoices", "cash-reports", "procurement", "products", "categories", "stock", "stock-adjustments", "reports"],
  CUSTOMER: ["customer"],
};

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  const role = token.role as string | undefined;
  const roleSegment = pathname.split("/dashboard/")[1]?.split("/")[0];

  if (roleSegment && role) {
    const allowed = allowedRoutes[role] || [];
    if (!allowed.includes(roleSegment)) {
      const defaultRoute = roleDefaultRoutes[role] || "/dashboard/owner";
      if (pathname !== defaultRoute) {
        return NextResponse.redirect(new URL(defaultRoute, req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
