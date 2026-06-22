import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/dashboard")) {
      const role = token?.role as string | undefined;
      const roleSegment = pathname.split("/dashboard/")[1]?.split("/")[0];

      if (roleSegment && role) {
        const allowedRoutes: Record<string, string[]> = {
          OWNER: ["owner", "manager", "warehouse-manager", "warehouse-rep", "procurement-manager", "procurement-rep", "sales-manager", "sales-rep", "accounting", "auditor", "customer"],
          MANAGER: ["manager", "warehouse-manager", "procurement-manager", "sales-manager", "sales-rep", "accounting"],
          WAREHOUSE_MANAGER: ["warehouse-manager", "warehouse-rep"],
          WAREHOUSE_REP: ["warehouse-rep"],
          PROCUREMENT_MANAGER: ["procurement-manager", "procurement-rep"],
          PROCUREMENT_REP: ["procurement-rep"],
          SALES_MANAGER: ["sales-manager", "sales-rep"],
          SALES_REP: ["sales-rep"],
          ACCOUNTANT: ["accounting"],
          AUDITOR: ["auditor"],
          CUSTOMER: ["customer"],
        };

        const allowed = allowedRoutes[role] || [];
        if (!allowed.includes(roleSegment)) {
          return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
