import { NextResponse } from "next/server";

export async function GET() {
  // Base numbers (your demo values)
  const base = {
    mentions: 2900,
    impressions: 393000000,
    positiveSentiment: 64,
    engagements: 7800,
  };

  // Small, realistic wiggle
  const mentionsWiggle = Math.floor(Math.random() * 30); // +0–29
  const impressionsWiggle = Math.floor(Math.random() * 3_500_000); // +0–3.5M
  const sentimentWiggle = Math.floor(Math.random() * 5) - 2; // -2..+2
  const engagementsWiggle = Math.floor(Math.random() * 200); // +0–199

  const positive = Math.max(45, Math.min(85, base.positiveSentiment + sentimentWiggle));

  return NextResponse.json({
    metrics: {
      mentions: base.mentions + mentionsWiggle,
      impressions: base.impressions + impressionsWiggle,
      positiveSentiment: positive,
      engagements: base.engagements + engagementsWiggle,
    },
  });
}