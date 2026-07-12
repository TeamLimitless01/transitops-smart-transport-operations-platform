import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif", color: "#f1f5f9"
    }}>
      <div style={{ textAlign: "center", gap: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28
        }}>🚦</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>TransitOps Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: 15 }}>
          Welcome back, <strong style={{ color: "#a5b4fc" }}>{session.user.name}</strong>
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 20, padding: "6px 14px", fontSize: 13, color: "#818cf8"
        }}>
          {session.user.role?.replace("_", " ")}
        </div>
        <form action="/api/auth/signout" method="POST" style={{ marginTop: 8 }}>
          <button style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#fca5a5", padding: "8px 20px", borderRadius: 10, cursor: "pointer",
            fontSize: 13, fontFamily: "inherit"
          }}>Sign out</button>
        </form>
      </div>
    </div>
  );
}
