import { httpRequest } from '../../lib/http';
import type { WithdrawResponse } from '../../types';

export function createWithdraw(input: {
  investmentId: number;
  withdrawDate: string;
  notes?: string;
}): Promise<WithdrawResponse> {
  return httpRequest<WithdrawResponse>('/api/withdraw/newWithdraw', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
