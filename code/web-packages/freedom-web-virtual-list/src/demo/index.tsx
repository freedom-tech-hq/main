import ReactDOM from 'react-dom/client';

import { DemoApp } from './components/DemoApp.tsx';

const startWebApp = async (rootElem: HTMLElement | null) => {
  if (rootElem === null) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElem);
  root.render(<DemoApp />);
};

startWebApp(document.getElementById('root'));
