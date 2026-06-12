"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { deleteAddress, saveAddress, setDefaultAddress } from "@/lib/account/actions";

export interface AddressView {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  addition: string;
  postcode: string;
  city: string;
  isDefault: boolean;
}

const inputCls =
  "w-full rounded-lg border border-vondel-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-vondel-500";
const labelCls = "mb-1 block text-sm font-medium text-vondel-700";

function AddressForm({
  address,
  onDone,
}: {
  address: AddressView | null;
  onDone: () => void;
}) {
  const t = useTranslations("account.addresses");
  const tc = useTranslations("checkout");
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await saveAddress(formData);
          onDone();
        })
      }
      className="grid gap-3 rounded-xl border border-vondel-200 bg-vondel-50/50 p-4 sm:grid-cols-2"
    >
      {address && <input type="hidden" name="id" value={address.id} />}
      <div className="sm:col-span-2">
        <label htmlFor="label" className={labelCls}>{t("label")}</label>
        <input id="label" name="label" defaultValue={address?.label} className={inputCls} />
      </div>
      <div>
        <label htmlFor="a-firstName" className={labelCls}>{tc("firstName")} *</label>
        <input id="a-firstName" name="firstName" required defaultValue={address?.firstName} className={inputCls} />
      </div>
      <div>
        <label htmlFor="a-lastName" className={labelCls}>{tc("lastName")} *</label>
        <input id="a-lastName" name="lastName" required defaultValue={address?.lastName} className={inputCls} />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:col-span-2">
        <div>
          <label htmlFor="a-postcode" className={labelCls}>{tc("postcode")} *</label>
          <input id="a-postcode" name="postcode" required defaultValue={address?.postcode} className={inputCls} />
        </div>
        <div>
          <label htmlFor="a-houseNumber" className={labelCls}>{tc("houseNumber")} *</label>
          <input id="a-houseNumber" name="houseNumber" required defaultValue={address?.houseNumber} className={inputCls} />
        </div>
        <div>
          <label htmlFor="a-addition" className={labelCls}>{tc("addition")}</label>
          <input id="a-addition" name="addition" defaultValue={address?.addition} className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="a-street" className={labelCls}>{tc("street")} *</label>
        <input id="a-street" name="street" required defaultValue={address?.street} className={inputCls} />
      </div>
      <div>
        <label htmlFor="a-city" className={labelCls}>{tc("city")} *</label>
        <input id="a-city" name="city" required defaultValue={address?.city} className={inputCls} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-vondel-700 px-5 py-2 text-sm font-semibold text-white hover:bg-vondel-600 disabled:bg-vondel-200"
        >
          {t("save")}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-vondel-200 px-5 py-2 text-sm text-vondel-600 hover:border-vondel-400"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

export function AddressManager({ addresses }: { addresses: AddressView[] }) {
  const t = useTranslations("account.addresses");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 && editing !== "new" && (
        <p className="rounded-xl border border-dashed border-vondel-200 p-8 text-center text-vondel-500">
          {t("empty")}
        </p>
      )}

      {addresses.map((address) =>
        editing === address.id ? (
          <AddressForm key={address.id} address={address} onDone={() => setEditing(null)} />
        ) : (
          <div
            key={address.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-vondel-100 bg-white p-4"
          >
            <div className="text-sm text-vondel-700">
              <p className="font-medium text-vondel-900">
                {address.label || `${address.firstName} ${address.lastName}`}
                {address.isDefault && (
                  <span className="ml-2 rounded-full bg-vondel-100 px-2 py-0.5 text-xs text-vondel-700">
                    {t("default")}
                  </span>
                )}
              </p>
              <p>
                {address.firstName} {address.lastName}
              </p>
              <p>
                {address.street} {address.houseNumber}
                {address.addition ? ` ${address.addition}` : ""}
              </p>
              <p>
                {address.postcode} {address.city}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
              <button
                type="button"
                onClick={() => setEditing(address.id)}
                className="text-vondel-600 underline hover:text-vondel-800"
              >
                {t("edit")}
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => deleteAddress(address.id))}
                className="text-red-600 underline hover:text-red-800"
              >
                {t("delete")}
              </button>
              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => startTransition(() => setDefaultAddress(address.id))}
                  className="text-vondel-500 underline hover:text-vondel-700"
                >
                  {t("makeDefault")}
                </button>
              )}
            </div>
          </div>
        ),
      )}

      {editing === "new" ? (
        <AddressForm address={null} onDone={() => setEditing(null)} />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="self-start rounded-xl border border-vondel-300 px-5 py-2.5 text-sm font-medium text-vondel-700 hover:border-vondel-500"
        >
          + {t("add")}
        </button>
      )}
    </div>
  );
}
