"use client";
import { useGlobalContextCrop } from '../Context/culturaStore';
import { useGlobalContext } from '../Context/UserStore';
import FileBase from 'react-file-base64';
import CropRecommendations from './CropRecommandations';
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const CropForm = () => {
  const { createCrop } = useGlobalContextCrop();
  const { data } = useGlobalContext();

  const [cropName, setCropName] = useState(sessionStorage.getItem('cropName') || '');
  const [cropType, setCropType] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [harvestingDate, setHarvestingDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [soilType, setSoilType] = useState('');
  const [fertilizers, setFertilizers] = useState([]);
  const [pests, setPests] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [ItShouldNotBeRepeatedForXYears, setItShouldNotBeRepeatedForXYears] = useState('');
  const [climate, setClimate] = useState('');
  const [nitrogenSupply, setNitrogenSupply] = useState('');
  const [nitrogenDemand, setNitrogenDemand] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();

    const newCrop = {
      cropName,
      cropType,
      cropVariety,
      plantingDate,
      harvestingDate,
      description,
      imageUrl,
      soilType,
      climate,
      fertilizers,
      pests,
      diseases,
      ItShouldNotBeRepeatedForXYears: !isNaN(parseInt(ItShouldNotBeRepeatedForXYears))
        ? parseInt(ItShouldNotBeRepeatedForXYears)
        : null,
      nitrogenSupply: nitrogenSupply,
      nitrogenDemand: nitrogenDemand,
    };

    createCrop(newCrop);
  };

  const debouncedSetCropName = useCallback(
    debounce((value) => sessionStorage.setItem('cropName', value), 1000),
    []
  );

  useEffect(() => {
    if (cropName) {
      debouncedSetCropName(cropName);
    }
  }, [cropName, debouncedSetCropName]);


  const toggleAdditionalFields = () => setShowAdditional(!showAdditional);
  return (
    <div className="container">
      <section className="form my-5">
        <form onSubmit={onSubmit}>
          <div className="row">
            <div className="col-md-3 form-group">
              <label htmlFor="cropName">Crop Name:</label>
              <input
                type="text"
                name="cropName"
                id="cropName"
                value={cropName}
                onChange={(e) => {
                  setCropName(e.target.value);
                }}
                className="form-control"
                required
              />
            </div>
           
            <div className="col-md-3 form-group">
              <label htmlFor="cropVariety">Crop Variety:</label>
              <input
                type="text"
                name="cropVariety"
                id="cropVariety"
                value={cropVariety}
                onChange={(e) => setCropVariety(e.target.value)}
                className="form-control"
              />
            </div>
            
            <br />
            <strong>Rotation Requirements:</strong>
            <br />
            <div className="row">
              <div className="col-md-3 form-group">
                <label htmlFor="pests">Pests:</label>
                <select
                  name="pests"
                  id="pests"
                  multiple
                  value={pests}
                  onChange={(e) =>
                    setPests(Array.from(e.target.selectedOptions, (option) => option.value))
                  }
                  required
                  className="form-control"
                >
                  <option value="">Select a pest</option>
                  <option value="aphids">Aphids</option>
                  <option value="beetles">Beetles</option>
                  <option value="flies">Flies</option>
                  <option value="spiders">Spiders</option>
                </select>
              </div>
              <div className="col-md-3 form-group">
                <label htmlFor="diseases">Diseases:</label>
                <select
                  name="diseases"
                  id="diseases"
                  multiple
                  value={diseases}
                  onChange={(e) =>
                    setDiseases(Array.from(e.target.selectedOptions, (option) => option.value))
                  }
                  className="form-control"
                  required
                >
                  <option value="">Select a disease</option>
                  <option value="bee">Bee</option>
                  <option value="fusarium">Fusarium</option>
                  <option value="mildew">Mildew</option>
                  <option value="mold">Mold</option>
                  <option value="powderyMildew">Powdery Mildew</option>
                  <option value="pest">Pest</option>
                  <option value="rust">Rust</option>
                  <option value="disorder">Disorder</option>
                  <option value="virus">Virus</option>
                </select>
              </div>
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="nitrogenSupply">Nitrogen Supply:</label>
              <input
                type="number"
                name="nitrogenSupply"
                id="nitrogenSupply"
                value={nitrogenSupply}
                onChange={(e) => setNitrogenSupply(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="nitrogenDemand">Nitrogen Demand:</label>
              <input
                type="number"
                name="nitrogenDemand"
                id="nitrogenDemand"
                value={nitrogenDemand}
                onChange={(e) => setNitrogenDemand(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="ItShouldNotBeRepeatedForXYears">Do Not Repeat for X Years:</label>
              <input
                type="number"
                name="ItShouldNotBeRepeatedForXYears"
                id="ItShouldNotBeRepeatedForXYears"
                value={ItShouldNotBeRepeatedForXYears}
                onChange={(e) => setItShouldNotBeRepeatedForXYears(e.target.value)}
                className="form-control"
                required
              />
            </div>
          </div>
          <button type="button" onClick={toggleAdditionalFields} className="btn btn-block mt-2 mb-2">
            {showAdditional ? 'Hide Additional Fields' : 'Show Additional Fields'}
          </button>

          {showAdditional && (
            <>
              <div className="row">
                <div className="col-md-3 form-group">
                  <label htmlFor="fertilizers">Used Fertilizers:</label>
                  <select
                    name="fertilizers"
                    id="fertilizers"
                    multiple
                    value={fertilizers}
                    onChange={(e) =>
                      setFertilizers(Array.from(e.target.selectedOptions, (option) => option.value))
                    }
                    className="form-control"
                  >
                    <option value="nitrogen">Nitrogen</option>
                    <option value="phosphorus">Phosphorus</option>
                    <option value="potassium">Potassium</option>
                    <option value="organic">Organic</option>
                  </select>
                </div>
                <div className="col-md-3 form-group">
                  <label htmlFor="climate">Climate:</label>
                  <input
                    type="text"
                    name="climate"
                    id="climate"
                    value={climate}
                    onChange={(e) => setClimate(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 form-group">
                  <label htmlFor="cropType">Crop Type:</label>
                  <select
                    name="cropType"
                    id="cropType"
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a type</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="cereals">Cereals</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-3 form-group">
                  <label htmlFor="soilType">Soil Type:</label>
                  <select
                    name="soilType"
                    id="soilType"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a soil type</option>
                    <option value="clay">Clay</option>
                    <option value="sandy">Sandy</option>
                    <option value="silty">Silty</option>
                    <option value="loamy">Loamy</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 form-group">
                  <label htmlFor="plantingDate">Planting Date:</label>
                  <input
                    type="date"
                    name="plantingDate"
                    id="plantingDate"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="form-control"
                  />
                  <label htmlFor="harvestingDate">Harvesting Date:</label>
                  <input
                    type="date"
                    name="harvestingDate"
                    id="harvestingDate"
                    value={harvestingDate}
                    onChange={(e) => setHarvestingDate(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="col-md-3 form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea
                    name="description"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 form-group">
                  <h3 className="text-center mb-4">Add Image</h3>
                  <FileBase multiple={false} onDone={({ base64 }) => setImageUrl(base64)} />
                </div>
              </div>
            </>
          )}

          <div className="row">
            <div className="col-md-3 form-group">
              <h3 className="text-center mb-4">Add Image</h3>
              <FileBase multiple={false} onDone={({ base64 }) => setImageUrl(base64)} />
            </div>
          </div>
          <br />
          <div className="form-group">
            <button className="btn btn-primary btn-block" type="submit">
              Add Crop
            </button>
          </div>
        </form>
      </section>

      {cropName && (
        <>
          <h2 className="text-center mb-4">Similar Crops</h2>
          <CropRecommendations cropName={cropName}  />
        </>
      )}
    </div>
  );
}

export default CropForm;


