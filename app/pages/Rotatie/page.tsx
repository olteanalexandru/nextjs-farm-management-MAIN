'use client'
import { use, useEffect, useState } from 'react';
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

  useEffect(() => {

    console.log("isLoading state: ", isLoading)
    getAllCrops()
  }, [

  ])

  if (isLoading?.value) {
    return <Spinner />
  }

  type Crop = {
    _id: string
    title: string
    description: string
    category: string
    startDate: string
    endDate: string
    status: string
    progress: number
    priority: string
    user: string
    selectare: boolean
    token: string
  }

    return (
      <div className={`${styles.container} text-center bg-grey border-colorat`}>
        <h2 className={styles.title}>Culturi adaugate :</h2>
        { 
          // promise is resolved
          areThereCrops.value === true && isLoading.value === false
          ? (
            <div className={styles.gridContainer}>
              <GridGenerator cols={3}>
                {crops.value.map((crop: Crop) => {
                  return (
                    <div className={styles.gridItem} key={crop._id}>
                      <Continut crop={crop} />
                    </div>
                  );
                })}
              </GridGenerator>
            </div>
          ) : (areThereCrops.value === false && isLoading.value === false) ? (
            <div className={styles.noCrops}>
              <h3>Nu exista culturi adaugate</h3>
            </div>
          ) : (
            <Spinner />

          )
        }
        
      </div>
    );
  }
