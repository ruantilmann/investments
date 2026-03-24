import { httpRequest } from '../../lib/http';
import type { Investment, InvestmentStatus, InvestmentSummary, PaginatedResponse } from '../../types';

type ListInvestmentsParams = {
  userId: number;
  page?: number;
  limit?: number;
  status?: InvestmentStatus;
};

export function listInvestmentsByUser(params: ListInvestmentsParams): Promise<PaginatedResponse<Investment>> {
  const search = new URLSearchParams();

  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.status) search.set('status', params.status);

  const suffix = search.toString() ? `?${search.toString()}` : '';
  return httpRequest<PaginatedResponse<Investment>>(`/api/investments/user/${params.userId}${suffix}`);
}

export function getInvestmentSummaryByUser(userId: number): Promise<InvestmentSummary> {
  return httpRequest<InvestmentSummary>(`/api/investments/user/${userId}/summary`);
}

export function createInvestment(input: {
  walletId: number;
  initialAmount: number;
  investedAt: string;
}): Promise<Investment> {
  return httpRequest<Investment>('/api/investments/newInvestment', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function cancelInvestment(id: number, reason?: string): Promise<Investment> {
  return httpRequest<Investment>(`/api/investments/${id}/cancel-investment`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'CANCELLED',
      ...(reason ? { reason } : {}),
    }),
  });
}
