import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { TrustCircle, ApiResponse } from '@nyaayapay/shared/src';

const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), 'data', 'store.json');

async function readStore() {
  const raw = await fs.readFile(DATA_FILE, 'utf8').catch(async () => {
    const fallback = JSON.stringify({ circles: [], loans: [] }, null, 2);
    await fs.writeFile(DATA_FILE, fallback, 'utf8');
    return fallback;
  });
  return JSON.parse(raw) as { circles: TrustCircle[], loans: any[] };
}
async function writeStore(data: any) { await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }

export async function GET() {
  const db = await readStore();
  return NextResponse.json({ ok: true, data: db.circles } as ApiResponse<TrustCircle[]>);
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = await readStore();
  const now = Date.now();
  const circle: TrustCircle = {
    id: body.id || `${now}-${Math.random().toString(36).slice(2)}`,
    name: body.name, description: body.description,
    members: body.members || [], createdBy: body.createdBy, createdAt: now
  };
  db.circles.push(circle); await writeStore(db);
  return NextResponse.json({ ok: true, data: circle });
}
