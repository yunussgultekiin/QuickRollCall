  import { createSlice } from "@reduxjs/toolkit";
  import type { PayloadAction } from "@reduxjs/toolkit";

  export type Mode = "light" | "dark";

  const initialState: { mode: Mode } = {
    mode: (localStorage.getItem("qrc-mode") as Mode) || "light",
  };

  const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
      setMode(state, action: PayloadAction<Mode>) {
        state.mode = action.payload;
      },
      toggleMode(state) {
        state.mode = state.mode === "light" ? "dark" : "light";
      },
    },
  });

  export const { setMode, toggleMode } = themeSlice.actions;
  export default themeSlice.reducer;
