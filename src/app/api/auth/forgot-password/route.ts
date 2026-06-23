import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    const successMessage =
      "If an account exists with this email, you will receive a password reset link shortly.";

    if (!user) {
      return NextResponse.json({ message: successMessage });
    }

    // Generate a simple reset token (base64 encode email + timestamp)
    const payload = JSON.stringify({ email, timestamp: Date.now() });
    const token = Buffer.from(payload).toString("base64url");

    // In production, send email/SMS. For demo, log the reset link.
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    console.log(`[PASSWORD RESET] User: ${user.email}`);
    console.log(`[PASSWORD RESET] Reset link: ${resetLink}`);

    return NextResponse.json({
      message: successMessage,
      // For demo purposes, include the link in the response
      resetLink,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
