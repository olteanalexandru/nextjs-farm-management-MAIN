"use client"
import { useGlobalContextCrop } from '../Context/culturaStore';
import styles from './Rotatie.module.css';
import { Button } from 'react-bootstrap'; 

import React, { useEffect } from 'react';

function RotatieItem({ crops, userID }: { crops: any[], userID: string }) {
  const { deleteCrop , message , getAllCrops} = useGlobalContextCrop();

  useEffect(() => {
    console.log(crops);
    
  }
  , [message ]);


 

  return (
    <div className={styles.cropList}>
      {crops.map((crop: any) => (
        <div key={crop._id} className={styles.crop}>
          <h2 className={styles.cropName}>{crop.cropName}</h2>
          <div className={styles.cropDetails}>
            <h3>{crop.cropType}</h3>
            <h3>{crop.cropVariety}</h3>
          </div>
          <div className={styles.cropDates}>
            <div>Planting date: {crop.plantingDate}</div>
            <div>Harvesting date: {crop.harvestingDate}</div>
          </div>
          <p>{crop.description}</p>
          {crop.imageUrl && (
            <img
              src={'data:image/jpeg;' + crop.imageUrl.substring(2, crop.imageUrl.length - 2)}
              alt={crop.cropName}
              className={styles.cropImage}
            />
          )}
          <div className={styles.additionalInfo}>
            <div>Soil type: {crop.soilType}</div>
            <div>Climate: {crop.climate}</div>
            <div>It should not be repeated for {crop.ItShouldNotBeRepeatedForXYears} years</div>
          </div>
          <div className={styles.listContainer}>
            <p>Fertilizers:</p>
            <ul>
              {crop.fertilizers.map((fertilizer: any, index: number) => (
                <li key={index}>{fertilizer}</li>
              ))}
            </ul>
            <p>Pests:</p>
            <ul>
              {crop.pests.map((pest: any, index: number) => (
                <li key={index}>{pest}</li>
              ))}
            </ul>
            <p>Diseases:</p>
            <ul>
              {crop.diseases.map((disease: any, index: number) => (
                <li key={index}>{disease}</li>
              ))}
            </ul>
          </div>
          <div className={styles.creationDate}>
            <p>Adaugat la:</p>
            <div>{new Date(crop.createdAt).toLocaleString('en-US')}</div>
          </div>
          <Button variant="danger" onClick={() => 
            deleteCrop(crop._id)
          }>
            Delete Crop
          </Button>
        </div>
      ))}
    </div>
  );
}

export default RotatieItem;
