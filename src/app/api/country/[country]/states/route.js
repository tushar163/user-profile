import { NextResponse } from 'next/server';

export async function GET(request, context) {
  const { country } = context.params;

  const states = {
    India: ["Maharashtra", "Delhi"],
    USA: ["California", "Texas"],
  };

  return NextResponse.json(states[country] || []);
}
