import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") || "";
  if (!q || q.length < 3) return NextResponse.json([]);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&featuretype=settlement&viewbox=68.1,8.0,97.4,35.5&bounded=0&limit=5`,
      { headers: { "User-Agent": "YMUTE-Voice-Marketplace-App/1.0" } }
    );
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data.slice(0, 5) : []);
  } catch {
    return NextResponse.json([]);
  }
}
