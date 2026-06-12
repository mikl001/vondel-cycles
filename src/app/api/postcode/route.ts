import { NextRequest, NextResponse } from "next/server";

import { getPostcodeAdapter } from "@/lib/adapters/postcode";

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode") ?? "";
  const number = request.nextUrl.searchParams.get("number") ?? "";
  if (postcode.length > 8 || number.length > 8) {
    return NextResponse.json(null, { status: 400 });
  }
  const result = await getPostcodeAdapter().lookup(postcode, number);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
