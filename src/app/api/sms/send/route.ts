import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
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
