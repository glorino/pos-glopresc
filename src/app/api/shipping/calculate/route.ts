import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// NOTE: Google Maps Geocoding API only supports key via query param (no header option).
// This is a server-side-only call — the key is never exposed to the browser.
// Set GOOGLE_MAPS_API_KEY (private Config var) in Vercel env vars.
async function geocode(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
    return data.results[0].geometry.location;
  }
  return null;
}

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
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      const distanceKm = 10;
      return NextResponse.json({
        status: "OK",
        rows: [{
          elements: [{
            status: "OK",
            distance: { value: distanceKm * 1000, text: `${distanceKm} km` },
            duration: { value: 1200, text: "20 mins" },
          }],
        }],
      });
    }

    const [originCoords, destCoords] = await Promise.all([
      geocode(origin, apiKey),
      geocode(destination, apiKey),
    ]);

    if (!originCoords || !destCoords) {
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

    const distanceKm = Math.round(haversineDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng));
    const finalDistance = Math.max(distanceKm, 1);
    const estimatedMinutes = Math.round(finalDistance * 3);

    return NextResponse.json({
      status: "OK",
      rows: [{
        elements: [{
          status: "OK",
          distance: { value: finalDistance * 1000, text: `${finalDistance} km` },
          duration: { value: estimatedMinutes * 60, text: `${estimatedMinutes} mins` },
        }],
      }],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate distance" }, { status: 500 });
  }
}
