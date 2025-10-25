import { NextResponse } from 'next/server'
import { appendMessage, getMessages } from '../../../lib/onchain/adapter'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const chatKey = searchParams.get('chat') || 'default'
  const messages = await getMessages({ chatKey })
  return NextResponse.json({ ok: true, messages })
}

export async function POST(req: Request) {
  const body = await req.json()
  const chatKey = body.chatKey || 'default'
  const content = body.content
  if (!content) return NextResponse.json({ ok: false, error: 'Missing content' }, { status: 400 })
  const tx = await appendMessage({ chatKey, content })
  return NextResponse.json({ ok: true, tx })
}
