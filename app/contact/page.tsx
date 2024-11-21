"use client";

import React, { useRef } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import useUserState from './Components/UserState';
import sendEmail from './Components/SendEmail';
import { useTranslations } from 'next-intl';

export default function Contact(): JSX.Element {
  const { user, setUser, email, setEmail } = useUserState();
  const form = useRef() as React.MutableRefObject<HTMLFormElement>;

  const t = useTranslations('Contact');

  return (
    <Container className="text-center mt-5">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Form ref={form} onSubmit={sendEmail(form)}>
            <Form.Group controlId="formBasicName">
              <Form.Label><strong>{t('Name')}</strong></Form.Label>
              <Form.Control type="text" name="user_name" value={user} onChange={(e) => setUser(e.target.value)} placeholder={t('Enter your name')} />
            </Form.Group>
            <Form.Group controlId="formBasicEmail">
              <Form.Label><strong>{t('Email')}</strong></Form.Label>
              <Form.Control type="email" name="user_email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('Enter your email')} />
              <Form.Text className="text-muted">
                {t("We'll never share your email with anyone else.")}
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="formBasicMessage">
              <Form.Label><strong>{t('Message')}</strong></Form.Label>
              <Form.Control as="textarea" rows={4} name="message" placeholder={t('Enter your message')} />
            </Form.Group>
          
              <Button variant="primary" type="submit" className='mt-3'>{t('Send')}</Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
