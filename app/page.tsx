"use client";

import { useEffect, useMemo, useState } from "react";

type Metrics = {
  mentions: number;
  impressions: number;
  positiveSentiment: number;
  engagements: number;
};

type MetricsApiResponse = {
  metrics: Metrics;
};

type Sentiment = "Positive" | "Neutral" | "Negative";

type FeedItem = {
  id: string;
  type: "Earned" | "Creator" | "Exec" | "Owned";
  platform: "X" | "Nostr" | "Web";
  authorName: string;
  sourceName?: string;
  title: string;
  url: string;
  timestampISO: string;
  sentiment?: Sentiment;
  metrics: {
    impressions?: number;
    likes?: number;
    replies?: number;
    reposts?: number;
    clicks?: number;
  };
};

type FeedApiResponse = {
  items: FeedItem[];
};

type SortKey = "Engagement" | "Most Recent" | "Impressions";

function formatNumber(n?: number) {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ✅ Rollout window you gave me:
const ROLLOUT_START_ISO = "2026-02-09T16:00:00.000Z"; // Mon Feb 9 (anchor)
const ROLLOUT_END_ISO = "2026-02-18T23:59:59.000Z"; // Wed Feb 18 (end)
const ROLLOUT_START_MS = new Date(ROLLOUT_START_ISO).getTime();
const ROLLOUT_END_MS = new Date(ROLLOUT_END_ISO).getTime();
const ROLLOUT_SPAN_MS = Math.max(1, ROLLOUT_END_MS - ROLLOUT_START_MS);

/**
 * If an item timestamp is too "fresh" (e.g., within 48 hours),
 * remap it deterministically into the rollout window Feb 9 → Feb 18.
 * This makes Recency honest for a “last week” GTM demo.
 */
function normalizedTimestampISO(originalISO: string, stableIndex: number) {
  const ms = new Date(originalISO).getTime();
  const invalid = Number.isNaN(ms);
  const hoursAgo = invalid ? Infinity : (Date.now() - ms) / (1000 * 60 * 60);
  const tooFresh = hoursAgo >= 0 && hoursAgo < 48;

  if (invalid || tooFresh) {
    // Deterministic spread across rollout window.
    // This prevents every row showing the exact same day/time.
    const step = clamp(stableIndex, 0, 200);
    const pct = ((step * 37) % 100) / 100; // pseudo-random but stable
    const remapped = ROLLOUT_START_MS + Math.floor(pct * ROLLOUT_SPAN_MS);

    // Add a smaller "within-day" offset to vary times further
    const extraHours = ((step * 11) % 24) * 60 * 60 * 1000;
    const finalMs = clamp(remapped + extraHours, ROLLOUT_START_MS, ROLLOUT_END_MS);

    return new Date(finalMs).toISOString();
  }

  // If it's already older than 48h (e.g., truly from launch week), keep it.
  return originalISO;
}

function recencyLabel(iso: string) {
  const t = new Date(iso).getTime();
  const diffMinutes = Math.round((Date.now() - t) / 60000);

  if (diffMinutes < 60) return `${Math.max(diffMinutes, 0)}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
}

function SentimentPill({ s }: { s?: Sentiment }) {
  const style =
    s === "Positive"
      ? {
          bg: "rgba(0, 255, 136, 0.24)",
          border: "rgba(0, 255, 136, 0.65)",
          glow: "0 0 18px rgba(0,255,136,0.28)",
          text: "#d9ffe9",
        }
      : s === "Neutral"
      ? {
          bg: "rgba(255, 255, 255, 0.18)",
          border: "rgba(255, 255, 255, 0.34)",
          glow: "0 0 14px rgba(255,255,255,0.14)",
          text: "#ffffff",
        }
      : s === "Negative"
      ? {
          bg: "rgba(255, 70, 70, 0.22)",
          border: "rgba(255, 70, 70, 0.62)",
          glow: "0 0 18px rgba(255,70,70,0.22)",
          text: "#ffe3e3",
        }
      : {
          bg: "rgba(255,255,255,0.10)",
          border: "rgba(255,255,255,0.18)",
          glow: "none",
          text: "#fff",
        };

  return (
    <span
      style={{
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
        border: `1px solid ${style.border}`,
        background: style.bg,
        boxShadow: style.glow,
        color: style.text,
        justifySelf: "end",
        width: "fit-content",
        textTransform: "capitalize",
      }}
    >
      {s ?? "—"}
    </span>
  );
}

export default function Page() {
  const [metrics, setMetrics] = useState<MetricsApiResponse | null>(null);
  const [feed, setFeed] = useState<FeedApiResponse | null>(null);
  const [filter, setFilter] = useState<"All" | FeedItem["type"]>("All");
  const [sortKey, setSortKey] = useState<SortKey>("Engagement");
  const [showAll, setShowAll] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  async function fetchMetrics() {
    try {
      const res = await fetch("/api/metrics", { cache: "no-store" });
      const json = await res.json();
      setMetrics(json);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("fetchMetrics error", e);
    }
  }

  async function fetchFeed() {
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      const json = await res.json();
      setFeed(json);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("fetchFeed error", e);
    }
  }

  useEffect(() => {
    fetchMetrics();
    fetchFeed();

    const interval = setInterval(() => {
      fetchMetrics();
      fetchFeed();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const m = metrics?.metrics;

  const items = useMemo(() => {
    const list = feed?.items ?? [];
    const filtered = filter === "All" ? list : list.filter((x) => x.type === filter);

    const engagement = (it: FeedItem) =>
      (it.metrics.likes ?? 0) +
      (it.metrics.replies ?? 0) +
      (it.metrics.reposts ?? 0) +
      (it.metrics.clicks ?? 0);

    return [...filtered].sort((a, b) => {
      const aMs = new Date(a.timestampISO).getTime();
      const bMs = new Date(b.timestampISO).getTime();

      if (sortKey === "Most Recent") {
        return (Number.isNaN(bMs) ? 0 : bMs) - (Number.isNaN(aMs) ? 0 : aMs);
      }
      if (sortKey === "Impressions") {
        return (b.metrics.impressions ?? 0) - (a.metrics.impressions ?? 0);
      }
      return engagement(b) - engagement(a);
    });
  }, [feed, filter, sortKey]);

  // Wider Post column; tighter Recency + Sentiment.
  const gridCols = "60px 2.35fr 0.7fr 0.7fr 0.7fr 0.50fr 0.60fr";

  return (
    <main className="main">
      <header style={{ marginBottom: 26 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>
          Cash Bitcoin 2.0 <span className="accent">GTM Command Center</span>
        </h1>
        <p className="hint" style={{ marginTop: 10 }}>
          Unified top-of-funnel readout across social, earned media, and owned channels.
        </p>
        <p className="hint" style={{ marginTop: 6 }}>
          Last updated: <span className="accent">{lastUpdated || "—"}</span>
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 26,
        }}
      >
        <div className="card">
          <strong>What is Cash Bitcoin 2.0?</strong>
          <p className="hint" style={{ marginTop: 10 }}>
            A product-led relaunch positioning Cash App as the easiest, lowest-friction way to buy,
            move, and use bitcoin—supported by a coordinated GTM across product, comms, and social.
          </p>
        </div>

        <div className="card">
          <strong>Source of Truth (SOT)</strong>
          <ul className="hint" style={{ marginTop: 10, paddingLeft: 18 }}>
            <li>Social: X + Nostr ingestion (demo-mode today)</li>
            <li>Earned: PR monitoring + coverage list</li>
            <li>Owned: Open Letter analytics</li>
            <li>AI layer: classification + sentiment tagging (demo-mode)</li>
          </ul>
          <p className="hint" style={{ marginTop: 10 }}>
            Rollout window (recency):{" "}
            <span className="accent">
              {new Date(ROLLOUT_START_ISO).toDateString()} → {new Date(ROLLOUT_END_ISO).toDateString()}
            </span>
          </p>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 24,
          marginBottom: 26,
        }}
      >
        <div className="card">
          <div className="hint">Mentions</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{m ? formatNumber(m.mentions) : "—"}</div>
        </div>

        <div className="card">
          <div className="hint">Impressions</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{m ? formatNumber(m.impressions) : "—"}</div>
        </div>

        <div className="card">
          <div className="hint">Positive Sentiment</div>
          <div className="accent" style={{ fontSize: 28, fontWeight: 900 }}>
            {m ? `${m.positiveSentiment}%` : "—"}
          </div>
        </div>

        <div className="card">
          <div className="hint">Engagements</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{m ? formatNumber(m.engagements) : "—"}</div>
        </div>
      </section>

      <section className="card">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {(["All", "Earned", "Creator", "Exec", "Owned"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                borderRadius: 999,
                padding: "6px 14px",
                border: "1px solid #1f1f1f",
                background: filter === t ? "rgba(255,136,0,0.14)" : "transparent",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {t}
            </button>
          ))}

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            style={{
              borderRadius: 10,
              padding: "6px 12px",
              border: "1px solid #1f1f1f",
              background: "#0a0a0a",
              color: "#fff",
              fontSize: 13,
            }}
          >
            <option>Engagement</option>
            <option>Most Recent</option>
            <option>Impressions</option>
          </select>

          <button
            onClick={() => setShowAll((v) => !v)}
            style={{
              borderRadius: 10,
              padding: "6px 12px",
              border: "1px solid #1f1f1f",
              background: showAll ? "rgba(255,136,0,0.14)" : "transparent",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {showAll ? "Show Top 10" : "Show All 50"}
          </button>
        </div>

        <div
          className="hint"
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: 16,
            paddingBottom: 10,
          }}
        >
          <div>#</div>
          <div>Post</div>
          <div>Type</div>
          <div>Platform</div>
          <div>Eng</div>
          <div>Recency</div>
          <div style={{ justifySelf: "end" }}>Sentiment</div>
        </div>

        {items.slice(0, showAll ? 50 : 10).map((it, index) => {
          const engagement =
            (it.metrics.likes ?? 0) +
            (it.metrics.replies ?? 0) +
            (it.metrics.reposts ?? 0) +
            (it.metrics.clicks ?? 0);

          const displayISO = normalizedTimestampISO(it.timestampISO, index);
          const recency = recencyLabel(displayISO);

          return (
            <a
              key={it.id}
              href={it.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                gap: 16,
                padding: "14px 0",
                borderTop: "1px solid #121212",
                textDecoration: "none",
                color: "inherit",
                alignItems: "center",
              }}
              title={`Timestamp: ${new Date(displayISO).toLocaleString()}`}
            >
              <div style={{ fontWeight: 800 }}>{index + 1}</div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{it.title}</div>
                <div className="hint">{it.sourceName ?? it.authorName}</div>
              </div>

              <div>{it.type}</div>
              <div>{it.platform}</div>
              <div>Eng: {formatNumber(engagement)}</div>
              <div>{recency}</div>

              <SentimentPill s={it.sentiment} />
            </a>
          );
        })}
      </section>
    </main>
  );
}