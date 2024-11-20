import React, { useState } from 'react';
import { useGlobalContextRotation } from '../../../providers/rotationStore';
import { useTranslations } from 'next-intl';

const CropRotationForm = ({ filteredCrops }) => {
  const t = useTranslations('CropRotationForm');
  const [fieldSize, setFieldSize] = useState('');
  const [numberOfDivisions, setNumberOfDivisions] = useState('');
  const [rotationName, setRotationName] = useState('');
  const [maxYears, setMaxYears] = useState('');
  const [ResidualNitrogenSupply, setResidualNitrogenSupply] = useState(''); 

  const { generateCropRotation } = useGlobalContextRotation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      parseInt(fieldSize) > 0 &&
      parseInt(numberOfDivisions) > 0 &&
      rotationName &&
      parseInt(maxYears) > 0
    ) {
      generateCropRotation({
        fieldSize: parseInt(fieldSize),
        numberOfDivisions: parseInt(numberOfDivisions),
        rotationName,
        crops: filteredCrops,
        maxYears: parseInt(maxYears),
        ResidualNitrogenSupply: parseInt(ResidualNitrogenSupply)
      });
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
        <label htmlFor="fieldSize">
          {t('fieldSize')}*:
        </label>
        <input
          type="number"
          className="form-control"
          id="fieldSize"
          value={fieldSize}
          onChange={(e) => setFieldSize(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="numberOfDivisions">
          {t('numberOfDivisions')}*:
        </label>
        <input
          type="number"
          className="form-control"
          id="numberOfDivisions"
          value={numberOfDivisions}
          onChange={(e) => setNumberOfDivisions(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="rotationName">
          {t('rotationName')}*:
        </label>
        <input
          type="text"
          className="form-control"
          id="rotationName"
          value={rotationName}
          onChange={(e) => setRotationName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="maxYears">
          {t('maxYears')}*:
        </label>
        <input
          type="number"
          className="form-control"
          id="maxYears"
          value={maxYears}
          onChange={(e) => setMaxYears(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="maxYears">
          {t('ResidualNitrogenSupply')}*:
        </label>
        <input
          type="number"
          className="form-control"
          id="ResidualNitrogenSupply"
          value={ResidualNitrogenSupply}
          onChange={(e) => setResidualNitrogenSupply(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        {t('generateCropRotation')}
      </button>
    </form>
  );
};

export default CropRotationForm;
