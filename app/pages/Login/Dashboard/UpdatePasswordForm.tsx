import { useState } from 'react';
import { useGlobalContext } from '../../../Context/UserStore';
import { Form, Button } from 'react-bootstrap';

function UpdatePasswordForm({ userId }) {
  const [newPassword, setNewPassword] = useState('');
  const { modify } = useGlobalContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await modify(userId, newPassword);
      alert('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>New Password</Form.Label>
        <Form.Control
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </Form.Group>
      <Button type="submit">Update Password</Button>
    </Form>
  );
}

export default UpdatePasswordForm;