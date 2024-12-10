import React from 'react';
import { Button, Card } from 'react-bootstrap';

interface SelectAreaProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  selectarea: boolean;
}

function SelectAreaComponent({ onSubmit, selectarea }: SelectAreaProps) {
  return (
    <Card className="mt-3">
      <Card.Body>
        <Card.Title>Rotation Selection</Card.Title>
        <Card.Text>
          {selectarea 
            ? 'This crop is currently selected for rotation.' 
            : 'Add this crop to your rotation plan.'}
        </Card.Text>
        <Button 
          variant={selectarea ? "danger" : "success"}
          onClick={onSubmit}
        >
          {selectarea ? 'Remove from Rotation' : 'Add to Rotation'}
        </Button>
      </Card.Body>
    </Card>
  );
}

export default SelectAreaComponent;
