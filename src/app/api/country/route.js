// app/api/country/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const countries = ["India", "USA", "Germany", "Canada"];
  return NextResponse.json(countries);
}
