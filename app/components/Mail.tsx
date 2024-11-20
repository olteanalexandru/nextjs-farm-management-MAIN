"use client";

import { useState, FormEvent } from 'react';

export default function Mail() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            return;
        }

        try {
            setStatus('loading');
            
            // TODO: Replace with actual API endpoint
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                throw new Error('Failed to subscribe');
            }

            setStatus('success');
            setEmail('');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error('Subscription error:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                />
                {status === 'success' && (
                    <span className="absolute -bottom-6 left-0 text-sm text-green-600">
                        Successfully subscribed!
                    </span>
                )}
                {status === 'error' && (
                    <span className="absolute -bottom-6 left-0 text-sm text-red-600">
                        Failed to subscribe. Please try again.
                    </span>
                )}
            </div>
            <button
                type="submit"
                disabled={status === 'loading'}
                className={`px-6 py-2 text-white font-medium rounded-lg transition-colors ${
                    status === 'loading'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                }`}
            >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
        </form>
    );
}
