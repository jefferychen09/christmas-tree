import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/great-vibes/latin-400.css'; // 花体字打包进网站，不从 Google Fonts 加载
import './index.css';
import App from './App';
import { LangProvider } from './i18n';
import { AuthProvider } from './auth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LangProvider>
  </StrictMode>,
);
