import React, { useState } from 'react';

interface FormData {
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
}

function AdminCropForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [cropName, setCropName] = useState('');
  const [nitrogenSupply, setNitrogenSupply] = useState('');
  const [nitrogenDemand, setNitrogenDemand] = useState('');
  const [pests, setPests] = useState('');
  const [diseases, setDiseases] = useState('');
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      cropName,
      nitrogenSupply: Number(nitrogenSupply),
      nitrogenDemand: Number(nitrogenDemand),
      pests: pests.split(',').map((pest) => pest.trim()),
      diseases: diseases.split(',').map((disease) => disease.trim()),
    });
    setCropName('');
    setNitrogenSupply('');
    setNitrogenDemand('');
    setPests('');
    setDiseases('');
  };

  return (
    
    <form onSubmit={handleSubmit} className="p-3">
      <div className='form-group'>
      <h3>Adauga recomandare</h3>
        <label htmlFor='cropName'>Nume cultura:</label>
        <input
          id='cropName'
          type='text'
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='nitrogenSupply'>Aprovizionare azot:</label>
        <input
          id='nitrogenSupply'
          type='number'
          value={nitrogenSupply}
          onChange={(e) => setNitrogenSupply(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='nitrogenDemand'>Nevoie azot:</label>
        <input
          id='nitrogenDemand'
          type='number'
          value={nitrogenDemand}
          onChange={(e) => setNitrogenDemand(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='pests'>Daunatori (separat prin virgula):</label>
        <input
          id='pests'
          type='text'
          value={pests}
          onChange={(e) => setPests(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='diseases'>Boli (separat prin virgula):</label>
        <input
          id='diseases'
          type='text'
          value={diseases}
          onChange={(e) => setDiseases(e.target.value)}
          className='form-control'
        />
      </div>
      <button type='submit' className='btn btn-primary mt-2'>Trimite</button>
    </form>
  );
}

export default AdminCropForm;