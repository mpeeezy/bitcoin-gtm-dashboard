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
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.round(mins / 60)}h`;
}

function SentimentPill({ s }: { s?: Sentiment }) {
  const bg =
    s === "Positive"
      ? "rgba(0,255,136,0.12)"
      : s === "Neutral"
      ? "rgba(255,255,255,0.08)"
      : s === "Negative"
      ? "rgba(255,80,80,0.12)"
      : "rgba(255,255,255,0.06)";

  return (
    <span
      style={{
        borderRadius: 999,
        padding: "4px 14px",
        fontSize: 12,
        border: "1px solid #1f1f1f",
        background: bg,
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

  async function fetchMetrics() {
    const res = await fetch("/api/metrics");
    const json = await res.json();
    setMetrics(json);
  }

  async function fetchFeed() {
    const res = await fetch("/api/feed");
    const json = await res.json();
    setFeed(json);
  }

  useEffect(() => {
    fetchMetrics();
    fetchFeed();
  }, []);

  const m = metrics?.metrics;

  const items = useMemo(() => {
    const list = feed?.items ?? [];
    const filtered =
      filter === "All" ? list : list.filter((x) => x.type === filter);

    const engagement = (it: FeedItem) =>
      (it.metrics.likes ?? 0) +
      (it.metrics.replies ?? 0) +
      (it.metrics.reposts ?? 0) +
      (it.metrics.clicks ?? 0);

    return [...filtered].sort((a, b) => {
      if (sortKey === "Most Recent")
        return new Date(b.timestampISO).getTime() -
          new Date(a.timestampISO).getTime();
      if (sortKey === "Impressions")
        return (b.metrics.impressions ?? 0) -
          (a.metrics.impressions ?? 0);
      return engagement(b) - engagement(a);
    });
  }, [feed, filter, sortKey]);

  return (
    <main className="main">
      {/* HEADER */}
      <header style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>
          Cash Bitcoin 2.0 <span className="accent">GTM Command Center</span>
        </h1>
        <p className="hint" style={{ marginTop: 10 }}>
          Unified top-of-funnel performance readout across social, earned, and owned channels.
        </p>
      </header>

      {/* WHAT IS + SOT */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 30,
        }}
      >
        <div className="card">
          <strong>What is Cash Bitcoin 2.0?</strong>
          <p className="hint" style={{ marginTop: 10 }}>
            A product-led relaunch positioning Cash App as the cheapest,
            fastest, and most utility-driven way to buy, move, and spend bitcoin.
          </p>
        </div>

        <div className="card">
          <strong>Source of Truth (SOT)</strong>
          <ul className="hint" style={{ marginTop: 10 }}>
            <li>• X + Nostr ingestion APIs</li>
            <li>• Earned media via PR monitoring</li>
            <li>• Open Letter page analytics</li>
            <li>• AI-powered sentiment classification</li>
          </ul>
        </div>
      </section>

      {/* KPI ROW */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 24,
          marginBottom: 30,
        }}
      >
        <div className="card">
          <div className="hint">Mentions</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {m ? formatNumber(m.mentions) : "—"}
          </div>
        </div>

        <div className="card">
          <div className="hint">Impressions</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {m ? formatNumber(m.impressions) : "—"}
          </div>
        </div>

        <div className="card">
          <div className="hint">Positive Sentiment</div>
          <div className="accent" style={{ fontSize: 32, fontWeight: 700 }}>
            {m ? `${m.positiveSentiment}%` : "—"}
          </div>
        </div>
      </section>

      {/* LEADERBOARD */}
      <section className="card">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          {(["All", "Earned", "Creator", "Exec", "Owned"] as const).map(
            (t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  borderRadius: 999,
                  padding: "6px 14px",
                  border: "1px solid #1f1f1f",
                  background:
                    filter === t
                      ? "rgba(255,136,0,0.12)"
                      : "transparent",
                  color: "#fff",
                  fontSize: 13,
                }}
              >
                {t}
              </button>
            )
          )}

          <select
            value={sortKey}
            onChange={(e) =>
              setSortKey(e.target.value as SortKey)
            }
            style={{
              borderRadius: 8,
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
              borderRadius: 8,
              padding: "6px 12px",
              border: "1px solid #1f1f1f",
              background: showAll
                ? "rgba(255,136,0,0.12)"
                : "transparent",
              color: "#fff",
              fontSize: 13,
            }}
          >
            {showAll ? "Show Top 10" : "Show All 50"}
          </button>
        </div>

        {items.slice(0, showAll ? 50 : 10).map((it, index) => {
          const engagement =
            (it.metrics.likes ?? 0) +
            (it.metrics.replies ?? 0) +
            (it.metrics.reposts ?? 0) +
            (it.metrics.clicks ?? 0);

          return (
            <a
              key={it.id}
              href={it.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "60px 1.6fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr",
                gap: 16,
                padding: "16px 0",
                borderTop: "1px solid #121212",
                textDecoration: "none",
                color: "inherit",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700 }}>{index + 1}</div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {it.title}
                </div>
                <div className="hint">
                  {it.sourceName ?? it.authorName}
                </div>
              </div>
              <div>{it.type}</div>
              <div>{it.platform}</div>
              <div>Eng: {formatNumber(engagement)}</div>
              <div>{timeAgo(it.timestampISO)}</div>
              <SentimentPill s={it.sentiment} />
            </a>
          );
        })}
      </section>
    </main>
  );
}