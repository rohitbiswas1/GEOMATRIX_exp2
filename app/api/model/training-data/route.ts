import { NextResponse } from 'next/server';
import { demoProjects } from '../../_demo-data';

export async function GET() {
  return NextResponse.json({
    total_records: demoProjects.length,
    delayed_count: demoProjects.filter((p) => (p.delay_probability ?? 0) > 0.45).length,
    on_time_count: demoProjects.filter((p) => (p.delay_probability ?? 0) <= 0.45).length,
    ready_to_train: false,
    message: 'Demo model dataset is available but not trained in this local environment.',
  });
}
