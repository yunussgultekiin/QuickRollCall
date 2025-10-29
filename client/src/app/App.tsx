import { BrowserRouter } from "react-router-dom";
import React, { Suspense, useEffect, useRef } from "react";
import { Box, CircularProgress, GlobalStyles } from "@mui/material";
import { AppRoutes } from "./Routes";
import AppShell from "./AppShell";
import { wireFrontendLogging, logger } from "../services/logger";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    try {
      logger.error('ErrorBoundary caught', { error: { name: error?.name, message: error?.message, stack: error?.stack }, info });
    } catch {}
  }
  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env?.MODE !== 'production';
      const e = this.state.error;
      return (
        <Box component="main" role="main" sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100dvh", p: 2 }}>
          <div>
            <div>Something went wrong while loading this page.</div>
            {isDev && (
              <pre style={{ marginTop: 12, maxWidth: 800, whiteSpace: 'pre-wrap' }}>
                {e?.name ? `${e.name}: ${e.message}` : String(e)}
                {e?.stack ? `\n\n${e.stack}` : ''}
              </pre>
            )}
          </div>
        </Box>
      );
    }
    return this.props.children as any;
  }
}

function App() {
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return; 
    bootedRef.current = true;
    wireFrontendLogging();
  }, []);
  return (
    <BrowserRouter>
      <GlobalStyles
        styles={{
          html: { overflow: "hidden", height: "100%" },
          body: { overflow: "hidden", height: "100%" },
          "#root": { height: "100%" },
          "*": { scrollbarWidth: "none" },
          "*::-webkit-scrollbar": { display: "none" },
          "*::-webkit-scrollbar-thumb": { backgroundColor: "transparent" },
          "@media (max-width: 900px)": {
            html: { overflowY: "auto", height: "auto" },
            body: { overflowY: "auto", height: "auto" },
            "#root": { height: "auto", minHeight: "100dvh" },
          },
        }}
      />
      <ErrorBoundary>
        <Suspense fallback={<FallbackSpinner /> }>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;

function FallbackSpinner() {
  return (
    <Box component="main" role="main" aria-busy sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: { xs: "100dvh", md: "100dvh" } }}>
      <CircularProgress aria-label="Loading content" />
    </Box>
  );
}
