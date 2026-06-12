"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { PickupPoint } from "@/lib/adapters/shipping";
import type { OrderTotals } from "@/lib/cart/totals";
import { formatCents, lt } from "@/lib/format";
import type { LocalizedText } from "@/types/catalog";

export interface ShippingMethodView {
  code: string;
  name: LocalizedText;
  description: LocalizedText | null;
  priceCents: number;
  freeAboveCents: number | null;
  supportsPickup: boolean;
}

const inputCls =
  "w-full rounded-lg border border-vondel-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-vondel-500";
const labelCls = "mb-1 block text-sm font-medium text-vondel-700";

export function CheckoutForm({ methods }: { methods: ShippingMethodView[] }) {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const { cart, pending } = useCart();

  const [email, setEmail] = useState("");
  const [customerType, setCustomerType] = useState<"b2c" | "b2b">("b2c");
  const [companyName, setCompanyName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    postcode: "",
    houseNumber: "",
    addition: "",
    street: "",
    city: "",
    country: "NL",
  });
  const [autofilled, setAutofilled] = useState(false);
  const [methodCode, setMethodCode] = useState(methods[0]?.code ?? "");
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [pickupPointId, setPickupPointId] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | undefined>();
  const [promoError, setPromoError] = useState(false);
  const [totals, setTotals] = useState<OrderTotals | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMethod = methods.find((m) => m.code === methodCode);
  const reverseChargeLikely =
    customerType === "b2b" &&
    /^(?!NL)[A-Z]{2}[0-9A-Z]{8,12}$/.test(
      vatNumber.replace(/[\s.]/g, "").toUpperCase(),
    );

  // postcode + huisnummer -> street/city autofill (the NL standard)
  useEffect(() => {
    const clean = address.postcode.replace(/\s/g, "");
    if (!/^[1-9][0-9]{3}[A-Za-z]{2}$/.test(clean) || !address.houseNumber) return;
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/postcode?postcode=${encodeURIComponent(clean)}&number=${encodeURIComponent(address.houseNumber)}`,
        );
        const data = await res.json();
        if (data?.street) {
          setAddress((a) => ({ ...a, street: data.street, city: data.city }));
          setAutofilled(true);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timeout);
  }, [address.postcode, address.houseNumber]);

  // pickup points for the selected postcode
  useEffect(() => {
    if (!selectedMethod?.supportsPickup) return;
    const clean = address.postcode.replace(/\s/g, "");
    if (!/^[1-9][0-9]{3}[A-Za-z]{2}$/.test(clean)) return;
    fetch(`/api/pickup-points?postcode=${encodeURIComponent(clean)}`)
      .then((res) => res.json())
      .then((points: PickupPoint[]) => {
        setPickupPoints(points);
        setPickupPointId((id) => id || points[0]?.id || "");
      })
      .catch(() => {});
  }, [selectedMethod?.supportsPickup, address.postcode]);

  // server-priced totals preview
  const refreshTotals = useCallback(async () => {
    try {
      const res = await fetch("/api/checkout/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingMethodCode: methodCode,
          promoCode,
          customerType,
          vatNumber,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTotals(data.totals);
        setPromoError(false);
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.error === "invalid_promo") {
          setPromoError(true);
          setPromoCode(undefined);
        }
      }
    } catch {}
  }, [methodCode, promoCode, customerType, vatNumber]);

  useEffect(() => {
    if (cart.items.length === 0) return;
    const timeout = setTimeout(() => void refreshTotals(), 50);
    return () => clearTimeout(timeout);
  }, [cart.items.length, refreshTotals]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const pickupPoint = pickupPoints.find((p) => p.id === pickupPointId);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          customerType,
          companyName: customerType === "b2b" ? companyName : undefined,
          vatNumber: customerType === "b2b" ? vatNumber : undefined,
          shippingAddress: address,
          shippingMethodCode: methodCode,
          pickupPoint: selectedMethod?.supportsPickup ? pickupPoint : undefined,
          promoCode,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "error");
        setSubmitting(false);
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("error");
      setSubmitting(false);
    }
  }

  if (!pending && cart.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-vondel-200 p-12 text-center">
        <p className="text-vondel-500">{t("errors.empty_cart")}</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-xl bg-vondel-700 px-6 py-2.5 font-medium text-white hover:bg-vondel-600"
        >
          Vondel Cycles
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-8">
        {/* Contact */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-vondel-900">{t("contact")}</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="email" className={labelCls}>{t("email")} *</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <fieldset>
              <legend className={labelCls}>{t("customerType")}</legend>
              <div className="flex gap-2">
                {(["b2c", "b2b"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCustomerType(type)}
                    aria-pressed={customerType === type}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      customerType === type
                        ? "border-vondel-700 bg-vondel-700 text-white"
                        : "border-vondel-200 bg-white text-vondel-800 hover:border-vondel-400"
                    }`}
                  >
                    {t(type)}
                  </button>
                ))}
              </div>
            </fieldset>
            {customerType === "b2b" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className={labelCls}>{t("companyName")} *</label>
                  <input
                    id="company"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="vat" className={labelCls}>{t("vatNumber")}</label>
                  <input
                    id="vat"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="NL123456789B01"
                    className={inputCls}
                  />
                  {reverseChargeLikely && (
                    <p className="mt-1 text-xs font-medium text-vondel-600">
                      {t("reverseChargeNote")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Address */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-vondel-900">
            {t("shippingAddress")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className={labelCls}>{t("firstName")} *</label>
              <input id="firstName" required autoComplete="given-name" value={address.firstName}
                onChange={(e) => setAddress((a) => ({ ...a, firstName: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label htmlFor="lastName" className={labelCls}>{t("lastName")} *</label>
              <input id="lastName" required autoComplete="family-name" value={address.lastName}
                onChange={(e) => setAddress((a) => ({ ...a, lastName: e.target.value }))} className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-3 sm:col-span-2">
              <div>
                <label htmlFor="postcode" className={labelCls}>{t("postcode")} *</label>
                <input id="postcode" required autoComplete="postal-code" placeholder="1071 AA"
                  value={address.postcode}
                  onChange={(e) => setAddress((a) => ({ ...a, postcode: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label htmlFor="houseNumber" className={labelCls}>{t("houseNumber")} *</label>
                <input id="houseNumber" required value={address.houseNumber}
                  onChange={(e) => setAddress((a) => ({ ...a, houseNumber: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label htmlFor="addition" className={labelCls}>{t("addition")}</label>
                <input id="addition" value={address.addition}
                  onChange={(e) => setAddress((a) => ({ ...a, addition: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="street" className={labelCls}>{t("street")} *</label>
              <input id="street" required autoComplete="address-line1" value={address.street}
                onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label htmlFor="city" className={labelCls}>{t("city")} *</label>
              <input id="city" required autoComplete="address-level2" value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} className={inputCls} />
            </div>
          </div>
          {autofilled && (
            <p className="mt-2 text-xs font-medium text-vondel-600">✓ {t("addressFound")}</p>
          )}
        </section>

        {/* Shipping method */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-vondel-900">
            {t("shippingMethod")}
          </h2>
          <div className="flex flex-col gap-2">
            {methods.map((method) => {
              const free =
                method.freeAboveCents != null &&
                cart.totals.totalInclCents >= method.freeAboveCents;
              return (
                <label
                  key={method.code}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 ${
                    methodCode === method.code
                      ? "border-vondel-600 bg-vondel-50"
                      : "border-vondel-200 bg-white hover:border-vondel-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={methodCode === method.code}
                    onChange={() => setMethodCode(method.code)}
                    className="h-4 w-4 accent-vondel-600"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-vondel-900">
                      {lt(method.name, locale)}
                    </span>
                    <span className="block text-xs text-vondel-500">
                      {lt(method.description, locale)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-vondel-900">
                    {free ? t("free") : formatCents(method.priceCents, locale)}
                  </span>
                </label>
              );
            })}
          </div>

          {selectedMethod?.supportsPickup && pickupPoints.length > 0 && (
            <div className="mt-3">
              <label htmlFor="pickupPoint" className={labelCls}>{t("pickupPoint")}</label>
              <select
                id="pickupPoint"
                value={pickupPointId}
                onChange={(e) => setPickupPointId(e.target.value)}
                className={inputCls}
              >
                {pickupPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name} — {point.street}, {point.postcode} ({point.distanceKm} km)
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-xl border border-vondel-100 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-vondel-900">{t("summary")}</h2>
        <ul className="mb-4 flex flex-col gap-1.5 text-sm text-vondel-700">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="truncate">
                {item.quantity}× {lt(item.productName, locale)}
              </span>
              <span className="shrink-0">{formatCents(item.lineInclCents, locale)}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4 flex gap-2">
          <input
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder={t("promoLabel")}
            aria-label={t("promoLabel")}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setPromoCode(promoInput.trim() || undefined)}
            className="shrink-0 rounded-lg border border-vondel-300 px-3 py-2 text-sm font-medium text-vondel-700 hover:border-vondel-500"
          >
            {t("promoApply")}
          </button>
        </div>
        {promoError && <p className="mb-3 text-xs text-red-600">{t("promoInvalid")}</p>}
        {promoCode && totals && totals.discountExclCents > 0 && (
          <p className="mb-3 text-xs font-medium text-vondel-600">
            ✓ {t("promoApplied")}: {promoCode}
          </p>
        )}

        {totals && (
          <dl className="flex flex-col gap-1.5 border-t border-vondel-100 pt-3 text-sm">
            <div className="flex justify-between text-vondel-600">
              <dt>{t("subtotal")}</dt>
              <dd>{formatCents(totals.subtotalExclCents, locale)}</dd>
            </div>
            {totals.discountExclCents > 0 && (
              <div className="flex justify-between text-vondel-600">
                <dt>{t("discount")}</dt>
                <dd>−{formatCents(totals.discountExclCents, locale)}</dd>
              </div>
            )}
            <div className="flex justify-between text-vondel-600">
              <dt>{t("shipping")}</dt>
              <dd>
                {totals.shippingExclCents === 0
                  ? t("free")
                  : formatCents(totals.shippingExclCents, locale)}
              </dd>
            </div>
            {Object.entries(totals.vatBreakdown).map(([rate, cents]) => (
              <div key={rate} className="flex justify-between text-vondel-500">
                <dt>{t("vat", { rate })}</dt>
                <dd>{formatCents(cents, locale)}</dd>
              </div>
            ))}
            {totals.reverseCharge && (
              <p className="text-xs text-vondel-500">{t("reverseChargeNote")}</p>
            )}
            <div className="mt-1 flex justify-between border-t border-vondel-100 pt-2 text-base font-semibold text-vondel-900">
              <dt>{t("total")}</dt>
              <dd>{formatCents(totals.totalInclCents, locale)}</dd>
            </div>
          </dl>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {t(`errors.${error}` as never)}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || cart.items.length === 0}
          className="mt-4 w-full rounded-xl bg-vondel-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-vondel-600 disabled:cursor-not-allowed disabled:bg-vondel-200"
        >
          {submitting ? "…" : t("payNow")}
        </button>
        <p className="mt-2 text-center text-xs text-vondel-400">{t("demoPaymentNote")}</p>
      </aside>
    </form>
  );
}
