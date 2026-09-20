import { NextResponse } from 'next/server';
import { buildDashboardSummary } from '../../_demo-data';

export async function GET() {
  return NextResponse.json(buildDashboardSummary());
}
