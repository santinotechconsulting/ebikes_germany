import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Maps Platform Case A: Early global quota & auth failure trap
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

const originalGmAuthFailure = window.gm_authFailure;
window.gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  if (typeof originalGmAuthFailure === 'function') {
    originalGmAuthFailure();
  }
};

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const joined = args.map((a) => String(a)).join(' ');
  if (
    joined.includes('OverQuotaMapError') ||
    joined.includes('QuotaExceeded') ||
    joined.includes('RefererNotAllowedMapError') ||
    joined.includes('ApiNotActivatedMapError')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(<App />);
