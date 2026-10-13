export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: "#090D16", color: "#F4F4F5" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>404 - Page Not Found</h1>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "2rem" }}>The page you are looking for does not exist.</p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: 700, padding: "10px 20px", background: "rgba(59,130,246,0.1)", borderRadius: "6px", border: "1px solid rgba(59,130,246,0.3)" }}>
        Return to TaxWise Home
      </a>
    </div>
  );
}

