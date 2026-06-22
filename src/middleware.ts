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
          OWNER: ["owner", "manager", "sales", "cashier", "inventory", "procurement", "accountant", "auditor"],
          MANAGER: ["manager", "sales", "cashier", "inventory", "procurement"],
          SALES_MANAGER: ["sales", "cashier"],
          CASHIER: ["cashier"],
          INVENTORY_MANAGER: ["inventory"],
          PROCUREMENT: ["procurement"],
          ACCOUNTANT: ["accountant"],
          AUDITOR: ["auditor"],
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
