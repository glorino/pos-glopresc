import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

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

    // Generate a cryptographically secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in the database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiresAt,
      },
    });

    // In production, send email/SMS. For demo, log only the user email.
    console.log(`[PASSWORD RESET] Request for: ${user.email}`);

    return NextResponse.json({
      message: successMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
