import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SlateApp } from './app/SlateApp';
import { TurnFrame } from './ui/shell/turn';
import './styles/app.css';

const container = document.getElementById('root');
if (!container) throw new Error('SLATE couldn’t find its mount point.');

// Every screen, the start and the saves among them, inside the frame a phone held upright covers with Rotate Your Phone
// To Play (from 2026-10-23, the owner's brief 23): SLATE is played in landscape on a phone.
createRoot(container).render(
  <StrictMode>
    <TurnFrame>
      <SlateApp />
    </TurnFrame>
  </StrictMode>,
);
