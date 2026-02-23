import { NextResponse } from "next/server";
import data from "@/app/data/cashBitcoin.json";

export async function GET() {
  return NextResponse.json({
    items: (data as any).items ?? [],
  });
}