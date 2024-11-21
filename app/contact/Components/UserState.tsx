import { useEffect, useState } from 'react';
import { useUserContext } from '../../../providers/UserStore';

export default function useUserState() {
  const { data } = useUserContext();
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (data) {
      setUser(data.name);
      setEmail(data.email);
    }
  }, [data]);

  return { user, setUser, email, setEmail };
}
