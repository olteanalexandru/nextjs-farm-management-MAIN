"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import Noutati from './News/News';

interface FeatureShowcaseItem {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  image: string;
  imageAlt: string;
  icon: string;
}

const features: FeatureShowcaseItem[] = [
  {
    title: 'Dashboard & Analytics',
    description:
      "Get a live, at-a-glance view of your farm: active rotations, recent posts, and your subscription status, all from one screen.",
    href: '/dashboard',
    linkLabel: 'Open Dashboard',
    image: '/screenshots/dashboard.png',
    imageAlt: 'Farm management dashboard showing an overview of rotations and account status',
    icon: '📊',
  },
  {
    title: 'Crop Rotation Planning',
    description:
      'Design multi-year rotation plans by field, track nitrogen balance across seasons, and get an AI rotation health advisor that flags risks before you plant.',
    href: '/Rotatie',
    linkLabel: 'Plan a Rotation',
    image: '/screenshots/rotation-planning.png',
    imageAlt: 'Crop rotation planning screen with nitrogen balance chart and division breakdown',
    icon: '🌱',
  },
  {
    title: 'Soil Management & Fertilization AI',
    description:
      'Log soil tests, build fertilization plans, and generate AI-backed fertilizer recommendations tailored to your crop, field, and soil chemistry.',
    href: '/SoilManagement',
    linkLabel: 'Manage Soil',
    image: '/screenshots/soil-management.png',
    imageAlt: 'Soil management screen with fertilization recommendations and AI agronomist notes',
    icon: '🧪',
  },
  {
    title: 'Harvest & Yield Tracking',
    description:
      'Record harvests as they happen and track yield trends per crop and per field over time, so you always know what is performing.',
    href: '/Harvest',
    linkLabel: 'Track Harvests',
    image: '/screenshots/harvest-tracking.png',
    imageAlt: 'Harvest and yield tracking screen with recorded harvest entries',
    icon: '🌾',
  },
  {
    title: 'Finance Tracking',
    description:
      'Track income and expenses by category, see profit and loss at a glance, and keep a clear financial picture of every season.',
    href: '/Finance',
    linkLabel: 'View Finances',
    image: '/screenshots/finance-tracking.png',
    imageAlt: 'Financial tracking screen with income, expenses, and profit and loss summary',
    icon: '💰',
  },
  {
    title: 'AI Crop Encyclopedia',
    description:
      "Look up any crop's ideal soil, climate, and fertilizer needs. If it's not already in our database, AI generates the profile for you on demand.",
    href: '/CropWiki',
    linkLabel: 'Browse Crops',
    image: '/screenshots/crop-wiki.png',
    imageAlt: 'Crop encyclopedia screen listing crops with their growing requirements',
    icon: '🔍',
  },
  {
    title: 'Pest & Disease Diagnosis',
    description:
      "Describe what you're seeing in the field and get AI-assisted suggestions on the likely pest or disease, plus what to do about it.",
    href: '/PestDiagnosis',
    linkLabel: 'Diagnose an Issue',
    image: '/screenshots/pest-diagnosis.png',
    imageAlt: 'Pest and disease diagnosis screen with AI-generated suggestions',
    icon: '🐛',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-[60vh] flex items-center bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col items-center justify-center text-center mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Transform Your Agricultural Practice
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl">
              Crop rotation, soil and harvest tracking, financial reporting, and AI assistants for every stage of the season
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Access Dashboard
              </Link>
              <Link
                href="/Premium"
                className="inline-flex items-center gap-1.5 px-6 py-3 border border-amber-400 text-base font-medium rounded-md text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <Sparkles className="w-4 h-4" /> See Premium Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section, alternating image/text rows with real screenshots */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything Your Farm Needs, In One Platform</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From planning your rotations to tracking your profits, see exactly what you get
            </p>
          </div>

          <div className="space-y-20">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`flex flex-col ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } items-center gap-10`}
              >
                <div className="w-full lg:w-1/2">
                  <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100">
                    <Image
                      src={feature.image}
                      alt={feature.imageAlt}
                      width={1280}
                      height={800}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <div className="w-full lg:w-1/2">
                  <div className="text-green-600 text-3xl mb-3">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  <Link
                    href={feature.href}
                    className="inline-flex items-center px-5 py-2.5 border border-green-600 text-base font-medium rounded-md text-green-600 hover:bg-green-50 transition-colors"
                  >
                    {feature.linkLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="py-16 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" /> Premium
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Unlock the Full Power of AI</h2>
              <p className="text-gray-600 mb-6">
                Free accounts get a taste of our AI assistants for rotation health, fertilization, crop lookups, and
                pest diagnosis. Upgrade to Premium for a daily limit increase, faster results, and priority access
                across every AI feature on the platform.
              </p>
              <Link
                href="/Premium"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-500 hover:bg-amber-600 transition-colors"
              >
                See Plans & Pricing
              </Link>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100">
                <Image
                  src="/screenshots/premium.png"
                  alt="Premium subscription plans comparing free and premium tiers"
                  width={1280}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
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
          <p className="mb-8 max-w-2xl mx-auto">Join the farmers who are already using our platform to improve their agricultural practices</p>
          <Link href="/api/auth/login" className="inline-flex items-center px-8 py-3 border-2 border-white text-lg font-medium rounded-md text-white hover:bg-white hover:text-green-600 transition-colors">
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
}
