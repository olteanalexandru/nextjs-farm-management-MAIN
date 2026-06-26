'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface UpgradePromptProps {
  message?: string;
}

export default function UpgradePrompt({ message }: UpgradePromptProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
      <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-amber-800">
          {message || "You've reached the Free plan's daily limit for this AI feature."}
        </p>
        <Link
          href="/Premium"
          className="mt-2 inline-block text-sm font-medium text-amber-900 underline hover:text-amber-700"
        >
          Upgrade to Premium for higher limits →
        </Link>
      </div>
    </div>
  );
}
