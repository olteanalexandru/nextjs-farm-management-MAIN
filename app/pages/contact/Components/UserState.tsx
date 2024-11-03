import { useEffect, useState } from 'react';
import { useGlobalContext } from '../../../providers/UserStore';

export default function useUserState() {
  const { data } = useGlobalContext();
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
