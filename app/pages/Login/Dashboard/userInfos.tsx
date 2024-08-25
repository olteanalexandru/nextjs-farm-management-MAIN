import React from 'react';
import { Card, Container } from 'react-bootstrap';
import { useGlobalContext } from '../../../Context/UserStore';
import LinkParola from '../Elements/page';

export const UserInfos = () => {
  const { data: { name, email, role } , isUserLoggedIn  } = useGlobalContext();

  const cardStyle = {
    backgroundColor: '#f2f2f2',
    padding: '20px',
    marginBottom: '20px',
  };

  const greetingStyle = {
    color: '#333',
    fontSize: '24px',
    marginBottom: '10px',
  };

  const infoStyle = {
    color: '#555',
    fontSize: '18px',
    marginBottom: '5px',
  };

  return (
    isUserLoggedIn ?
    <Container>
      <Card style={cardStyle}>
        <section className="heading">
          <h1 style={greetingStyle}>YO {name ? name : ''}</h1>
          {/* <LinkParola /> */}
          <h3 style={infoStyle}>Email: {email}</h3>
          <h3 style={infoStyle}>Nume utilizator: {name ? name : ''}</h3>
          <h3 style={infoStyle}>Permisiuni: {role}</h3>
        </section>
      </Card>
    </Container>
    : null
  );
};
