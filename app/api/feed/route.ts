import { NextResponse } from "next/server";

type Sentiment = "Positive" | "Neutral" | "Negative";

function pickSentiment(): Sentiment {
  const r = Math.random();
  if (r < 0.62) return "Positive";
  if (r < 0.87) return "Neutral";
  return "Negative";
}

function nowMinusMinutes(min: number) {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

function jitter(n?: number, pct = 0.08) {
  if (typeof n !== "number") return undefined;
  const change = (Math.random() * 2 - 1) * pct;
  return Math.max(0, Math.round(n * (1 + change)));
}

const BASE = [
  {
    id: "owned-open-letter",
    type: "Owned" as const,
    platform: "Web" as const,
    authorName: "Cash App Press",
    sourceName: "Cash App",
    title: "Open Letter: Updates to Bitcoin Fees and Withdrawals",
    url: "https://cash.app/press/cash-bitcoin-updates-fees-withdrawals",
    metrics: { clicks: 5400 },
  },
  {
    id: "earned-bm",
    type: "Earned" as const,
    platform: "Web" as const,
    authorName: "Bitcoin Magazine",
    sourceName: "Bitcoin Magazine",
    title: "Bitcoin Magazine interview with Miles (went live 02.18)",
    url: "https://bitcoinmagazine.com/",
    metrics: { clicks: 3200 },
  },
  {
    id: "earned-ct",
    type: "Earned" as const,
    platform: "X" as const,
    authorName: "Cointelegraph",
    authorHandle: "@Cointelegraph",
    sourceName: "Cointelegraph",
    title: "Cash App cuts Bitcoin fees in strategic relaunch",
    url: "https://x.com/",
    metrics: { impressions: 210000, likes: 3100, replies: 260, reposts: 520 },
  },
  {
    id: "earned-yf",
    type: "Earned" as const,
    platform: "Web" as const,
    authorName: "Yahoo Finance",
    sourceName: "Yahoo Finance",
    title: "Coverage: Cash Bitcoin updates (earned pickup)",
    url: "https://finance.yahoo.com/",
    metrics: { clicks: 2400 },
  },
  {
    id: "creator-x",
    type: "Creator" as const,
    platform: "X" as const,
    authorName: "Creator",
    authorHandle: "@stackingsats",
    title: "Demo: zero-fee recurring buys in Cash App (screen recording)",
    url: "https://x.com/",
    metrics: { impressions: 62000, likes: 980, replies: 44, reposts: 120 },
  },
  {
    id: "creator-nostr",
    type: "Creator" as const,
    platform: "Nostr" as const,
    authorName: "Nostr Dev",
    authorHandle: "npub1…",
    title: "Thread: Cash App Bitcoin 2.0 — fee changes + withdrawals",
    url: "https://njump.me/",
    metrics: { impressions: 8000, likes: 120, replies: 18, reposts: 9 },
  },
];

export async function GET() {
  // Expand into “Top 50” rows for demo
  const items = Array.from({ length: 50 }).map((_, i) => {
    const base = BASE[i % BASE.length];
    return {
      ...base,
      id: `${base.id}-${i}`,
      timestampISO: nowMinusMinutes((i + 1) * 6),
      sentiment: pickSentiment(),
      metrics: {
        impressions: jitter((base as any).metrics.impressions),
        likes: jitter((base as any).metrics.likes),
        replies: jitter((base as any).metrics.replies),
        reposts: jitter((base as any).metrics.reposts),
        clicks: jitter((base as any).metrics.clicks),
      },
    };
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    items,
  });
}