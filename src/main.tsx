import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SlateApp } from './app/SlateApp';
import './styles/app.css';

const container = document.getElementById('root');
if (!container) throw new Error('SLATE couldn’t find its mount point.');

createRoot(container).render(
  <StrictMode>
    <SlateApp />
  </StrictMode>,
);
