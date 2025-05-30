import './polyfills.ts';
import './utils/fwd-env.ts';

import { buildMode } from 'freedom-contexts';
import { init } from 'freedom-react-localization';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { WebApp } from './components/bootstrapping/WebApp.tsx';

const startWebApp = async (rootElem: HTMLElement | null) => {
  await init({ defaultLanguage: 'en', supportedLanguages: ['en'] });

  if (rootElem === null) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElem);
  root.render(<WebApp />);
};

startWebApp(document.getElementById('root'));

console.log('Build mode', buildMode);
console.log('Loaded index', process.env.FREEDOM_BUILD_UUID);

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}
