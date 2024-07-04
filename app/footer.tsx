import Link from "next/link";
import styles from '../styles/Header.module.css';

export default function Footer() {
  return (
    <div className={styles.footerContainer}>
      <footer id="footer" className={styles.footer}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <p className="text-white text-center flex-grow-1 m-0">©{new Date().getFullYear()} Agricultural Platform. All rights reserved.</p>
            <div>
              <Link href="/pages/AboutUs" className={styles.navLink}>About Us</Link>
              <Link href="/pages/contact" className={styles.navLink}>Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
