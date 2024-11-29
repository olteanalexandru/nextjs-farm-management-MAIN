"use client";

import Link from 'next/link';

export function Hero() {
  return (
    <section className="min-h-screen flex items-center bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Transform Your Agricultural Practice
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-600 mb-8">
            Modern solutions for sustainable farming and improved yields
          </h2>
          <Link 
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Access Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-green-600 text-3xl mb-4">🌱</div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              <Link href="/Rotatie" className="hover:text-green-600 transition-colors">
                Crop Rotation
              </Link>
            </h4>
            <p className="text-gray-600">
              Optimize your soil health and maximize yields with smart rotation planning
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-green-600 text-3xl mb-4">🌡️</div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              <Link href="/Recomandari" className="hover:text-green-600 transition-colors">
                Weather Insights
              </Link>
            </h4>
            <p className="text-gray-600">
              Make informed decisions with real-time weather data and forecasts
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-green-600 text-3xl mb-4">📊</div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              <Link href="/dashboard" className="hover:text-green-600 transition-colors">
                Farm Analytics
              </Link>
            </h4>
            <p className="text-gray-600">
              Track and analyze your farm&apos;s performance with detailed insights
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-green-600 text-3xl mb-4">💡</div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              <Link href="/News" className="hover:text-green-600 transition-colors">
                Agricultural News
              </Link>
            </h4>
            <p className="text-gray-600">
              Stay updated with the latest agricultural news and best practices
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
