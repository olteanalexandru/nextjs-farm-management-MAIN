"use client";

import Link from 'next/link';

export function Hero() {
  return (
    <section className="min-h-screen flex items-center bg-gray-50">
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Prototip Platforma agricola
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-600 mb-8">
            Platforma agricola care are de aface cu agricultura
          </h2>
          <Link 
            href="/about"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Vezi mai multe
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-green-600 text-3xl mb-4">
              <i className="ri-stack-line"></i>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              <Link href="#" className="hover:text-green-600 transition-colors">
                Lorem Ipsum
              </Link>
            </h4>
            <p className="text-gray-600">
              Voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-green-600 text-3xl mb-4">
              <i className="ri-palette-line"></i>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              <Link href="#" className="hover:text-green-600 transition-colors">
                Sed ut perspiciatis
              </Link>
            </h4>
            <p className="text-gray-600">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-green-600 text-3xl mb-4">
              <i className="ri-command-line"></i>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              <Link href="#" className="hover:text-green-600 transition-colors">
                Magni Dolores
              </Link>
            </h4>
            <p className="text-gray-600">
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="text-green-600 text-3xl mb-4">
              <i className="ri-fingerprint-line"></i>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              <Link href="#" className="hover:text-green-600 transition-colors">
                Nemo Enim
              </Link>
            </h4>
            <p className="text-gray-600">
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
