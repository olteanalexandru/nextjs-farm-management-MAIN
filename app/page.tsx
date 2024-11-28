"use client";

import { Hero } from './components/Hero';
import { useTranslations } from 'next-intl';
import Noutati from './News/News';
import Link from 'next/link';

export default function Home() {
  const t = useTranslations('HomePage');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-[60vh] flex items-center bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col items-center justify-center text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Smart Agricultural Management Platform
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl">
              Optimize your farm's productivity with intelligent crop rotation planning, personalized recommendations, and real-time agricultural insights
            </h2>
            <div className="flex gap-4">
              <Link 
                href="/Rotatie"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Start Planning
              </Link>
              <Link 
                href="/AboutUs"
                className="inline-flex items-center px-6 py-3 border border-green-600 text-base font-medium rounded-md text-green-600 hover:bg-green-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-green-600 text-3xl mb-4">🌱</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Crop Rotation
              </h4>
              <p className="text-gray-600">
                Optimize your soil health and crop yields with AI-powered rotation planning based on your specific field conditions
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-green-600 text-3xl mb-4">🌡️</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Weather Integration
              </h4>
              <p className="text-gray-600">
                Real-time weather data and forecasts to help you make informed decisions about planting and harvesting
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-green-600 text-3xl mb-4">📊</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Personalized Recommendations
              </h4>
              <p className="text-gray-600">
                Get tailored advice for soil preparation, plant nutrition, and pest control based on your farm's data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Latest Agricultural News</h2>
          <Noutati />
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Farm?</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Join thousands of farmers who are already using our platform to improve their agricultural practices
          </p>
          <Link 
            href="/Login"
            className="inline-flex items-center px-8 py-3 border-2 border-white text-lg font-medium rounded-md text-white hover:bg-white hover:text-green-600 transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
}
