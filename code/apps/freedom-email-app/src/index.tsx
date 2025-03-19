import { init } from 'freedom-react-localization';
import ReactDOM from 'react-dom/client';

import { WebApp } from './components/WebApp.tsx';

const startWebApp = async (rootElem: HTMLElement | null) => {
  await init({ defaultLanguage: 'en', supportedLanguages: ['en'] });

  if (rootElem === null) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElem);
  root.render(<WebApp />);
};

startWebApp(document.getElementById('root'));
