import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Manager from './Manager';
import '../src/styles/page.css';

const host = document.getElementById('root');
if (!host) throw new Error('#root is missing from index.html');

createRoot(host).render(
  <StrictMode>
    <main className="page page--manager">
      <Manager />
    </main>
  </StrictMode>,
);
