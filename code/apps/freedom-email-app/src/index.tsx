import ReactDOM from 'react-dom/client';

import { WebApp } from './components/WebApp.tsx';

const startWebApp = (rootElem: HTMLElement | null) => {
  if (rootElem === null) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElem);
  root.render(<WebApp />);
};

startWebApp(document.getElementById('root'));
