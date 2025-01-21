import React from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { CropCreate } from '../../types/api';

interface FormComponentProps {
  handleUpdate: (e: React.FormEvent) => Promise<void>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleArrayChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number, field: string) => void;
  updatedCrop: CropCreate;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
}

function FormComponent({ handleUpdate, handleChange, handleArrayChange, updatedCrop, editMode, setEditMode }: FormComponentProps) {
  if (!editMode) {
    return null; 
  }
  return (
    <Form onSubmit={handleUpdate}>
      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Crop Name</Form.Label>
            <Form.Control
              type="text"
              name="cropName"
              value={updatedCrop?.cropName}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={updatedCrop?.description}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Crop Type</Form.Label>
            <Form.Control
              type="text"
              name="cropType"
              value={updatedCrop?.cropType}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Crop Variety</Form.Label>
            <Form.Control
              type="text"
              name="cropVariety"
              value={updatedCrop?.cropVariety}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col>
          {updatedCrop?.diseases?.map((disease, index) => (
            <Form.Group key={index}>
              <Form.Label>Disease {index + 1}</Form.Label>
              <Form.Control
                type="text"
                name={`disease${index}`}
                value={disease}
                onChange={(e) => handleArrayChange(e, index, 'diseases')}
              />
            </Form.Group>
          ))}

          {updatedCrop?.pests?.map((pest, index) => (
            <Form.Group key={index}>
              <Form.Label>Pest {index + 1}</Form.Label>
              <Form.Control
                type="text"
                name={`pest${index}`}
                value={pest}
                onChange={(e) => handleArrayChange(e, index, 'pests')}
              />
            </Form.Group>
          ))}
        </Col>
      </Row>

      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Soil Type</Form.Label>
            <Form.Control
              type="text"
              name="soilType"
              value={updatedCrop?.soilType}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Nitrogen Demand</Form.Label>
            <Form.Control
              type="number"
              name="nitrogenDemand"
              value={updatedCrop?.nitrogenDemand}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col>
          <Form.Group>
            <Form.Label>Nitrogen Supply</Form.Label>
            <Form.Control
              type="number"
              name="nitrogenSupply"
              value={updatedCrop?.nitrogenSupply}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Planting Date</Form.Label>
            <Form.Control
              type="date"
              name="plantingDate"
              value={updatedCrop?.plantingDate instanceof Date ? updatedCrop.plantingDate.toISOString().slice(0, 10) : updatedCrop?.plantingDate}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Harvesting Date</Form.Label>
            <Form.Control
              type="date"
              name="harvestingDate"
              value={updatedCrop?.harvestingDate instanceof Date ? updatedCrop.harvestingDate.toISOString().slice(0, 10) : updatedCrop?.harvestingDate}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Soil Residual Nitrogen</Form.Label>
            <Form.Control
              type="number"
              name="soilResidualNitrogen"
              value={updatedCrop?.soilResidualNitrogen}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group>
        <Form.Label>Fertilizers</Form.Label>
        {updatedCrop?.fertilizers?.map((fertilizer, index) => (
          <Form.Control
            key={index}
            type="text"
            name={`fertilizer${index}`}
            value={fertilizer}
            onChange={(e) => handleArrayChange(e, index, 'fertilizers')}
          />
        ))}
      </Form.Group>

      <Button variant="primary" type="submit">
        Save Changes
      </Button>
      <Button variant="secondary" onClick={() => setEditMode(false)}>
        Cancel
      </Button>
    </Form>
  );
}

export default FormComponent;
