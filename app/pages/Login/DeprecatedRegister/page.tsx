//ts-nocheck


"use client"
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation';
import {toast} from 'react-toastify'
import {FaUser} from 'react-icons/fa'
import Spinner from '../../../Crud/Spinner'
import {Form} from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import {useGlobalContext} from '../../../Context/UserStore';

function Register() {
  const [formData, setFormData] = useState({
    rol: 'Fermier',
    name: '',
    email: '',
    password: '',
    password2: '',
  });

  const { rol, name, email, password, password2 } = formData;

  const { data, setData, error, loading, register } = useGlobalContext();

  const navigate = useRouter();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      alert(error);
    }

    if (data.error) {
      toast.error(data.error);
      setData({ rol: '', email: '', password: '', token: '' });
    }
    if (data.token && data.rol !== 'Administrator') {
      navigate.push('/');
    }
  }, [error, data]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (password !== password2) {
      toast.error('Passwords do not match');
    } else {
      register(rol, name, email, password);
      console.log(localStorage.getItem('token'));
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
       <div className="login-container" style={{ margin: '0 auto', maxWidth: '400px' , marginTop:'100px' , marginBottom:'100px' }}>
      <section className='heading'>
        <h1>
          <FaUser /> Register
        </h1>
        <p>Create an account</p>
      </section>

   
      <section className='form'>
        <Form onSubmit={onSubmit}>
          {data.rol === 'Administrator' && (
            <div className='form-group'>
              <label>
                <select
                  as='select'
                  aria-label='Rol'
                  value={formData.rol}
                  onChange={onChange}
                  name='rol'
                  id='rol'
                  className='form-control'
                >
                  <option>Select role</option>
                  <option value='Fermier'>Farmer</option>
                  <option value='Administrator'>Administrator</option>
                </select>
              </label>
            </div>
          )}

          <div className='form-group'>
            <input
              type='text'
              className='form-control'
              id='name'
              name='name'
              value={formData.name}
              placeholder='Enter your name'
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <input
              type='email'
              className='form-control'
              id='email'
              name='email'
              value={formData.email}
              placeholder='Enter your email'
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <input
              type='password'
              className='form-control'
              id='password'
              name='password'
              value={formData.password}
              placeholder='Enter password'
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <input
              type='password'
              className='form-control'
          id='password2'
          name='password2'
          value={formData.password2}
          placeholder='Confirm password'
          onChange={onChange}
        />
      </div>
      <div className='form-group'>
        <button type='submit' className='btn btn-block' >
          Submit
        </button>
      </div>
    </Form>

    <p>
      Already have an account? <a href='http://localhost:3000/pages/Login/Login'>Login</a>
    </p>
  </section>
</div>
</>
);
}

export default Register;