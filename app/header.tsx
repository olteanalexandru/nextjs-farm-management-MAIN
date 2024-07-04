"use client"
import Link from 'next/link';
import HeaderLog from './Crud/Header';
import Image from 'next/image';
import styles from '../styles/Header.module.css';
import logo from '../public/Logo.png'

//for check loggedstatus


function Header() {

  return (
    <div className={styles.container}>
      <header id="header" className={styles.header}>
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <div className={` d-flex align-items-center ${styles.link, styles.logo}`}>
            <Link href="/">
              <Image src="/Logo.png" width={95} height={95} alt="Platforma agricola logo" />
              <span className="ms-2 text-white">FutureName</span>
            </Link>
          </div>

          <nav id="navbar" className={styles.navbar}>
            <ul className="d-flex align-items-center justify-content-end mb-0">
              <li className="nav-item nav-list">
                <Link href="/" className={styles.navLink}>Home</Link>
              </li>
              <li className="nav-item nav-list">
                <Link href="/pages/News" className={styles.navLink}>News</Link>
              </li>
           


              <li className={`${styles.navLink} nav-item nav-list`}>
                <HeaderLog />
              </li>
            </ul>
          </nav>
          <i className="bi bi-list mobile-nav-toggle"></i>
        </div>
      </header>
      <hr />
    </div>
  );
}

export default Header;
