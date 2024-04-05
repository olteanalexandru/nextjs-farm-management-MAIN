import Link from "next/link";
import styles from '../styles/Header.module.css';

export default function Footer() {
  return (
    <div className={styles.footerContainer}>
      <footer id="footer" className={styles.footer}>
        <div className="container">

          <p className="text-white text-center">&copy;{new Date().getFullYear()} Agricultural Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
