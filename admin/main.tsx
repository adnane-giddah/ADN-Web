import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DnaBackground from '../src/components/DnaBackground';
import Manager from './Manager';
import '../src/styles/page.css';

const host = document.getElementById('root');
if (!host) throw new Error('#root is missing from index.html');

createRoot(host).render(
  <StrictMode>
    <DnaBackground />
    <main className="page">
      <div className="widgets">
        <div className="widget-wide">
          <Manager />
        </div>
      </div>
    </main>
  </StrictMode>,
);
