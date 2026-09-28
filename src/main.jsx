import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import Atmosphere from './layout/Atmosphere.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Atmosphere />
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
