import React from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';
import { useSignals  } from "@preact/signals-react/runtime";

function CropCardComponent({ 
  crops, 
  handleDelete, 
  canEdit, 
  setEditMode 
}: {
  crops?: any, 
  handleDelete?: () => void, 
  canEdit?: boolean, 
  setEditMode?: (editMode: boolean) => void 
}) {
  useSignals();

  console.log('CropCardComponent.tsx rendered')

  if (!crops) {
    return <div>No crops data provided</div>;
  }
  
  return (
    <Card style={{ width: '18rem' }}>
      <Card.Body>
        <Card.Title>{crops?.cropName}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{crops?.cropType}</Card.Subtitle>
        <Card.Text>{crops?.description}</Card.Text>
      </Card.Body>
      <ListGroup variant="flush">
        <ListGroup.Item>Crop Variety: {crops?.cropVariety}</ListGroup.Item>
        <ListGroup.Item>Diseases: {crops?.diseases.join(', ')}</ListGroup.Item>
        <ListGroup.Item>Fertilizers: {crops?.fertilizers.join(', ')}</ListGroup.Item>
        <ListGroup.Item>Pests: {crops?.pests.join(', ')}</ListGroup.Item>
        <ListGroup.Item>Soil Type: {crops?.soilType}</ListGroup.Item>
        <ListGroup.Item>Nitrogen Demand: {crops?.nitrogenDemand}</ListGroup.Item>
        <ListGroup.Item>Nitrogen Supply: {crops?.nitrogenSupply}</ListGroup.Item>
        <ListGroup.Item>Planting Date: {crops?.plantingDate}</ListGroup.Item>
        <ListGroup.Item>Harvesting Date: {crops?.harvestingDate}</ListGroup.Item>
        <ListGroup.Item>Soil Residual Nitrogen: {crops?.soilResidualNitrogen}</ListGroup.Item>
      </ListGroup>
      {canEdit && setEditMode && handleDelete && (
        <Card.Body>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="primary" onClick={() => setEditMode(true)}>
            Edit
          </Button>
        </Card.Body>
      )}
    </Card>
  );
}

export default CropCardComponent;
