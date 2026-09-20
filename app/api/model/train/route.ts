import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Training is disabled in local/demo mode. Use the backend pipeline to train the model.',
  }, { status: 503 });
}
