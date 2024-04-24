"use client"
import { useEffect , useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Container } from 'react-bootstrap';
import {FaUser} from 'react-icons/fa'
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

export default function Dashboard() {
  const navigate = useRouter();
  
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



  useEffect(() => {
    if (!data) {
      navigate.push('/login');
    } else if (data.role.toLowerCase() === 'admin' ) {
      fetchFermierUsers();
    } else if (data.role.toLowerCase() === 'farmer') {
      getCrops();
    }
  }, [data  ]);

  if (isLoading) {
    return <Spinner />;
  }

  const handleAddCropRecommendation = async (cropData : any) => {
    await addTheCropRecommendation(cropData);
  };
  return (
    <>
      <UserInfos />
      {data && data.role.toLowerCase() == 'admin' ? (
        <Container>
          <Card>
            <section className="heading">
             
              <LinkAdaugaPostare />
              <br />
              <br />
             
              <Link href='/pages/Login/Register'>
              <FaUser /> Adauga utilizatori
              </Link>
              <br />
              <br />
          
              
              <div>
           
       
                {data && data.role.toLowerCase() === 'admin' && (
                  
<>


<Container>
                <AdminCropForm onSubmit={handleAddCropRecommendation} />
              </Container>
              <p>Gestioneaza utilizatorii</p>
                <h2>Fermieri:</h2>

  <ul>
    {fermierUsers &&
      fermierUsers.map((user) => (
        <UserListItem key={user._id} user={user} deleteUser={deleteUser} />
      ))}
  </ul>
  </>
)}
              </div>
            </section>
          </Card>
        </Container>
      ) : (
        data && data.role.toLowerCase() == 'farmer' ? (
          <Container>
            <Card>
              <section className="heading">
                <p>Adauga culturi:</p>
              </section>
              <CropForm />
  
              <section className="content">
                {crops.length > 0 ? (
                  <div className="crops">
                   
                      <RotatieItem crops={crops} userID={
                        data._id
                      }  />
                  
                  </div>
                ) : (
                  <h3>Nu ai adaugat culturi</h3>
                )}
              </section>
            </Card>
          </Container>
        ) : (
          <h1>Acces interzis</h1>
        )
      )}
    </>
  );
}
