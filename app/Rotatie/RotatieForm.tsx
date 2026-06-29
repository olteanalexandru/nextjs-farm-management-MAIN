import React, { useState } from 'react';
import { useGlobalContextRotation } from '../providers/rotationStore';
import { useTranslations } from 'next-intl';

interface Crop {
  _id: string;
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  soilType: string;
  pests: string[];
  diseases: string[];
  ItShouldNotBeRepeatedForXYears: number;
  cropType: string;
  cropVariety: string;
  plantingDate: string;
  harvestingDate: string;
  yield: number;
  marketValue: number;
  waterRequirement: number;
  sunlightRequirement: number;
  growthDuration: number;
  description: string;
  imageUrl: string;
  fertilizers: string[];
  selectare: boolean; // Change this line
  treatments: string[];
  user: string;
  residualNitrogen: number;
}

interface CropRotationFormProps {
  filteredCrops: Crop[];
  onRotationGenerated: (data: any) => void; // Add this line
}

const CropRotationForm: React.FC<CropRotationFormProps> = ({ filteredCrops, onRotationGenerated }) => {
  const t = useTranslations('CropRotationForm');
  const [fieldSize, setFieldSize] = useState('');
  const [numberOfDivisions, setNumberOfDivisions] = useState('');
  const [rotationName, setRotationName] = useState('');
  const [maxYears, setMaxYears] = useState('');
  const [ResidualNitrogenSupply, setResidualNitrogenSupply] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { generateCropRotation, error } = useGlobalContextRotation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      const formData = {
        fieldSize: parseFloat(fieldSize),
        numberOfDivisions: parseInt(numberOfDivisions, 10), // Ensure it's an integer
        rotationName,
        crops: filteredCrops,
        maxYears: parseInt(maxYears, 10), // Also convert maxYears to integer
        ResidualNitrogenSupply: parseFloat(ResidualNitrogenSupply) || 500
      };

      const data = await generateCropRotation(formData);
      onRotationGenerated(data);
    } catch (err) {
      console.error('Error generating rotation:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to generate crop rotation. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {(submitError || error) && (
        <div className="alert alert-danger" role="alert">
          {submitError || error}
        </div>
      )}
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
