import { useState } from 'react';
import UpdateRole from './UpdateRoleForm';

const UserListItem = ({ user, deleteUser } : { user: any, deleteUser: any }) => {
  const [showUpdateRole, setUpdateRole] = useState(false);

  return (
    <li key={user._id}>
      {user.name} - {user.email}{' '}
      <button onClick={() => deleteUser(user._id)}>Delete</button>
      <button onClick={() => setUpdateRole(!showUpdateRole)}>
        Update Role
      </button>
      {/* Show the UpdatePasswordForm component based on the state */}
      {showUpdateRole && <UpdateRole userMail={user.email} />}
    </li>
  );
};

export default UserListItem;