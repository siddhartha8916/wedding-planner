export type CeremonyTag =
  | 'general'
  | 'engagement'
  | 'haldi'
  | 'mehendi'
  | 'sangeet'
  | 'wedding'
  | 'reception';

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'card' | 'cheque';
export type ContributorSide = 'joint' | 'bride' | 'groom';
export type ExpenseStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export interface WeddingProfile {
  id: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  totalBudget: number;
  contingencyPercent: number;
  currency: 'INR';
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  weddingId: string;
  name: string;
  description?: string;
  icon: string;
  allocatedBudget?: number;
  sortOrder: number;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  expenseId: string;
  amount: number;
  paidDate: string;
  label: string;
  method: PaymentMethod;
  paidBy: ContributorSide;
  note?: string;
}

export interface Expense {
  id: string;
  weddingId: string;
  categoryId: string;
  title: string;
  description?: string;
  estimatedAmount: number;
  dueDate?: string;
  ceremony?: CeremonyTag;
  vendorName?: string;
  vendorPhone?: string;
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}
