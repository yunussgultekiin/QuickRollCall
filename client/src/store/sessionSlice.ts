import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { SessionData } from "../services/api";

interface SessionState {
  current?: SessionData | null;
}

const initialState: SessionState = { current: null };

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SessionData | null | undefined>) {
      state.current = action.payload ?? null;
    },
  },
});

export const { setSession } = sessionSlice.actions;
export default sessionSlice.reducer;
