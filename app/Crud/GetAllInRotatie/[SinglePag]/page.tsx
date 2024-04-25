"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Form, Container, Button, Card, ListGroup } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useGlobalContext } from '../../../Context/UserStore';
import { useGlobalContextCrop } from '../../../Context/culturaStore';

function SinglePag() {
  const { data: userData } = useGlobalContext();
  const {
    singleCrop,
    isLoading,
    isError,
    message,
    selectare,
    SinglePage,
    deleteCrop,
    updateCrop,
  } = useGlobalContextCrop();

  const navigate = useRouter();
  const _id = useSearchParams().get('crop');



  const [selectarea, setSelectarea] = useState(false);
  const [numSelections, setNumSelections] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [updatedCrop, setUpdatedCrop] = useState({
    cropName: '',
    ItShouldNotBeRepeatedForXYears: '',
    description: '',
    cropType: '',
    cropVariety: '',
    diseases: [],
    fertilizers: [],
    pests: [],
    soilType: '',
    nitrogenDemand: 0,
    nitrogenSupply: 0,
    plantingDate: '',
    harvestingDate: '',
    soilResidualNitrogen: 0
  });

  const crops = singleCrop;
  const canEdit = userData.role.toLocaleLowerCase() === 'admin' ||  crops?.user == userData._id;


  useEffect(() => {
    SinglePage(_id);
    if (isError) {
      console.log(message);
    }
   
  }, [isError, message, _id]);

  useEffect(() => {
    if (crops) {
      setUpdatedCrop({
        cropName: crops.cropName,
        ItShouldNotBeRepeatedForXYears: crops.ItShouldNotBeRepeatedForXYears,
        description: crops.description,
        cropType: crops.cropType,
        cropVariety: crops.cropVariety,
        diseases: crops.diseases,
        fertilizers: crops.fertilizers,
        pests: crops.pests,
        soilType: crops.soilType,
        nitrogenDemand: crops.nitrogenDemand,
        nitrogenSupply: crops.nitrogenSupply,
        plantingDate: crops.plantingDate,
        harvestingDate: crops.harvestingDate,
        soilResidualNitrogen: crops.soilResidualNitrogen,
      });
    }
  }, [crops]);

  if (isLoading) {
    return <h1>Loading...</h1>;
  }


  if (isError) {
    return <h1>{message}</h1>;
  }

  const handleDelete = async () => {
    try {
      await deleteCrop(_id);
      console.log('Crop deleted');
      navigate.push('/pages/Rotatie');
    } catch (error) {
      console.error('Error deleting crop:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateCrop(_id, updatedCrop);
    setEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedCrop({ ...updatedCrop, [name]: value });
  };

  const handleArrayChange = (e, index, field) => {
    const newArr = [...updatedCrop[field]];
    newArr[index] = e.target.value;
    setUpdatedCrop({ ...updatedCrop, [field]: newArr });
  };

  const onSubmit = async (e, newSelectArea) => {
    e.preventDefault();
    if (userData && userData.role.toLowerCase() === "farmer") {
      await selectare(_id, newSelectArea, numSelections);
      setSelectarea(newSelectArea);
    }
  };

  return (
    <Container>
      {editMode ? (
        <Form onSubmit={handleUpdate}>
          <Form.Group>
            <Form.Label>Crop Name</Form.Label>
            <Form.Control
              type="text"
              name="cropName"
              value={updatedCrop.cropName}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={updatedCrop.description}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Crop Type</Form.Label>
            <Form.Control
              type="text"
              name="cropType"
              value={updatedCrop.cropType}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Crop Variety</Form.Label>
            <Form.Control
              type="text"
              name="cropVariety"
              value={updatedCrop.cropVariety}
              onChange={handleChange}
            />
          </Form.Group>

          {updatedCrop.diseases.map((disease, index) => (
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

          {updatedCrop.pests.map((pest, index) => (
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

          <Form.Group>
            <Form.Label>Soil Type</Form.Label>
            <Form.Control
              type="text"
              name="soilType"
              value={updatedCrop.soilType}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Nitrogen Demand</Form.Label>
            <Form.Control
              type="number"
              name="nitrogenDemand"
              value={updatedCrop.nitrogenDemand}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Nitrogen Supply</Form.Label>
            <Form.Control
              type="number"
              name="nitrogenSupply"
              value={updatedCrop.nitrogenSupply}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Planting Date</Form.Label>
            <Form.Control
              type="date"
              name="plantingDate"
              value={updatedCrop.plantingDate}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Harvesting Date</Form.Label>
            <Form.Control
              type="date"
              name="harvestingDate"
              value={updatedCrop.harvestingDate}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Soil Residual Nitrogen</Form.Label>
            <Form.Control
              type="number"
              name="soilResidualNitrogen"
              value={updatedCrop.soilResidualNitrogen}
              onChange={handleChange}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>

          <Button variant="secondary" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
        </Form>
      ) : (
        <>
          {crops && (
            <Card style={{ width: '18rem' }}>
              <Card.Body>
                <Card.Title>{crops.cropName}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{crops.cropType}</Card.Subtitle>
                <Card.Text>{crops.description}</Card.Text>
              </Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>Varietate cultură: {crops.cropVariety}</ListGroup.Item>
                <ListGroup.Item>Boli: {crops.diseases.join(', ')}</ListGroup.Item>
                <ListGroup.Item>Îngrășăminte: {crops.fertilizers.join(', ')}</ListGroup.Item>
                <ListGroup.Item>Dăunători: {crops.pests.join(', ')}</ListGroup.Item>
                <ListGroup.Item>Tip de sol: {crops.soilType}</ListGroup.Item>
                <ListGroup.Item>Cerințe de azot: {crops.nitrogenDemand}</ListGroup.Item>
                <ListGroup.Item>Ofertă de azot: {crops.nitrogenSupply}</ListGroup.Item>
                <ListGroup.Item>Data plantării: {crops.plantingDate}</ListGroup.Item>
                <ListGroup.Item>Data recoltării: {crops.harvestingDate}</ListGroup.Item>
                <ListGroup.Item>Azot residual în sol: {crops?.soilResidualNitrogen}</ListGroup.Item>
              </ListGroup>
              {canEdit && (
                <Card.Body>
                  <Button variant="danger" onClick={handleDelete}>
                    Delete
                  </Button>
                  <Button variant="primary" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                  {userData && userData.role.toLowerCase() === 'farmer' && (
                    <Card.Body>
                      <Form onSubmit={(e) => onSubmit(e, !selectarea)}>
                        <Form.Group>
                          <Form.Label>Numarul de selectari</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={numSelections}
                            onChange={(e) => setNumSelections(parseInt(e.target.value))}
                          />
                        </Form.Group>
                        <Button variant="success" type="submit">
                          {selectarea ? 'Deselecteaza' : 'Selecteaza'}
                        </Button>
                      </Form>
                    </Card.Body>
                  )}
                </Card.Body>
              )}
            </Card>
          )}
        </>
      )}
    </Container>
  );
};

export default SinglePag;





