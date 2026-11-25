import type { MockDatabaseSnapshot } from '../../types/api.ts';
import type { Category, Expense, WeddingProfile } from '../../types/wedding.ts';

export const STORAGE_KEY = 'bandhan_wedding_db_v1';

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface MockDb {
  read: () => MockDatabaseSnapshot;
  write: (snapshot: MockDatabaseSnapshot) => MockDatabaseSnapshot;
  reset: () => MockDatabaseSnapshot;
  seedDemo: () => MockDatabaseSnapshot;
}

export function createEmptySnapshot(): MockDatabaseSnapshot {
  const now = new Date().toISOString();
  const futureYear = new Date().getFullYear() + 1;
  const profile: WeddingProfile = {
    id: 'wedding-1',
    brideName: '',
    groomName: '',
    weddingDate: `${futureYear}-02-14`,
    totalBudget: 2500000,
    contingencyPercent: 10,
    currency: 'INR',
    isOnboarded: false,
    createdAt: now,
    updatedAt: now,
  };
  return {
    profile,
    categories: [],
    expenses: [],
  };
}

function addDaysIso(base: Date, days: number): string {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createSampleIndianWeddingSnapshot(now: Date = new Date()): MockDatabaseSnapshot {
  const nowIso = now.toISOString();
  const weddingDate = addDaysIso(now, 142);

  const profile: WeddingProfile = {
    id: 'wedding-1',
    brideName: 'Aanya',
    groomName: 'Rohan',
    weddingDate,
    totalBudget: 2500000,
    contingencyPercent: 10,
    currency: 'INR',
    isOnboarded: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const categories: Category[] = [
    {
      id: 'cat-venue',
      weddingId: 'wedding-1',
      name: 'Venue & Hospitality',
      description: 'Lawn, banquet hall, and guest accommodation',
      icon: 'building-2',
      allocatedBudget: 750000,
      sortOrder: 0,
      createdAt: nowIso,
    },
    {
      id: 'cat-catering',
      weddingId: 'wedding-1',
      name: 'Catering & Mithai',
      description: 'Main wedding buffet, chaat counters, and dining setup',
      icon: 'utensils',
      allocatedBudget: 600000,
      sortOrder: 1,
      createdAt: nowIso,
    },
    {
      id: 'cat-decor',
      weddingId: 'wedding-1',
      name: 'Decor & Lighting',
      description: 'Floral mandap, haldi marigold backdrop, and sangeet truss',
      icon: 'sparkles',
      allocatedBudget: 350000,
      sortOrder: 2,
      createdAt: nowIso,
    },
    {
      id: 'cat-photo',
      weddingId: 'wedding-1',
      name: 'Photography & Film',
      description: 'Candid crew, traditional coverage, and wedding film',
      icon: 'camera',
      allocatedBudget: 220000,
      sortOrder: 3,
      createdAt: nowIso,
    },
    {
      id: 'cat-attire',
      weddingId: 'wedding-1',
      name: 'Bridal & Groom Attire',
      description: 'Lehenga, sherwani, and sangeet outfits',
      icon: 'shirt',
      allocatedBudget: 280000,
      sortOrder: 4,
      createdAt: nowIso,
    },
    {
      id: 'cat-music',
      weddingId: 'wedding-1',
      name: 'Entertainment & DJ',
      description: 'Sangeet DJ, live shehnai, and dhol',
      icon: 'music',
      allocatedBudget: 120000,
      sortOrder: 5,
      createdAt: nowIso,
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'exp-venue-1',
      weddingId: 'wedding-1',
      categoryId: 'cat-venue',
      title: 'Heritage Bagh Lawn & Banquet',
      description: '2-day exclusive lawn buyout with mandap courtyard and 24 rooms',
      estimatedAmount: 650000,
      dueDate: addDaysIso(now, 18),
      ceremony: 'wedding',
      vendorName: 'Rana Heritage Estates',
      vendorPhone: '+91 98201 44120',
      payments: [
        {
          id: 'pay-v1-1',
          expenseId: 'exp-venue-1',
          amount: 200000,
          paidDate: addDaysIso(now, -25),
          label: 'Booking Advance',
          method: 'bank_transfer',
          paidBy: 'joint',
          note: 'Initial venue block receipt #412',
        },
        {
          id: 'pay-v1-2',
          expenseId: 'exp-venue-1',
          amount: 150000,
          paidDate: addDaysIso(now, -7),
          label: '2nd Installment',
          method: 'bank_transfer',
          paidBy: 'groom',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'exp-cat-1',
      weddingId: 'wedding-1',
      categoryId: 'cat-catering',
      title: 'Main Banquet & Buffet',
      description: '350 plates royal vegetarian spread, live chaat, and gulab jamun counter',
      estimatedAmount: 420000,
      dueDate: addDaysIso(now, 10),
      ceremony: 'wedding',
      vendorName: 'Maharaja Kitchens',
      vendorPhone: '+91 98112 77310',
      payments: [
        {
          id: 'pay-c1-1',
          expenseId: 'exp-cat-1',
          amount: 120000,
          paidDate: addDaysIso(now, -14),
          label: 'Advance Deposit',
          method: 'upi',
          paidBy: 'bride',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'exp-cat-2',
      weddingId: 'wedding-1',
      categoryId: 'cat-catering',
      title: 'Dining Area Proper Lighting',
      description: 'Warm festoon Edison strings and brass table lamps across dining pavilion',
      estimatedAmount: 35000,
      dueDate: addDaysIso(now, -3),
      ceremony: 'reception',
      vendorName: 'Udaipur Lights Co.',
      vendorPhone: '+91 97654 22109',
      payments: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'exp-cat-3',
      weddingId: 'wedding-1',
      categoryId: 'cat-catering',
      title: 'Mehendi Hi-Tea & Mithai Boxes',
      description: 'Kesar pista mithai hampers and afternoon masala chai counter',
      estimatedAmount: 85000,
      dueDate: addDaysIso(now, 45),
      ceremony: 'mehendi',
      vendorName: 'Brijwasi Sweets',
      payments: [
        {
          id: 'pay-c3-1',
          expenseId: 'exp-cat-3',
          amount: 85000,
          paidDate: addDaysIso(now, -5),
          label: 'Full Settlement',
          method: 'upi',
          paidBy: 'bride',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'exp-dec-1',
      weddingId: 'wedding-1',
      categoryId: 'cat-decor',
      title: 'Floral Mandap & Phoolon Ki Chadar',
      description: 'Fresh mogra, rajnigandha, and pastel rose mandap draping',
      estimatedAmount: 210000,
      dueDate: addDaysIso(now, 24),
      ceremony: 'wedding',
      vendorName: 'Kesar Florals & Design',
      vendorPhone: '+91 98220 91823',
      payments: [
        {
          id: 'pay-d1-1',
          expenseId: 'exp-dec-1',
          amount: 60000,
          paidDate: addDaysIso(now, -12),
          label: 'Advance Deposit',
          method: 'cheque',
          paidBy: 'joint',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'exp-dec-2',
      weddingId: 'wedding-1',
      categoryId: 'cat-decor',
      title: 'Haldi Marigold Courtyard',
      description: 'Genda phool curtains, brass urli bowls, and yellow gadda seating',
      estimatedAmount: 75000,
      dueDate: addDaysIso(now, 60),
      ceremony: 'haldi',
      vendorName: 'Kesar Florals & Design',
      payments: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'exp-pho-1',
      weddingId: 'wedding-1',
      categoryId: 'cat-photo',
      title: 'Candid Crew & Cinema Film',
      description: '4-member team covering Haldi, Sangeet, Wedding, and Reception',
      estimatedAmount: 195000,
      dueDate: addDaysIso(now, 14),
      ceremony: 'general',
      vendorName: 'Frames by Kabir',
      vendorPhone: '+91 99102 33451',
      payments: [
        {
          id: 'pay-p1-1',
          expenseId: 'exp-pho-1',
          amount: 55000,
          paidDate: addDaysIso(now, -20),
          label: 'Retainer Advance',
          method: 'upi',
          paidBy: 'joint',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'exp-att-1',
      weddingId: 'wedding-1',
      categoryId: 'cat-attire',
      title: 'Bridal Crimson Lehenga & Veil',
      description: 'Hand-embroidered zardozi lehenga with custom double dupatta',
      estimatedAmount: 165000,
      ceremony: 'wedding',
      vendorName: 'Atelier Chandni Chowk',
      payments: [
        {
          id: 'pay-a1-1',
          expenseId: 'exp-att-1',
          amount: 165000,
          paidDate: addDaysIso(now, -9),
          label: 'Final Settlement',
          method: 'card',
          paidBy: 'bride',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'exp-att-2',
      weddingId: 'wedding-1',
      categoryId: 'cat-attire',
      title: 'Ivory Raw Silk Sherwani & Safa',
      description: 'Tailored wedding sherwani with stole and mojari',
      estimatedAmount: 95000,
      dueDate: addDaysIso(now, 32),
      ceremony: 'wedding',
      vendorName: 'Raghav Couture',
      payments: [
        {
          id: 'pay-a2-1',
          expenseId: 'exp-att-2',
          amount: 35000,
          paidDate: addDaysIso(now, -6),
          label: 'Measurement Advance',
          method: 'card',
          paidBy: 'groom',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'exp-mus-1',
      weddingId: 'wedding-1',
      categoryId: 'cat-music',
      title: 'Sangeet DJ, Sound & Live Shehnai',
      description: 'Sangeet sound console, LED floor wash, and morning wedding shehnai duo',
      estimatedAmount: 90000,
      dueDate: addDaysIso(now, -1),
      ceremony: 'sangeet',
      vendorName: 'Swar Rhythm Collective',
      vendorPhone: '+91 98330 61290',
      payments: [
        {
          id: 'pay-m1-1',
          expenseId: 'exp-mus-1',
          amount: 25000,
          paidDate: addDaysIso(now, -18),
          label: 'Advance Deposit',
          method: 'upi',
          paidBy: 'groom',
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  return {
    profile,
    categories,
    expenses,
  };
}

function getDefaultStorage(): StorageLike {
  const maybeGlobal = globalThis as { localStorage?: StorageLike };
  if (maybeGlobal.localStorage) {
    return maybeGlobal.localStorage;
  }
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  };
}

function isValidSnapshot(value: unknown): value is MockDatabaseSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<MockDatabaseSnapshot>;
  return (
    Boolean(candidate.profile) &&
    typeof candidate.profile === 'object' &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.expenses)
  );
}

export function createMockDb(storage: StorageLike = getDefaultStorage()): MockDb {
  const write = (snapshot: MockDatabaseSnapshot): MockDatabaseSnapshot => {
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return snapshot;
  };

  const read = (): MockDatabaseSnapshot => {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return write(createEmptySnapshot());
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isValidSnapshot(parsed)) {
        return parsed;
      }
      return write(createEmptySnapshot());
    } catch {
      return write(createEmptySnapshot());
    }
  };

  const reset = (): MockDatabaseSnapshot => {
    storage.removeItem(STORAGE_KEY);
    return write(createEmptySnapshot());
  };

  const seedDemo = (): MockDatabaseSnapshot => {
    return write(createSampleIndianWeddingSnapshot());
  };

  return { read, write, reset, seedDemo };
}

export const defaultMockDb = createMockDb();
