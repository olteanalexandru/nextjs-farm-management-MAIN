import React from 'react';
import Spinner from '../../Crud/Spinner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string;
  header?: string;
  userInfo?: {
    name: string;
    roleType: string;
  };
}

export default function DashboardLayout({
  children,
  isLoading,
  error,
  header = 'Dashboard',
  userInfo
}: DashboardLayoutProps) {
  if (isLoading) return <Spinner />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">{header}</h1>
              {userInfo && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Welcome, {userInfo.name}</p>
                  <p className="text-xs text-gray-500">Role: {userInfo.roleType}</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
