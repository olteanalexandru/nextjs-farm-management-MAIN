"use client";

import { useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import CropForm from '../Crud/CropForm';
import RotatieItem from '../Crud/RotatieItem';
import Spinner from '../Crud/Spinner'; 
import { useUserContext } from '../providers/UserStore';
import { useGlobalContextCrop } from '../providers/culturaStore';
import { useUser } from '@auth0/nextjs-auth0/client';

interface FermierUser {
  _id: string;
  [key: string]: any;
}

const UserListItem = ({ user, deleteUser }: { user: any; deleteUser: any }) => {
  return (
    <li key={user._id}>
      {user.name} - {user.email}{' '}
      <button onClick={() => deleteUser(user._id)} className="btn btn-danger btn-sm">
        Delete
      </button>
    </li>
  );
};

export default function Dashboard() {
  const {
    crops,
    isLoading: isCropLoading,
    getCrops,
    addTheCropRecommendation,
  } = useGlobalContextCrop();

  const {
    fetchFermierUsers,
    deleteUser,
    data,
    fermierUsers,
    isUserLoggedIn
  } = useUserContext();

  const { isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && isUserLoggedIn && data?.roleType) {
      const apiCalls = async () => {
        await getCrops();
        if (data.roleType.toLowerCase() === 'admin') {
          await fetchFermierUsers();
        }
      };
      apiCalls();
    }
  }, [isUserLoading, isUserLoggedIn, data?.roleType]);

  if (isUserLoading || !data) {
    return <Spinner />;
  }

  if (!isUserLoggedIn) {
    return <div>Please log in to access the dashboard</div>;
  }

  const handleAddCropRecommendation = async (cropData: any) => {
    await addTheCropRecommendation(cropData);
  };

  const renderAdminContent = () => (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <section className="heading">
            <a href="/create-post" className="btn btn-primary">
              Add Post
            </a>
            <br />
            <br />
            <a href="/register" className="btn btn-secondary">
              <FaUser /> Add users
            </a>
            <br />
            <br />
            <div className="container">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddCropRecommendation(Object.fromEntries(formData));
              }}>
                {/* Add your crop recommendation form fields here */}
                <button type="submit" className="btn btn-success">
                  Add Recommendation
                </button>
              </form>
            </div>
            <p>Manage Users</p>
            <h2>Farmers:</h2>
            <ul className="list-unstyled">
              {fermierUsers?.map((user: FermierUser) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  deleteUser={deleteUser}
                />
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );

  const renderFarmerContent = () => (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <section className="heading">
            <p>Add crops:</p>
          </section>
          <CropForm />
          <section className="content">
            {Array.isArray(crops) && crops.length > 0 ? (
              <div className="crops">
                <RotatieItem crops={crops}  />
              </div>
            ) : (
              <h3>No crops were added</h3>
            )}
          </section>
        </div>
      </div>
    </div>
  );

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
      {data?.roleType?.toLowerCase() === 'admin' 
        ? renderAdminContent()
        : data?.roleType?.toLowerCase() === 'farmer'
        ? renderFarmerContent()
        : <h1>Access Denied</h1>
      }
    </div>
  );
}
