import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic'; // avoid caching in dev
export const runtime = 'nodejs';

const DEMO_A = '0x4a5c98505d0b7a055db0ced8af6213e3210629f6'.toLowerCase();
const DEMO_B = '0xb4fb12dffcf9dbafa0f270a97d9498251c4a79d6'.toLowerCase();

const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), 'data', 'store.json');

type Message = {
  id: string;
  from: string; // 0x...
  to: string;   // 0x...
  ciphertextB64: string;
  ivB64: string;
  timestamp: number;
  // PQC bootstrap (optional, first message in a session)
  kemCtB64?: string;
  saltB64?: string;
};

type Store = {
  circles: any[];
  loans: any[];
  pqcKeys?: any[];
  messages?: Message[];
};

async function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
}

async function readStore(): Promise<Store> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const db: Store = JSON.parse(raw);
    db.pqcKeys ||= [];
    db.messages ||= [];
    return db;
  } catch {
    const fresh: Store = { circles: [], loans: [], pqcKeys: [], messages: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(fresh, null, 2), 'utf8');
    return fresh;
  }
}

async function writeStore(data: Store) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function isAddr(x: string) {
  return /^0x[0-9a-f]{40}$/i.test(x);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const aParam = (searchParams.get('a') || '').toLowerCase();
    const bParam = (searchParams.get('b') || '').toLowerCase();

    let a = aParam;
    let b = bParam;

    // If no params provided, fall back to demo addresses
    if (!a && !b) {
      a = DEMO_A;
      b = DEMO_B;
    }

    // Validate after fallback
    if (!isAddr(a) || !isAddr(b)) {
      return NextResponse.json({ ok: false, error: 'Invalid or missing ?a=&b= wallet addresses' }, { status: 400 });
    }

    const db = await readStore();
    const data = db.messages!
      .filter(m => (m.from === a && m.to === b) || (m.from === b && m.to === a))
      .sort((x, y) => x.timestamp - y.timestamp);

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error('GET /api/chat error:', e?.stack || e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const from = String(body.from || '').toLowerCase();
    const to = String(body.to || '').toLowerCase();
    const ciphertextB64 = String(body.ciphertextB64 || '');
    const ivB64 = String(body.ivB64 || '');
    const kemCtB64 = body.kemCtB64 ? String(body.kemCtB64) : undefined;
    const saltB64 = body.saltB64 ? String(body.saltB64) : undefined;

    if (!isAddr(from) || !isAddr(to)) {
      return NextResponse.json({ ok: false, error: 'Invalid from/to' }, { status: 400 });
    }
    if (!ciphertextB64 || !ivB64) {
      return NextResponse.json({ ok: false, error: 'Missing ciphertext/iv' }, { status: 400 });
    }

    const db = await readStore();
    const now = Date.now();
    const msg: Message = {
      id: `${now}-${Math.random().toString(36).slice(2)}`,
      from, to, ciphertextB64, ivB64, timestamp: now,
      ...(kemCtB64 && saltB64 ? { kemCtB64, saltB64 } : {}),
    };
    db.messages!.push(msg);
    await writeStore(db);
    return NextResponse.json({ ok: true, data: msg });
  } catch (e) {
    console.error('POST /api/chat error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
