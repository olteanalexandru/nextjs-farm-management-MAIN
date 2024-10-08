"use client"
import { Dropdown } from 'react-bootstrap';
import { useGlobalContext } from '../Context/UserStore';
import styles from '../../styles/Header.module.css';
import Link from 'next/link';

function HeaderLog() {
  const { data , login , logout} = useGlobalContext();

  return (
    <header className={`${styles.headerModule} py-2`}>
      {data && data.name ? (
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" id="dropdownMenuButton1">
            <Link href="/pages/Login/Dashboard/" style={{ textDecoration: 'none', color: '#fff' }}>
            {data.picture && (
  <img 
    src={data.picture} 
    alt="User Avatar" 
    width="40" 
    height="40" 
    style={{ borderRadius: "25%", marginRight: "10px" }} 
  />
)}
              {data.name}
            </Link>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item as={Link} href="/pages/Rotatie">Crop library</Dropdown.Item>
            <Dropdown.Item as={Link} href="/pages/Login/Dashboard/">Dashboard</Dropdown.Item>
            {data.role.toLowerCase() === 'farmer' && (
              <>
                <Dropdown.Item as={Link} href="/pages/Login/RotatieDashboard/">Crop rotation</Dropdown.Item>
                {/* <Dropdown.Item as={Link} href="/pages/Recomandari/">Analitics</Dropdown.Item> */}
              </>
            )}
            <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <div>
          <div onClick={login} tabIndex={0}>Log in</div>
        </div>
      )}
    </header>
  );
}

export default HeaderLog;