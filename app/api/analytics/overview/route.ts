import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json(
		{ error: 'Analytics require real project records in the database.' },
		{ status: 503 },
	);
}
