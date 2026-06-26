'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Sparkles } from 'lucide-react';
import { useUserContext } from '../providers/UserStore';
import LoadingSpinner from '../components/LoadingSpinner';
import UsageMeter from '../components/premium/UsageMeter';

const FEATURE_LABELS: Record<string, string> = {
  CROP_LOOKUP: 'AI Crop Lookup',
  FERTILIZATION_INSIGHT: 'AI Agronomist Notes',
  ROTATION_INSIGHT: 'AI Rotation Health Advisor',
  PEST_DIAGNOSIS: 'AI Pest & Disease Diagnosis'
};

function PremiumPageContent() {
  const {
    isUserLoggedIn,
    isLoading,
    billing,
    refreshBilling,
    startCheckout,
    openBillingPortal,
    login
  } = useUserContext();
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (checkoutResult === 'success' && isUserLoggedIn) {
      refreshBilling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutResult, isUserLoggedIn]);

  const handleUpgrade = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const url = await startCheckout();
      window.location.href = url;
    } catch (err) {
      setActionError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not start checkout. Please try again later.'
      );
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setActionError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not open billing portal. Please try again later.'
      );
      setActionLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const isPremium = billing?.tier === 'PREMIUM';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Upgrade to Premium</h1>
        <p className="text-gray-600">Get much higher daily limits on every AI assistant in the app.</p>
      </div>

      {checkoutResult === 'success' && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm">
          Thanks! Your subscription is being activated — this can take a few seconds to reflect here.
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="bg-gray-50 text-gray-600 p-4 rounded-md text-sm">
          Checkout was cancelled. You can upgrade anytime.
        </div>
      )}
      {actionError && <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">{actionError}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 space-y-4 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Free</h2>
          <p className="text-3xl font-bold text-gray-900">
            €0<span className="text-sm font-normal text-gray-500">/month</span>
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Crop rotation planning</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Soil test & harvest tracking</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Financial tracking</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Limited daily AI assistant usage</li>
          </ul>
          {!isPremium && isUserLoggedIn && <p className="text-sm text-gray-400">Your current plan</p>}
        </div>

        <div className="border-2 border-amber-400 rounded-xl p-6 space-y-4 bg-amber-50 relative">
          <span className="absolute -top-3 right-6 bg-amber-400 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Premium
          </span>
          <h2 className="text-xl font-semibold text-gray-900">Premium</h2>
          <p className="text-3xl font-bold text-gray-900">
            €9.99<span className="text-sm font-normal text-gray-500">/month</span>
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Everything in Free</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Much higher AI assistant daily limits</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> AI Crop Lookup, Agronomist Notes, Rotation Health Advisor &amp; Pest Diagnosis</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Priority access during peak usage</li>
          </ul>

          {!isUserLoggedIn ? (
            <button
              onClick={login}
              className="w-full bg-amber-500 text-white py-2 rounded-md hover:bg-amber-600 font-medium"
            >
              Log in to upgrade
            </button>
          ) : isPremium ? (
            <div className="space-y-2">
              <p className="text-sm text-amber-800 font-medium">You&apos;re on Premium.</p>
              {billing?.currentPeriodEnd && (
                <p className="text-xs text-amber-700">
                  Renews on {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {billing?.portalAvailable && (
                <button
                  onClick={handleManageBilling}
                  disabled={actionLoading}
                  className="w-full bg-white border border-amber-400 text-amber-800 py-2 rounded-md hover:bg-amber-100 font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Opening...' : 'Manage billing'}
                </button>
              )}
            </div>
          ) : billing?.checkoutAvailable ? (
            <button
              onClick={handleUpgrade}
              disabled={actionLoading}
              className="w-full bg-amber-500 text-white py-2 rounded-md hover:bg-amber-600 font-medium disabled:opacity-50"
            >
              {actionLoading ? 'Redirecting...' : 'Upgrade to Premium'}
            </button>
          ) : (
            <p className="text-sm text-amber-700">Online payments aren&apos;t configured yet. Check back soon.</p>
          )}
        </div>
      </div>

      {isUserLoggedIn && billing && billing.usage.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your AI usage today</h3>
          <div className="space-y-4">
            {billing.usage.map((u) => (
              <UsageMeter key={u.feature} label={FEATURE_LABELS[u.feature] || u.feature} used={u.used} limit={u.limit} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PremiumPageContent />
    </Suspense>
  );
}
