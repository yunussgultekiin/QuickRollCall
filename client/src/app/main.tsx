import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import './index.css'
import App from './App.tsx'
import { makeTheme } from '../styles/theme'
import { Provider } from 'react-redux'
import { store } from '../store'
import { useAppSelector } from '../store/hooks.ts'

function ThemedApp() {
  const mode = useAppSelector((s) => s.theme.mode);
  const dyn = makeTheme(mode);
  return (
    <ThemeProvider theme={dyn}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  </StrictMode>,
)
