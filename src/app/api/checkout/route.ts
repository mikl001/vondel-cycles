import { NextRequest, NextResponse } from "next/server";

import { resolveCartIdentity } from "@/lib/cart/identity";
import {
  CheckoutError,
  createOrder,
  type CheckoutInput,
} from "@/lib/orders/server";
import { isSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { cartId, userId } = await resolveCartIdentity();
  if (!cartId) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  let input: CheckoutInput;
  try {
    input = (await request.json()) as CheckoutInput;
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (input.locale !== "nl" && input.locale !== "en") input.locale = "nl";

  try {
    const result = await createOrder(cartId, userId, input);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json(
        { error: err.code, detail: err.message },
        { status: err.code === "out_of_stock" ? 409 : 400 },
      );
    }
    console.error("[checkout] failed:", err);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
