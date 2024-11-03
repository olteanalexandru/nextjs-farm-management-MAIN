//ts-nocheck


"use client"
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation';
import {toast} from 'react-toastify'
import {FaUser} from 'react-icons/fa'
import Spinner from '../../../Crud/Spinner'
import {Form} from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import {useGlobalContext} from '../../../providers/UserStore';

function Register() {
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    email: '',
  });

  const { role, name, email } = formData;

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


    if ( data.role.toLowerCase() !== 'admin') {
      navigate.push('/');
      console.log('User is not admin' + data.role);
    }
  }, [error, data]);

  const onSubmit = (e) => {
    e.preventDefault();

      register(role, name, email);
    
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
       <div className="login-container" style={{ margin: '0 auto', maxWidth: '400px' , marginTop:'100px' , marginBottom:'100px' }}>
      <section className='heading'>
        <h1>
          <FaUser /> Register a user
        </h1>
      </section>

   
      <section className='form'>
        <Form onSubmit={onSubmit}>
          {data.role.toLowerCase() === 'admin' && (
            <div className='form-group'>
              <label>
                <select
                  aria-label='Role'
                  value={formData.role}
                  onChange={onChange}
                  name='role'
                  id='role'
                  className='form-control'
                >
                  <option>Select role</option>
                  <option value='farmer'>Farmer</option>
                  <option value='admin'>Administrator</option>
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
        <button type='submit' className='btn btn-block' >
          Submit
        </button>
      </div>
    </Form>

  </section>
</div>
</>
);
}

export default Register;