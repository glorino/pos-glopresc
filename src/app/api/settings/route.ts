import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const settings = await db.setting.findMany({
      orderBy: { key: "asc" },
    });

    const grouped: Record<string, Record<string, string>> = {};
    for (const setting of settings) {
      if (!grouped[setting.group]) {
        grouped[setting.group] = {};
      }
      grouped[setting.group][setting.key] = setting.value;
    }

    return NextResponse.json({ settings: grouped, flat: settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAuth(["OWNER"]);
  if (error) return error;
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Settings object is required" },
        { status: 400 }
      );
    }

    const updates: Promise<any>[] = [];

    for (const [key, value] of Object.entries(settings)) {
      const dotIndex = key.indexOf(".");
      const group = dotIndex > 0 ? key.substring(0, dotIndex) : "general";
      updates.push(
        db.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: {
            key,
            value: String(value),
            group,
          },
        })
      );
    }

    await Promise.all(updates);

    const allSettings = await db.setting.findMany({
      orderBy: { key: "asc" },
    });

    const grouped: Record<string, Record<string, string>> = {};
    for (const setting of allSettings) {
      if (!grouped[setting.group]) {
        grouped[setting.group] = {};
      }
      grouped[setting.group][setting.key] = setting.value;
    }

    return NextResponse.json({ settings: grouped, flat: allSettings });
  } catch (error: any) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
