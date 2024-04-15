import express from 'express';
import { auth, requiresAuth } from 'express-openid-connect';

const app = express.Router();

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'eIJpx9UyvYKBlDqoADbangC6TAVBvY2yP4Q6yvnCWQb5R9zCy1bmNpIe74l7jYsl',
  baseURL: 'http://localhost:3000',
  clientID: 'BP8TDvCRTFM6FRTUAhkkBOM7nq4zUpkK',
  issuerBaseURL: 'https://dev-b5r5vy1463ezr6lm.eu.auth0.com',
};

// attach /login, /logout, and /callback routes to the baseURL
app.use(auth(config));



// check if user is authenticated
app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// protect /profile route
app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});



export default app;