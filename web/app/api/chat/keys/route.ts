import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), 'data', 'store.json');

type Store = {
  circles: any[];
  loans: any[];
  pqcKeys?: { address: string; algo: 'MLKEM768' | 'MLKEM512' | 'MLKEM1024'; publicKeyB64: string; updatedAt: number }[];
  messages?: any[];
};

async function readStore(): Promise<Store> {
  const raw = await fs.readFile(DATA_FILE, 'utf8').catch(async () => {
    const fallback = JSON.stringify({ circles: [], loans: [], pqcKeys: [], messages: [] }, null, 2);
    await fs.writeFile(DATA_FILE, fallback, 'utf8');
    return fallback;
  });
  const db: Store = JSON.parse(raw);
  db.pqcKeys ||= [];
  db.messages ||= [];
  return db;
}
async function writeStore(data: Store) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get('address') || '').toLowerCase();
  const db = await readStore();
  const item = db.pqcKeys!.find(k => k.address === address);
  return NextResponse.json({ ok: true, data: item || null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const address = String(body.address || '').toLowerCase();
  const algo = (body.algo || 'MLKEM768') as Store['pqcKeys'][number]['algo'];
  const publicKeyB64 = String(body.publicKeyB64 || '');
  if (!/^0x[0-9a-f]{40}$/i.test(address)) {
    return NextResponse.json({ ok: false, error: 'Invalid wallet address' }, { status: 400 });
  }
  if (!publicKeyB64) {
    return NextResponse.json({ ok: false, error: 'Missing publicKeyB64' }, { status: 400 });
  }
  const db = await readStore();
  const now = Date.now();
  const existing = db.pqcKeys!.find(k => k.address === address);
  if (existing) {
    existing.publicKeyB64 = publicKeyB64;
    existing.algo = algo;
    existing.updatedAt = now;
  } else {
    db.pqcKeys!.push({ address, algo, publicKeyB64, updatedAt: now });
  }
  await writeStore(db);
  return NextResponse.json({ ok: true });
}
