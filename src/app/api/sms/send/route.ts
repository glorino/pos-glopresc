import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/lib/sms";
import { requireAuth } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

const SMS_ROLES = ["OWNER", "MANAGER", "SALES_MANAGER"];

export async function POST(request: NextRequest) {
  const { error } = await requireAuth(SMS_ROLES);
  if (error) return error;

  const rateLimitKey = getRateLimitKey(request, "sms");
  const rateLimit = checkRateLimit(rateLimitKey, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many SMS requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs || 60000) / 1000)) } }
    );
  }

  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    const result = await sendSMS(phoneNumber, message);

    if (result && result.status === "success") {
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { success: false, error: result?.message || "Failed to send SMS" },
      { status: 500 }
    );
  } catch (error) {
    console.error("SMS API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
