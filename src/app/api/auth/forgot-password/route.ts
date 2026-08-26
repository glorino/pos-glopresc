import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { sendSMS } from "@/lib/sms";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const rateLimitKey = getRateLimitKey(request, "forgot-pw");
  const rateLimit = checkRateLimit(rateLimitKey, 5, 300000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in 5 minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs || 300000) / 1000)) } }
    );
  }

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

    const successMessage =
      "If an account exists with this email, you will receive a password reset link shortly.";

    if (!user) {
      return NextResponse.json({ message: successMessage });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    if (user.phone) {
      try {
        await sendSMS(
          user.phone,
          `Your ${process.env.APP_NAME || "SSV Shop POS"} password reset link: ${resetUrl} (expires in 1 hour). Ignore if you didn't request this.`
        );
      } catch (smsError) {
        console.error("Failed to send reset SMS:", smsError);
      }
    }

    const response: Record<string, unknown> = { message: successMessage };
    if (process.env.NODE_ENV !== "production") {
      response._debug_token = token;
      response._debug_reset_url = resetUrl;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
