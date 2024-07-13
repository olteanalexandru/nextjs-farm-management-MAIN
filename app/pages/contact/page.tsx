import React, { useRef } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import useUserState from './Components/UserState';
import sendEmail from './Components/SendEmail';

export default function Contact(): JSX.Element {
  const { user, setUser, email, setEmail } = useUserState();
  const form = useRef() as React.MutableRefObject<HTMLFormElement>;

  return (
    <Container className="text-center mt-5">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Form ref={form} onSubmit={sendEmail(form)}>
            <Form.Group controlId="formBasicName">
              <Form.Label><strong>Name</strong></Form.Label>
              <Form.Control type="text" name="user_name" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Enter your name" />
            </Form.Group>
            <Form.Group controlId="formBasicEmail">
              <Form.Label><strong>Email</strong></Form.Label>
              <Form.Control type="email" name="user_email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
              <Form.Text className="text-muted">
                We'll never share your email with anyone else.
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="formBasicMessage">
              <Form.Label><strong>Message</strong></Form.Label>
              <Form.Control as="textarea" rows={4} name="message" placeholder="Enter your message" />
            </Form.Group>
          
              <Button variant="primary" type="submit" className='mt-3'>Send</Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
