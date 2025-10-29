import { configureStore, type Middleware, isAnyOf } from "@reduxjs/toolkit"; // 1. isAnyOf'u import et
import uiReducer from "./uiSlice.ts";
import sessionReducer from "./sessionSlice.ts";
import themeReducer, { setMode, toggleMode } from "./themeSlice.ts";

import { logger as appLogger } from "../services/logger";

const reduxLoggerMiddleware: Middleware = () => (next) => (action) => {
  if (typeof action === 'object' && action !== null && 'type' in action) {
    const type = (action as { type: string }).type;
    try { appLogger.debug(`Redux Action: ${type}`); } catch {}
  }
  return next(action);
};

const themePersistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  if (isAnyOf(setMode, toggleMode)(action)) {
    const mode = store.getState().theme.mode;
    try {
      localStorage.setItem("qrc-mode", mode);
    } catch (e) {
      console.error("Failed to save theme mode to localStorage:", e);
    }
  }

  return result;
};

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    session: sessionReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware()
      .concat(reduxLoggerMiddleware)
      .concat(themePersistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;