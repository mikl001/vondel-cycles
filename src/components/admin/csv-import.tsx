"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CsvImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/products/csv", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: await file.text(),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(
          `${data.updated} updated${data.unknown.length ? `, ${data.unknown.length} unknown SKUs` : ""}`,
        );
        router.refresh();
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Error: upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="rounded-lg bg-vondel-700 px-4 py-2 text-sm font-semibold text-white hover:bg-vondel-600 disabled:bg-vondel-200"
      >
        ⬆ Import CSV
      </button>
      {result && <span className="text-xs text-vondel-600">{result}</span>}
    </span>
  );
}
