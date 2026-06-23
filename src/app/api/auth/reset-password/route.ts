import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Decode the token to get the email
    let payload: { email: string; timestamp: number };
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf-8");
      payload = JSON.parse(decoded);
    } catch {
      return NextResponse.json(
        { error: "Invalid or malformed reset token" },
        { status: 400 }
      );
    }

    // Check if token is expired (1 hour limit)
    const tokenAge = Date.now() - payload.timestamp;
    const ONE_HOUR = 60 * 60 * 1000;
    if (tokenAge > ONE_HOUR) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password and update
    const hashedPassword = await hash(newPassword, 12);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
