"use client";

import { useEffect } from "react";

/** Last-resort boundary for failures in the root layout itself (where the
 *  locale provider and site chrome are unavailable). Must render its own
 *  <html>/<body>. Intentionally bilingual and dependency-free. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          color: "#1d3728",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Er ging iets mis / Something went wrong
        </h1>
        <p style={{ color: "#346748" }}>
          Probeer het opnieuw / Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#2a523b",
            color: "white",
            border: 0,
            borderRadius: "0.75rem",
            padding: "0.75rem 1.5rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Opnieuw proberen / Try again
        </button>
      </body>
    </html>
  );
}
