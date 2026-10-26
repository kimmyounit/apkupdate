import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cegah pinch-to-zoom multi-touch pada perangkat mobile
if (typeof window !== 'undefined') {
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });
}

createRoot(document.getElementById('root')!).render(<App />);
