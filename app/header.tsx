"use client"
import Link from 'next/link';
import HeaderLog from './Crud/Header';
import Image from 'next/image';
import styles from '../styles/Header.module.css';
import logo from '../public/Logo.png'
import { LanguageSwitch } from '@/app/componets/LanguageSwitch';
import  AuthButton  from '@/app/componets/LoginButton';







function Header() {

 

  return (
   <div>
                {/* <HeaderLog /> */}
          
          
          
<AuthButton />
  <LanguageSwitch />
  </div>

  );
}

export default Header;
