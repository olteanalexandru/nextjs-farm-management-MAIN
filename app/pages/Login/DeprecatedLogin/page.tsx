"use client";
import { useEffect, useState } from 'react';
import { FaSignInAlt, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGlobalContext } from '../../../providers/UserStore';
import Spinner from '../../../Crud/Spinner';
import Link from 'next/link';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;



  const { data, setData, error, loading, login } = useGlobalContext();

  const navigate = useRouter();

  useEffect(() => {
    if (data.token) {
      navigate.push('/');
    }
  }, [data]);

  useEffect(() => {

    if (error) {
      toast.error(error);
      alert(error)
      setData({
        _id: '', email: '', password: '', rol: '', token: '',
        name: ''
      });
    }
  }, [error]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    login(email, password);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="login-container" style={{ margin: '0 auto', maxWidth: '400px', marginTop: '100px', marginBottom: '100px' }}>
      <section className="heading">
        <h1>
          <FaSignInAlt /> Login
        </h1>
        <p>Sign in and start managing your crops</p>
      </section>

      <section className="form">
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              placeholder="Enter your email"
              onChange={onChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              placeholder="Enter your password"
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <button type="submit" className="btn btn-block">
              Submit
            </button>
          </div>
        </form>
        <p>Don't have an account? <Link href="/pages/Login/Register" className="text-decoration-none text-dark">Register <FaUser /></Link></p>
      </section>
    </div>
  );
}

export default Login;


