'use client'
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Camera, Home, Repeat, Users, Settings, LogOut, LogIn, Database, Leaf } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import React from 'react';
import { LanguageSwitch } from './LanguageSwitch';

interface UserProfile {
  name: string;
  email: string;
  picture: string;
  userRoles?: string[];
}

const ModernLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'News', href: '/News', icon: Home },
    { name: 'Crop Rotation', href: '/Rotatie', icon: Repeat, farmerOnly: true },
    { name: 'Crop Database', href: '/CropWiki', icon: Database },
    { name: 'Soil Management', href: '/SoilManagement', icon: Leaf, farmerOnly: true },
    { name: 'Dashboard', href: '/dashboard', icon: Camera },
    { name: 'Users', href: '/Login/Register', icon: Users, adminOnly: true },
  ];

  const isActivePath = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="ml-4 flex lg:ml-8">
                <Link href="/" className="flex items-center space-x-3">
                  <img src="/Logo.png" alt="Logo" className="h-8 w-8" />
                  <span className="text-lg font-semibold text-gray-900">Agricultural Platform </span>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
            <LanguageSwitch />
              {!isLoading && user ? (
                <div className="hidden md:flex items-center space-x-4">
             
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                  <img 
                    src={user.picture || '/default-profile.png'} 
                    alt="Profile" 
                    className="h-10 w-10 rounded-full border-2 border-gray-200 object-cover"
                  />
                </div>
              ) : (
                <Link
                  href="/api/auth/login"
                  className="flex items-center px-3 py-2 mt-auto text-sm font-medium text-green-700 rounded-lg hover:bg-green-50"
                >
                  <span className="w-5 h-5 mr-3 text-green-400">
                    <LogIn />
                  </span>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-16 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-white border-r border-gray-200`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              if (item.adminOnly && (!user || !(user as unknown as UserProfile).userRoles?.includes('admin'))) {
                return null;
              }
              if (item.farmerOnly && (!user || !(user as unknown as UserProfile).userRoles?.includes('FARMER'))) {
                return null;
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActivePath(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {React.cloneElement(<item.icon />, {
                    className: `w-5 h-5 mr-3 ${
                      isActivePath(item.href) ? 'text-blue-700' : 'text-gray-400'
                    }`
                  })}
                  {item.name}
                </Link>
              );
            })}

            {user ? (
              <Link
                href="/api/auth/logout"
                className="flex items-center px-3 py-2 mt-auto text-sm font-medium text-red-700 rounded-lg hover:bg-red-50"
              >
                <div className="w-5 h-5 mr-3 text-red-400">
                  <LogOut />
                </div>
                Logout
              </Link>
            ) : (
              <Link
                href="/api/auth/login"
                className="flex items-center px-3 py-2 mt-auto text-sm font-medium text-green-700 rounded-lg hover:bg-green-50"
              >
                {React.cloneElement(<LogIn />, { className: "w-5 h-5 mr-3 text-green-400" })}
                Login
              </Link>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : ''}`}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModernLayout;
