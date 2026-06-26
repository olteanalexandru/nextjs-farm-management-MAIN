import { Sparkles } from 'lucide-react';

export default function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ${className}`}>
      <Sparkles className="w-3 h-3" />
      Premium
    </span>
  );
}
