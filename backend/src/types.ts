export type CeremonyTag =
  | 'general'
  | 'engagement'
  | 'haldi'
  | 'mehendi'
  | 'sangeet'
  | 'wedding'
  | 'reception';

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'card' | 'cheque';
export type ExpenseStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export interface UserDoc {
  _id: string;
  username: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingDoc {
  _id: string;
  userId: string;
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

export interface CategoryDoc {
  _id: string;
  userId: string;
  weddingId: string;
  name: string;
  description?: string | null;
  icon: string;
  allocatedBudget?: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface PaymentRecordDoc {
  id: string;
  expenseId: string;
  amount: number;
  paidDate: string;
  label: string;
  method: PaymentMethod;
  note?: string | null;
}

export interface ExpenseDoc {
  _id: string;
  userId: string;
  weddingId: string;
  categoryId: string;
  title: string;
  description?: string | null;
  estimatedAmount: number;
  dueDate?: string | null;
  ceremony?: CeremonyTag | null;
  vendorName?: string | null;
  vendorPhone?: string | null;
  payments: PaymentRecordDoc[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  username: string;
}

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
  description?: string | null;
  icon: string;
  allocatedBudget?: number | null;
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
  note?: string | null;
}

export interface Expense {
  id: string;
  weddingId: string;
  categoryId: string;
  title: string;
  description?: string | null;
  estimatedAmount: number;
  dueDate?: string | null;
  ceremony?: CeremonyTag | null;
  vendorName?: string | null;
  vendorPhone?: string | null;
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface WeddingBackupDoc {
  _id: string;
  userId: string;
  backedUpAt: string;
  wedding: WeddingDoc | null;
  categories: CategoryDoc[];
  expenses: ExpenseDoc[];
}

export interface AppVariables {
  currentUser: UserPublic;
}
