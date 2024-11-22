"use client";

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useUserContext } from '../providers/UserStore';
import { useGlobalContextCrop } from '../providers/culturaStore';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { StatsGrid, StatItem } from '../components/dashboard/DashboardStats';
import AdminDashboard from '../components/AdminDashboard';
import FarmerDashboard from '../components/FarmerDashboard';

let Spinner = () => null;

export default function Dashboard() {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: userData, isUserLoggedIn } = useUserContext();
  const { getCrops } = useGlobalContextCrop();

  useEffect(() => {
    if (user && isUserLoggedIn && userData?.roleType) {
      getCrops();
    }
  }, [user, isUserLoggedIn, userData?.roleType]);

  if (isUserLoading || !userData) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!isUserLoggedIn) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Please log in to access the dashboard
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = userData.roleType?.toLowerCase() === 'admin';
  const DashboardComponent = isAdmin ? AdminDashboard : FarmerDashboard;

  return (
    <DashboardLayout 
      title={`Welcome, ${userData.name}`}
      subtitle={`Logged in as ${userData.roleType}`}
    >
      <StatsGrid>
        <StatItem 
          label="Role"
          value={userData.roleType}
          icon={<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>}
        />
        {/* Add more stats as needed */}
      </StatsGrid>

      <div className="mt-8">
        <DashboardComponent />
      </div>
    </DashboardLayout>
  );
}
