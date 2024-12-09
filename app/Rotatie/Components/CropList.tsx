import { Row, Col, Card } from 'react-bootstrap';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RecommendationResponse } from '../../types/api';

interface CropListProps {
  selectedCrops: RecommendationResponse[];
  onSelectionCount: (crop: RecommendationResponse, count: number) => void;
  selectedCounts: Map<string, number>;
}

const CropList = ({ selectedCrops, onSelectionCount, selectedCounts }: CropListProps) => {
  const t = useTranslations('RotatieDashboard');
  const [visible, setVisible] = useState(6);

  const showMore = () => {
    setVisible(prevVisible => prevVisible + 6);
  };

  return (
    <>
      <h3>{t('Culturi selectate')}</h3>
      {selectedCrops.length === 0 ? (
        <p>{t('Nicio cultura selectata')}</p>
      ) : (
        <Row>
          {selectedCrops.slice(0, visible).map((crop) => (
            <Col key={crop.id?.toString() || crop._id} xs={12} sm={6} md={4}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>{crop.cropName}</Card.Title>
                  <Card.Text>
                    <div>Soil Type: {crop.soilType}</div>
                    <div>Nitrogen Supply: {crop.nitrogenSupply}</div>
                    <div>Nitrogen Demand: {crop.nitrogenDemand}</div>
                  </Card.Text>
                  <div className="mt-3">
                    <label className="d-block mb-2">Times in Rotation:</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      className="form-control"
                      value={selectedCounts.get(crop.id?.toString() || crop._id) || 0}
                      onChange={(e) => onSelectionCount(crop, parseInt(e.target.value))}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      {selectedCrops.length > visible && (
        <div className="text-center mt-3">
          <button className="btn btn-primary" onClick={showMore}>
            {t('Vezi mai mult')}
          </button>
        </div>
      )}
    </>
  );
};

export default CropList;
