import { useLocation, useSearchParams } from "react-router-dom";

export function useToken(): string {
  const [qs] = useSearchParams();
  const location = useLocation();

  const stateToken = (location.state as any)?.token ?? "";
  const queryToken = qs.get("token") ?? "";
  const hashToken = new URLSearchParams((location.hash || "").replace(/^#/, "")).get("token") ?? "";
  
  return stateToken || queryToken || hashToken;
}