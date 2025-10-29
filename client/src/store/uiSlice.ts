import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  loading: boolean;
  error?: string | null;
  snackbar?: { message: string; severity?: "success" | "info" | "warning" | "error" } | null;
}

const initialState: UIState = { loading: false, error: null, snackbar: null };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null | undefined>) {
      state.error = action.payload ?? null;
    },
    showSnackbar(state, action: PayloadAction<UIState["snackbar"]>) {
      state.snackbar = action.payload ?? null;
    },
    clearSnackbar(state) {
      state.snackbar = null;
    },
  },
});

export const { setLoading, setError, showSnackbar, clearSnackbar } = uiSlice.actions;
export default uiSlice.reducer;
