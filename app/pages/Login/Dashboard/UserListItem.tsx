import { useState } from 'react';
import UpdatePasswordForm from './UpdatePasswordForm';

const UserListItem = ({ user, deleteUser } : { user: any, deleteUser: any }) => {
  const [showUpdatePasswordForm, setShowUpdatePasswordForm] = useState(false);

  return (
    <li key={user._id}>
      {user.name} - {user.email}{' '}
      <button onClick={() => deleteUser(user._id)}>Delete</button>
      <button onClick={() => setShowUpdatePasswordForm(!showUpdatePasswordForm)}>
        Update Password
      </button>
      {/* Show the UpdatePasswordForm component based on the state */}
      {showUpdatePasswordForm && <UpdatePasswordForm userId={user._id} />}
    </li>
  );
};

export default UserListItem;