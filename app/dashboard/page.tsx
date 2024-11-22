"use client";

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useUserContext } from '../providers/UserStore';
import { useGlobalContextCrop } from '../providers/culturaStore';
import Spinner from '../Crud/Spinner';
import AdminDashboard from '../components/AdminDashboard';
import FarmerDashboard from '../components/FarmerDashboard';

export default function Dashboard() {
  const { user, isLoading: isUserLoading } = useUser();
  const { data, isUserLoggedIn } = useUserContext();
  const { getCrops } = useGlobalContextCrop();

  useEffect(() => {
    if (user && isUserLoggedIn && data?.roleType) {
      getCrops();
    }
  }, [user, isUserLoggedIn, data?.roleType]);

  if (isUserLoading || !data) {
    return <Spinner />;
  }

  if (!isUserLoggedIn) {
    return <div>Please log in to access the dashboard</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="user-info">
        {data && (
          <div>
            <p>Welcome, {data.name}</p>
            <p>Role: {data.roleType}</p>
          </div>
        )}
      </div>
      {data?.roleType?.toLowerCase() === 'admin' ? (
        <AdminDashboard />
      ) : data?.roleType?.toLowerCase() === 'farmer' ? (
        <FarmerDashboard />
      ) : (
        <h1>Access Denied</h1>
      )}
    </div>
  );
}
