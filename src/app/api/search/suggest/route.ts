import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { createStaticClient } from "@/lib/supabase/static";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const localeParam = request.nextUrl.searchParams.get("locale") ?? "nl";
  const locale = routing.locales.includes(localeParam as "nl" | "en")
    ? localeParam
    : "nl";

  if (q.length < 2 || q.length > 80) {
    return NextResponse.json([]);
  }

  const supabase = createStaticClient();
  const { data, error } = await supabase.rpc("search_suggestions", {
    p_query: q,
    p_locale: locale,
    p_limit: 6,
  });

  if (error) {
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
  });
}
