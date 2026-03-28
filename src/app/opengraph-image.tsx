import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AgentZone — Unified Explorer for Trustless AI Agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#07080a",
          fontFamily: "monospace",
        }}
      >
        {/* Green glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)",
          }}
        />

        {/* Logo + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "#00ff88",
            }}
          />
          <span style={{ fontSize: 64, fontWeight: 700, color: "#e8eaed" }}>
            AgentZone
          </span>
        </div>

        {/* Subtitle */}
        <span style={{ fontSize: 28, color: "#8b949e", marginBottom: 48 }}>
          Unified Explorer for Trustless AI Agents
        </span>

        {/* Divider */}
        <div
          style={{
            width: 800,
            height: 1,
            backgroundColor: "#00ff88",
            opacity: 0.3,
            marginBottom: 32,
          }}
        />

        {/* Stats */}
        <div style={{ display: "flex", gap: 64 }}>
          {[
            { label: "Agents", value: "37K+" },
            { label: "Identity", value: "ERC-8004" },
            { label: "Payments", value: "x402" },
            { label: "Chains", value: "Multi" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 700, color: "#00ff88" }}>
                {s.value}
              </span>
              <span style={{ fontSize: 16, color: "#6b7280" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <span
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "#374151",
          }}
        >
          agentzone.fun
        </span>
      </div>
    ),
    { ...size }
  );
}
