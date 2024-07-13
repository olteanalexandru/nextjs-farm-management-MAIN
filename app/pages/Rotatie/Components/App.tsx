import { useState } from 'react';
import styles from '../Rotatie.module.css';
import CropsList from './CropsList';
import Pagination from './Pagination';
import NoCrops from './NoCrops';

interface Crop {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
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

export default App;
