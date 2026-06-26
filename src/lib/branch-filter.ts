import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

/**
 * Gets the branch filter for the current user via getToken (for route handlers using getToken).
 * - OWNER sees all branches (returns null = no filter)
 * - All other roles only see their own branch
 * 
 * Returns: { branchId: "xxx" } to use in Prisma where clause, or null for no filter.
 */
export async function getBranchFilter(request: NextRequest): Promise<{ branchId: string } | null> {
  const token = await getToken({ req: request as any });
  if (!token?.id) return { branchId: "__NONE__" };

  const role = token.role as string;
  if (role === "OWNER") return null;

  const branchId = token.branchId as string | undefined;
  if (!branchId) return { branchId: "__NONE__" };

  return { branchId };
}

/**
 * Gets the branch filter from a NextAuth session object.
 * Use this in API routes that use getServerSession.
 */
export function getBranchFilterFromSession(session: any): { branchId: string } | null {
  if (!session?.user?.id) return { branchId: "__NONE__" };

  const role = session.user.role || "";
  if (role === "OWNER") return null;

  const branchId = session.user.branchId;
  if (!branchId) return { branchId: "__NONE__" };

  return { branchId };
}
