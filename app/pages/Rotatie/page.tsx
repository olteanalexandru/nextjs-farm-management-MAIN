'use client'
import {  useEffect, useState } from 'react';
import Spinner from '../../Crud/Spinner';
import Continut from '../../Crud/GetAllInRotatie/page';
import GridGenerator from '../../Componente/GridGen';
import styles from './Rotatie.module.css'; 
import { useGlobalContextCrop } from '../../Context/culturaStore';

export default function Rotatie() {
  const { 
    crops,
    isLoading,
    getAllCrops,
    areThereCrops,
  } = useGlobalContextCrop();


  const fetchData = async () => {
    try {
       await getAllCrops()
    } catch (error) {
      console.error(error);
    }
  };
  fetchData();
console.log("is loading states on page" + isLoading.value)

  if (isLoading.value) {
    return (
      <div>
        <Spinner />
        <p>Loading crops ...</p>
      </div>
    );
  }



  return (
    <div className={`${styles.container} text-center bg-grey border-colorat`}>
      <h2 className={styles.title}>Culturi adaugate :</h2>
      { 
        areThereCrops.value === true
        ? <CropsList crops={crops.value} />
        : <NoCrops />
      }
    </div>
  );
}

function CropsList({ crops }) {
  return (
    <div className={styles.gridContainer}>
      <GridGenerator cols={3}>
        {crops.map((crop) => (
          <div className={styles.gridItem} key={crop._id}>
            <Continut crop={crop} />
          </div>
        ))}
      </GridGenerator>
    </div>
  );
}

function NoCrops() {
  return (
    <div className={styles.noCrops}>
      <h3>There are no crops yet</h3>
      <p>Why not add some?</p>
   
    </div>
  );
}
