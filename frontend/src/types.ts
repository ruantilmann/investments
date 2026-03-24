export type InvestmentStatus = 'ACTIVE' | 'WITHDRAWN' | 'CANCELLED';

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type Wallet = {
  id: number;
  userId: number;
  balance: string;
  createdAt: string;
  updatedAt: string;
};

export type UserWithWallet = User & {
  wallet: Wallet | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Investment = {
  id: number;
  walletId: number;
  initialAmount: string;
  currentAmount: string;
  yieldAmount: string;
  investedAt: string;
  status: InvestmentStatus;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvestmentSummary = {
  userId: number;
  totalInvested: string;
  totalActiveInvested: string;
  totalExpectedBalanceActive: string;
  totalWithdrawnGross: string;
  totalWithdrawnNet: string;
  totalTaxPaid: string;
  countInvestments: number;
  countActive: number;
  countWithdrawn: number;
};

export type WithdrawResponse = {
  id: number;
  investmentId: number;
  grossAmount: string;
  taxAmount: string;
  netAmount: string;
  profitAmount: string;
  withdrawDate: string;
  notes: string | null;
  createdAt: string;
  taxRate: string;
};
