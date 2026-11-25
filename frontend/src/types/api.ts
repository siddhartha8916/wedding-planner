import type {
  CeremonyTag,
  ContributorSide,
  ExpenseStatus,
  PaymentMethod,
  PaymentRecord,
} from './wedding.ts';

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface SaveWeddingPayload {
  brideName: string;
  groomName: string;
  weddingDate: string;
  totalBudget: number;
  contingencyPercent: number;
  isOnboarded?: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  icon: string;
  allocatedBudget?: number;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface ExpenseListFilters {
  categoryId?: string;
  status?: ExpenseStatus | 'all';
  ceremony?: CeremonyTag | 'all';
  paidBy?: ContributorSide | 'all';
  search?: string;
}

export interface CreatePaymentPayload {
  amount: number;
  paidDate: string;
  label: string;
  method: PaymentMethod;
  paidBy: ContributorSide;
  note?: string;
}

export interface CreateExpensePayload {
  categoryId: string;
  title: string;
  description?: string;
  estimatedAmount: number;
  dueDate?: string;
  ceremony?: CeremonyTag;
  vendorName?: string;
  vendorPhone?: string;
  advancePayment?: CreatePaymentPayload;
}

export type UpdateExpensePayload = Partial<Omit<CreateExpensePayload, 'advancePayment'>>;

export type { PaymentRecord };
