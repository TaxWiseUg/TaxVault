"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "40px 20px", background: "#090D16", color: "#F4F4F5", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>An application error occurred</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem", maxWidth: 480, margin: "0 auto 1.5rem" }}>
          {error?.message || "Something went wrong while rendering the page."}
        </p>
        <button
          onClick={() => reset()}
          style={{ padding: "10px 20px", background: "#3B82F6", color: "#FFFFFF", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
