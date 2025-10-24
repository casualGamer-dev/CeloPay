export type Address = `0x${string}`;
export type TrustCircle = {
  id: string; name: string; description?: string; members: Address[]; createdBy: Address; createdAt: number;
};
export type LoanRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPAID';
export type LoanRequest = {
  id: string; borrower: Address; circleId: string; amountCUSD: string; installments: number;
  approvals: Address[]; status: LoanRequestStatus; createdAt: number; dueDates: number[];
};
export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };
