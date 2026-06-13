import { NextRequest, NextResponse } from "next/server";

import { NL_POSTCODE_RE } from "@/lib/adapters/postcode";
import { getShippingAdapter } from "@/lib/adapters/shipping";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  if (!(await rateLimit(request, "pickup", LIMITS.pickup))) {
    return NextResponse.json([], { status: 429 });
  }
  const postcode = (request.nextUrl.searchParams.get("postcode") ?? "").trim();
  if (!NL_POSTCODE_RE.test(postcode.replace(/\s/g, ""))) {
    return NextResponse.json([]);
  }
  const points = await getShippingAdapter().getPickupPoints(postcode);
  return NextResponse.json(points, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
