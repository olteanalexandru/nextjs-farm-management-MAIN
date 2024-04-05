"use client"
//@ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

import { useGlobalContext } from '../../Context/UserStore';

export default function Contact(): JSX.Element {
  const { data  } = useGlobalContext();
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (data) {
      const user = data;
      setUser(user.name);
      setEmail(user.email);
    }
  }, [data]);

  const form = useRef() as React.MutableRefObject<HTMLFormElement>;

  const sendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    emailjs
      .sendForm('service_ynv83op', 'template_3oljtxo', form.current, '92Cb78cmp5MUyYktO')
      .then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );
  };

  return (
    <Container className="text-center mt-5">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Form ref={form} onSubmit={sendEmail}>
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
