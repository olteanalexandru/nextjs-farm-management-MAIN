import React from 'react';
import { Form, Button } from 'react-bootstrap';

function SelectAreaComponent({ onSubmit, selectarea, setSelectarea, numSelections, setNumSelections }) {
  return (
    <Form onSubmit={(e) => onSubmit(e, !selectarea)}>
      <Form.Group>
        <Form.Label>Number of selections</Form.Label>
        <Form.Control
          type="number"
          min="1"
          value={numSelections}
          onChange={(e) => setNumSelections(parseInt(e.target.value))}
        />
      </Form.Group>
      <Button variant="success" type="submit">
        {selectarea ? 'Deselect' : 'Select'}
      </Button>
    </Form>
  );
}

export default SelectAreaComponent;
