import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SlateApp } from './app/SlateApp';
import { TurnFrame } from './ui/shell/turn';
import './styles/app.css';

const container = document.getElementById('root');
if (!container) throw new Error('SLATE couldn’t find its mount point.');

// Every screen, the start and the saves among them, inside the frame that puts back what a phone's turn moved. From
// 2026-10-23 (brief 23) to 2026-10-24 (brief 27) a phone held upright saw Rotate Your Phone To Play over it instead.
createRoot(container).render(
  <StrictMode>
    <TurnFrame>
      <SlateApp />
    </TurnFrame>
  </StrictMode>,
);
