"use client"
import React, { useEffect } from 'react';
import { Card, Container } from 'react-bootstrap';
import { FaUser } from 'react-icons/fa';
import Link from 'next/link';
import CropForm from '../../../Crud/CropForm';
import RotatieItem from '../../../Crud/RotatieItem';
import Spinner from '../../../Crud/Spinner';
import UserListItem from './UserListItem';
import LinkAdaugaPostare from '../Elements/LinkAdaugaPostare';
import { useGlobalContext } from '../../../Context/UserStore';
import { useGlobalContextCrop } from '../../../Context/culturaStore';
import { UserInfos } from './userInfos';
import AdminCropForm from './AdminCropForm';
import { useSignals  } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Dashboard() {
  const {
    crops,
    isLoading,
    getCrops,
    addTheCropRecommendation,
  } = useGlobalContextCrop();
  const {
    fetchFermierUsers,
    deleteUser,
    data,
    fermierUsers,
  } = useGlobalContext();
  const { user, error, isLoading: isUserLoading } = useUser();

  useSignals();

  let apiCalls = ( ) => {
 

    getCrops();
    if (data?.role?.toLowerCase() === 'admin') {
      fetchFermierUsers();
    } 
 
  }

  useEffect(() => {
    if (!isUserLoading) {
      apiCalls();
    }
  }, [isUserLoading]);


  if (isLoading?.value) {
    return <Spinner />;
  }

  const handleAddCropRecommendation = async (cropData) => {
    await addTheCropRecommendation(cropData);
  };

  if (isUserLoading) return <div>Loading user...</div>;
  return (
    
    <>
   
      <UserInfos />
      {data && data?.role?.toLowerCase() === 'admin' ? (
        <Container>
          <Card>
            <section className="heading">
              <LinkAdaugaPostare />
              <br />
              <br />
              <Link href="/pages/Login/Register">
                <FaUser /> Adauga utilizatori
              </Link>
              <br />
              <br />
              <Container>
                <AdminCropForm onSubmit={handleAddCropRecommendation} />
              </Container>
              <p>Gestioneaza utilizatorii</p>
              <h2>Fermieri:</h2>
              <ul>
                {fermierUsers &&
                  fermierUsers.map((user) => (
                    <UserListItem
                      key={user._id}
                      user={user}
                      deleteUser={deleteUser}
                    />
                  ))}
              </ul>
            </section>
          </Card>
        </Container>
      ) : data && data?.role?.toLowerCase() === 'farmer' ? (
        <Container>
          <Card>
            <section className="heading">
              <p>Adauga culturi:</p>
            </section>
            <CropForm />
            <section className="content">
              {crops?.value?.length > 0 ? (
                <div className="crops">
                  <RotatieItem crops={crops} userID={data._id} />
                </div>
              ) : (
                <h3>Nu ai adaugat culturi</h3>
              )}
            </section>
          </Card>
        </Container>
      ) : (
        <h1>Acces interzis</h1>
      )}
    </>
  );
}


