  import { useAppDispatch } from "../store/hooks";
  import { showSnackbar } from "../store/uiSlice";

  export function useNotifier() {
    const dispatch = useAppDispatch();
    return (message: string, severity: "success" | "warning" | "error" | "info" = "info") =>
      dispatch(showSnackbar({ message, severity }));
  }