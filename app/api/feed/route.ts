import { NextResponse } from "next/server";
import data from "@/app/data/cashBitcoin.json";

export async function GET() {
  // data is the full JSON file
  // we only return what the UI expects: { items: [...] }
  return NextResponse.json({
    items: (data as any).items ?? [],
  });
}