import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { state } = params;

  const cities = {
    Maharashtra: ["Mumbai", "Pune"],
    Delhi: ["New Delhi"],
    California: ["Los Angeles", "San Francisco"]
  };

  return NextResponse.json(cities[state] || []);
}
