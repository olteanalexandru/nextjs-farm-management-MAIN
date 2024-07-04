"use client";
import { useGlobalContextCrop } from '../Context/culturaStore';
import styles from './Rotatie.module.css';
import { Button } from 'react-bootstrap'; 
import React, { useEffect, useState } from 'react';

function RotatieItem({ crops, userID }) {
  const { deleteCrop, message } = useGlobalContextCrop();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 8;

  // Filter crops based on search term
  const filteredCrops = crops.value.filter(crop => {
    const regex = new RegExp(searchTerm, 'i');
    return regex.test(crop.cropName) || regex.test(crop.cropType) || regex.test(crop.cropVariety);
  });

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCrops.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <input
        type="text"
        placeholder="Search crops..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      <div className={styles.cropList}>
        {currentItems.map((crop) => (
          <CropItem key={crop._id} crop={crop} deleteCrop={deleteCrop} />
        ))}
      </div>
      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={filteredCrops.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
}

function Pagination({ itemsPerPage, totalItems, paginate, currentPage }) {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className='pagination'>
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <a onClick={() => paginate(number)} className='page-link'>
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CropItem({ crop, deleteCrop }) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className={styles.crop}>
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
      {showMore && (
        <div className={styles.additionalInfo}>
          <div>Soil type: {crop.soilType}</div>
          <div>Climate: {crop.climate}</div>
          <div>It should not be repeated for {crop.ItShouldNotBeRepeatedForXYears} years</div>
          <div className={styles.listContainer}>
            <p>Fertilizers:</p>
            <ul>
              {crop.fertilizers.map((fertilizer, index) => (
                <li key={index}>{fertilizer}</li>
              ))}
            </ul>
            <p>Pests:</p>
            <ul>
              {crop.pests.map((pest, index) => (
                <li key={index}>{pest}</li>
              ))}
            </ul>
            <p>Diseases:</p>
            <ul>
              {crop.diseases.map((disease, index) => (
                <li key={index}>{disease}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <button onClick={() => setShowMore(!showMore)} className={`${styles.seeMoreButton} btn btn-block mt-2 mb-2`}>
        {showMore ? 'See Less..' : 'See More..'}
      </button>
      <div className={styles.creationDate}>
        <p>Adaugat la:</p>
        <div>{new Date(crop.createdAt).toLocaleString('en-US')}</div>
      </div>
      <Button variant="danger" size="sm" onClick={() => deleteCrop(crop._id)}>
        Delete Crop
      </Button>
    </div>
  );
}

export default RotatieItem;


