import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [
      {
        id: "test-1",
        type: "Exec",
        platform: "X",
        authorName: "Test Exec",
        sourceName: "Test Exec",
        title: "Test leaderboard entry",
        url: "https://x.com/",
        timestampISO: new Date().toISOString(),
        sentiment: "Positive",
        metrics: { impressions: 1000, likes: 100 }
      }
    ]
  });
}