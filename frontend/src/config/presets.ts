import type { CeremonyTag, ContributorSide, PaymentMethod } from '../types/wedding.ts';

export interface StarterCategoryPreset {
  name: string;
  icon: string;
  description: string;
  defaultSelected: boolean;
}

export const STARTER_CATEGORIES: StarterCategoryPreset[] = [
  {
    name: 'Venue & Hospitality',
    icon: 'building-2',
    description: 'Wedding mandap, banquet halls, and guest rooms',
    defaultSelected: true,
  },
  {
    name: 'Catering & Mithai',
    icon: 'utensils',
    description: 'Main feast, chaat counters, mithai boxes, and dining setup',
    defaultSelected: true,
  },
  {
    name: 'Decor & Lighting',
    icon: 'sparkles',
    description: 'Floral mandap, phoolon ki chadar, and ambient lighting',
    defaultSelected: true,
  },
  {
    name: 'Photography & Film',
    icon: 'camera',
    description: 'Candid photography, pre-wedding shoot, and cinema film',
    defaultSelected: true,
  },
  {
    name: 'Bridal & Groom Attire',
    icon: 'shirt',
    description: 'Lehenga, sherwani, tailoring, and ceremonial outfits',
    defaultSelected: true,
  },
  {
    name: 'Jewellery & Trousseau',
    icon: 'gem',
    description: 'Bridal sets, mangalsutra, rings, and family gifting',
    defaultSelected: false,
  },
  {
    name: 'Makeup & Mehendi',
    icon: 'palette',
    description: 'Bridal MUA, family hair & drape artists, mehendi team',
    defaultSelected: false,
  },
  {
    name: 'Invitations & Gifts',
    icon: 'mail',
    description: 'Printed cards, digital invites, and dry-fruit hampers',
    defaultSelected: false,
  },
  {
    name: 'Entertainment & DJ',
    icon: 'music',
    description: 'Sangeet sound, dhol, live shehnai, and choreographer',
    defaultSelected: false,
  },
];

export const CATEGORY_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: 'building-2', label: 'Venue' },
  { key: 'utensils', label: 'Catering' },
  { key: 'sparkles', label: 'Decor' },
  { key: 'camera', label: 'Photo' },
  { key: 'shirt', label: 'Attire' },
  { key: 'gem', label: 'Jewellery' },
  { key: 'palette', label: 'Makeup' },
  { key: 'mail', label: 'Invites' },
  { key: 'music', label: 'Music' },
  { key: 'flower-2', label: 'Florals' },
  { key: 'car', label: 'Travel' },
  { key: 'gift', label: 'Gifting' },
  { key: 'lamp', label: 'Lighting' },
  { key: 'heart', label: 'Rituals' },
  { key: 'tent', label: 'Mandap' },
  { key: 'wallet', label: 'Misc' },
];

export const CEREMONY_OPTIONS: { value: CeremonyTag; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'haldi', label: 'Haldi' },
  { value: 'mehendi', label: 'Mehendi' },
  { value: 'sangeet', label: 'Sangeet' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'reception', label: 'Reception' },
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
];

export const CONTRIBUTOR_SIDE_OPTIONS: { value: ContributorSide; label: string }[] = [
  { value: 'joint', label: 'Joint' },
  { value: 'bride', label: "Bride's Side" },
  { value: 'groom', label: "Groom's Side" },
];
