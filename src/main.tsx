// Los estilos base van primero para que los de cada pantalla los puedan sobrescribir.
import './styles/tokens.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
