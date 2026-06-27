import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnerInsights, getManagerInsights, getAccountantInsights, getCashierInsights, getSalesManagerInsights, getAuditorInsights } from "@/lib/ai-insights";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ insights: [] });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    let insights: Awaited<ReturnType<typeof getOwnerInsights>> = [];
    switch (role) {
      case "OWNER": insights = await getOwnerInsights(); break;
      case "MANAGER": insights = await getManagerInsights(); break;
      case "ACCOUNTANT": insights = await getAccountantInsights(); break;
      case "SALES_REP": insights = await getCashierInsights(userId); break;
      case "SALES_MANAGER": insights = await getSalesManagerInsights(); break;
      case "AUDITOR": insights = await getAuditorInsights(); break;
      default: insights = [];
    }
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json({ insights: [] });
  }
}
