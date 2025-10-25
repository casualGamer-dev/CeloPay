import { publicClient, requireWallet } from '../viemClient'
import { ChatStoreAbi } from './ChatStore.abi'
import { keccak256, stringToBytes, Hex } from 'viem'

const CHAT_ADDRESS = (process.env.NEXT_PUBLIC_CHATSTORE_ADDRESS || process.env.CHATSTORE_ADDRESS) as `0x${string}`

export function chatIdFromString(s: string): Hex { return keccak256(stringToBytes(s)) }

export async function appendMessage({ chatKey, content }: { chatKey: string, content: string }) {
  const wallet = requireWallet()
  if (!CHAT_ADDRESS) throw new Error('ChatStore address not set')
  return wallet.writeContract({
    address: CHAT_ADDRESS,
    abi: ChatStoreAbi,
    functionName: 'append',
    args: [chatIdFromString(chatKey), stringToBytes(content)]
  })
}

export type OnchainMessage = { author: `0x${string}`, timestamp: number, content: string }

export async function getMessages({ chatKey, start = 0, end }: { chatKey: string, start?: number, end?: number }) : Promise<OnchainMessage[]> {
  if (!CHAT_ADDRESS) throw new Error('ChatStore address not set')
  const id = chatIdFromString(chatKey)
  const total = Number(await publicClient.readContract({ address: CHAT_ADDRESS, abi: ChatStoreAbi, functionName: 'count', args: [id] }))
  const to = typeof end === 'number' ? Math.min(end, total) : total
  if (to <= start) return []
  const [authors, timestamps, contents] = await publicClient.readContract({
    address: CHAT_ADDRESS, abi: ChatStoreAbi, functionName: 'getRange', args: [id, BigInt(start), BigInt(to)]
  }) as [string[], number[], `0x${string}`[]]
  return authors.map((a, i) => ({
    author: a as `0x${string}`,
    timestamp: Number(timestamps[i]),
    content: new TextDecoder().decode(new Uint8Array(Buffer.from(contents[i].slice(2), 'hex')))
  }))
}
