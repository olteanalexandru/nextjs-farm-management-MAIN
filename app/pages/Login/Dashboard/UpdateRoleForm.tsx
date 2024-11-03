import { useState } from 'react';
import { useGlobalContext } from '../../../providers/UserStore';
import { Form, Button } from 'react-bootstrap';

function UpdateRoleForm({ userMail }) {
  const [newRole, setNewRole] = useState('');  // Initialize newRole state
  const { updateRole } = useGlobalContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateRole(userMail, newRole);  // Call updateRole with newRole
      alert('Role updated successfully');  // Update success message
    } catch (error) {
      console.error('Error updating role:', error);  // Update error message
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Select Role</Form.Label>
        <Form.Control
          as="select"
          value={newRole}  // Update selected value
          onChange={(e) => setNewRole(e.target.value)}  // Update onChange handler
          required
        >
          <option value="">Choose...</option>
          <option value="farmer">Farmer</option>
          <option value="admin">Admin</option>
        </Form.Control>
      </Form.Group>
      <Button type="submit">Update Role</Button>
    </Form>
  );
}

export default UpdateRoleForm;
