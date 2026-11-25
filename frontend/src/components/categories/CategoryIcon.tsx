import {
  Building2,
  Camera,
  Car,
  Flower2,
  Gem,
  Gift,
  Heart,
  Lamp,
  Mail,
  Music,
  Palette,
  Shirt,
  Sparkles,
  Tent,
  Utensils,
  Wallet,
} from 'lucide-react';

export interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className = 'w-5 h-5' }: CategoryIconProps) {
  const props = { className, strokeWidth: 1.5 };
  switch (name) {
    case 'building-2':
      return <Building2 {...props} />;
    case 'utensils':
      return <Utensils {...props} />;
    case 'sparkles':
      return <Sparkles {...props} />;
    case 'camera':
      return <Camera {...props} />;
    case 'shirt':
      return <Shirt {...props} />;
    case 'gem':
      return <Gem {...props} />;
    case 'palette':
      return <Palette {...props} />;
    case 'mail':
      return <Mail {...props} />;
    case 'music':
      return <Music {...props} />;
    case 'flower-2':
      return <Flower2 {...props} />;
    case 'car':
      return <Car {...props} />;
    case 'gift':
      return <Gift {...props} />;
    case 'lamp':
      return <Lamp {...props} />;
    case 'heart':
      return <Heart {...props} />;
    case 'tent':
      return <Tent {...props} />;
    default:
      return <Wallet {...props} />;
  }
}
