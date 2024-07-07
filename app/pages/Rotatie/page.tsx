'use client'
import { useEffect, useState } from 'react';
import Spinner from '../../Crud/Spinner';
import Continut from '../../Crud/GetAllInRotatie/page';
import GridGenerator from '../../Componente/GridGen';
import styles from './Rotatie.module.css';
import { useGlobalContextCrop } from '../../Context/culturaStore';
import { useSignals } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Rotatie() {
  const { crops, isLoading, getAllCrops, areThereCrops } = useGlobalContextCrop();
  const { user, error, isLoading: isUserLoading } = useUser();

  useSignals();

  useEffect(() => {
    if (!isUserLoading) {
      getAllCrops();
    }
  }, [isUserLoading]);

  if (isLoading.value) {
    return (
      <div>
        <Spinner />
        <p>Loading crops ...</p>
      </div>
    );
  }

  return <App crops={crops.value} areThereCrops={areThereCrops.value} />;
}

function App({ crops, areThereCrops }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 6;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Filter crops based on search term
  const filteredCrops = crops.filter(crop => {
    const regex = new RegExp(searchTerm, 'i');
    return regex.test(crop.cropName) || regex.test(crop.cropType) || regex.test(crop.cropVariety);
  });

  const currentItems = filteredCrops.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCrops.length / itemsPerPage);

  return (
    <div className={` text-center `}>
      <input
        type="text"
        placeholder="Search crops..."
        value={searchTerm}
        onChange={handleSearch}
        className={styles.searchInput}
      />

      {areThereCrops ? (
        <CropsList crops={currentItems} />
      ) : (
        <NoCrops />
      )}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

function CropsList({ crops }) {
  return (
    <div>
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

function Pagination({ totalPages, currentPage, onPageChange }) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className={styles.pagination}>
      {pages.map((page) => (
        <button
          key={page}
          className={`${styles.pageButton} ${page === currentPage ? styles.active : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
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

