'use client';

import Link from 'next/link';

interface CropType {
  _id: string;
  cropName: string;
  cropType: string;
  description: string;
  soilType: string;
  ItShouldNotBeRepeatedForXYears: number;
}

export function CropContent({ crop }: { crop: CropType }): JSX.Element {
  return (
    <>
      <div className="thumbnail">
        <p>
          <strong>{crop.cropName}</strong>
          <br />
          <strong>{crop.cropType}</strong>
        </p>
        <p>{crop.description} </p>
        <p>Soil type: {crop.soilType}</p>
        <p>Should not be repeated for {crop.ItShouldNotBeRepeatedForXYears} years</p>
      </div>

      <Link href={`/Crud/GetAllInRotatie/SinglePag?crop=${crop._id}`}>
        <button type="button" className="btn btn-primary">
          See more
        </button>
      </Link>
    </>
  );
}
