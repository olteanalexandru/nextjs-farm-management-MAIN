// @ts-nocheck
"use client"
import {useEffect, useState} from 'react'
import {useGlobalContext} from '../../../Context/UserStore'
import {useRouter} from 'next/navigation';
import {toast} from 'react-toastify'
import {FaUser} from 'react-icons/fa'
import Spinner from '../../../Crud/Spinner'

import "bootstrap/dist/css/bootstrap.min.css";

function Modifica() {
  const navigate = useRouter()

  if (localStorage.getItem('user') === null) {
    navigate.push('/pages/Login/Login')
  }
  const [formData, setFormData] = useState({
    password: '',
    password2: '',
  })

  const { password, password2 } = formData

  

  const { isLoading, isError, message, modify, data, logout } = useGlobalContext()

  useEffect(() => {


    if (isError) {
      toast.error(message)
    }
   
  }, [ isError])

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  
  const onSubmit = (e) => {
    e.preventDefault()
    if (password !== password2) {
      toast.error('Parolele nu se potrivesc')
    } else {
      const userData = {
        password,
      }
      modify(data._id,userData.password)
      logout()
      navigate.push('/pages/Login/Login')
    }
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <>
      <section className='heading'>
        <h1>
          <FaUser /> Modificare parola
        </h1>
      </section>

      <section className='form'>
        <form onSubmit={onSubmit}>

      
          <div className='form-group'>
            <input
              type='password'
              className='form-control'
              id='password'
              name='password'
              value={password}
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
              value={password2}
              placeholder='Confirm password'
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <button type='submit' className='btn btn-block'>
              Submit
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

export default Modifica