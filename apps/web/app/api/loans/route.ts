import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { LoanRequest, ApiResponse } from '@nyaayapay/shared/src';

const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), 'data', 'store.json');

async function readStore() {
  const raw = await fs.readFile(DATA_FILE, 'utf8').catch(async () => {
    const fallback = JSON.stringify({ circles: [], loans: [] }, null, 2);
    await fs.writeFile(DATA_FILE, fallback, 'utf8');
    return fallback;
  });
  return JSON.parse(raw) as { circles: any[], loans: LoanRequest[] };
}
async function writeStore(data: any) { await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }

export async function GET() {
  const db = await readStore();
  return NextResponse.json({ ok: true, data: db.loans } as ApiResponse<LoanRequest[]>);
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = await readStore();
  const now = Date.now();
  const loan: LoanRequest = {
    id: body.id || `${now}-${Math.random().toString(36).slice(2)}`,
    borrower: body.borrower, circleId: body.circleId,
    amountCUSD: body.amountCUSD, installments: body.installments || 3,
    approvals: [], status: 'PENDING', createdAt: now, dueDates: []
  };
  db.loans.push(loan); await writeStore(db);
  return NextResponse.json({ ok: true, data: loan });
}
