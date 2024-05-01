import React, { useState } from 'react';
import { useGlobalContextCrop } from '../../../Context/culturaStore';

const CropRotationForm = ({ filteredCrops }) => {
  const [fieldSize, setFieldSize] = useState('');
  const [numberOfDivisions, setNumberOfDivisions] = useState('');
  const [rotationName, setRotationName] = useState('');
  const [maxYears, setMaxYears] = useState('');
  const [ResidualNitrogenSupply, setResidualNitrogenSupply] = useState(''); 

  const { generateCropRotation } = useGlobalContextCrop();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      parseInt(fieldSize) > 0 &&
      parseInt(numberOfDivisions) > 0 &&
      rotationName &&
      parseInt(maxYears) > 0
    ) {
      generateCropRotation(
        parseInt(fieldSize),
        parseInt(numberOfDivisions),
        rotationName,
        filteredCrops,
        parseInt(maxYears),
        parseInt(ResidualNitrogenSupply)
      );
      setFieldSize('');
      setNumberOfDivisions('');
      setRotationName('');
      setMaxYears('');
      setResidualNitrogenSupply('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="fieldSize">Dimensiune câmp*:</label>
        <input
          type="number"
          className="form-control"
          id="fieldSize"
          value={fieldSize}
          onChange={(e) => setFieldSize(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="numberOfDivisions">Număr de diviziuni*:</label>
        <input
          type="number"
          className="form-control"
          id="numberOfDivisions"
          value={numberOfDivisions}
          onChange={(e) => setNumberOfDivisions(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="rotationName">Nume rotație*:</label>
        <input
          type="text"
          className="form-control"
          id="rotationName"
          value={rotationName}
          onChange={(e) => setRotationName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="maxYears">Ani maximi*:</label>
        <input
          type="number"
          className="form-control"
          id="maxYears"
          value={maxYears}
          onChange={(e) => setMaxYears(e.target.value)}
        />
      </div>
      <div className="form-group">
      <label htmlFor="maxYears">Azot rezidual:</label>
      <input
          type="number"
          className="form-control"
          id="ResidualNitrogenSupply"
          value={ResidualNitrogenSupply}
          onChange={(e) => setResidualNitrogenSupply(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Generează rotația culturilor
      </button>
    </form>
  );
};

export default CropRotationForm;
