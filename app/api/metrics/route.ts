import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    metrics: {
      mentions: 2900,
      impressions: 393000000,
      positiveSentiment: 64,
      engagements: 7800,
    },
  });
}