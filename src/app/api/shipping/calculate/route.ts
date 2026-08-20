import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimitKey = getRateLimitKey(request, "shipping");
  const rateLimit = checkRateLimit(rateLimitKey, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs || 60000) / 1000)) } }
    );
  }

  try {
    const { origin, destination } = await request.json();
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        status: "OK",
        rows: [{
          elements: [{
            status: "OK",
            distance: { value: 10000, text: "10 km" },
            duration: { value: 1200, text: "20 mins" },
          }],
        }],
      });
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate distance" }, { status: 500 });
  }
}
