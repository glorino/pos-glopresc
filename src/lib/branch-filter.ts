import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

/**
 * Gets the branch WHERE clause for the current user via getToken.
 * - OWNER sees all branches (returns null = no filter)
 * - Other roles see their branch OR items with no branch assigned (null)
 *
 * Returns a Prisma-compatible where clause like:
 *   { OR: [{ branchId: "xxx" }, { branchId: null }] }
 * or null for no filter (Owner).
 */
export async function getBranchFilter(request: NextRequest): Promise<Record<string, any> | null> {
  const token = await getToken({ req: request as any });
  if (!token?.id) return { branchId: "__NONE__" };

  const role = token.role as string;
  if (role === "OWNER") return null;

  const branchId = token.branchId as string | undefined;
  if (!branchId) return { branchId: "__NONE__" };

  return {
    OR: [
      { branchId },
      { branchId: null },
    ],
  };
}

/**
 * Gets the raw branchId string for the current user.
 * Returns null for OWNER (no filter), or the branchId string.
 */
export async function getBranchId(request: NextRequest): Promise<string | null> {
  const token = await getToken({ req: request as any });
  if (!token?.id) return null;
  if (token.role === "OWNER") return null;
  return (token.branchId as string) || null;
}

/**
 * Gets the branch WHERE clause from a NextAuth session object.
 */
export function getBranchFilterFromSession(session: any): Record<string, any> | null {
  if (!session?.user?.id) return { branchId: "__NONE__" };

  const role = session.user.role || "";
  if (role === "OWNER") return null;

  const branchId = session.user.branchId;
  if (!branchId) return { branchId: "__NONE__" };

  return {
    OR: [
      { branchId },
      { branchId: null },
    ],
  };
}

/**
 * Gets the raw branchId string from a NextAuth session object.
 * Returns null for OWNER (no filter).
 */
export function getBranchIdFromSession(session: any): string | null {
  if (!session?.user?.id) return null;
  if (session.user.role === "OWNER") return null;
  return (session.user.branchId as string) || null;
}
