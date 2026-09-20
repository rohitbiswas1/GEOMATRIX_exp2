import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    trained: false,
    algorithm: 'RandomForest',
    message: 'Model not trained — using demo mode with local project data only.',
  });
}
