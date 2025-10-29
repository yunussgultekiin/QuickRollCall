import { useEffect, useState } from "react";
import { attendanceApi } from "../services/api";
import { ErrorReasons, type ValidatedError } from "../types/errors";
import { getAttendanceErrorMessage } from "../features/attendance/messages";

export function useSessionValidation(sessionId?: string, token?: string) {
  const [validated, setValidated] = useState(false);
  const [sessionName, setSessionName] = useState<string | undefined>(undefined);
  const [error, setError] = useState<ValidatedError | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!sessionId || !token) {
        if (mounted) {
          setValidated(false);
          setError(null);
        }
        return;
      }

      try {
        const data = await attendanceApi.validate(sessionId, token, { silent: true });
        if (!data?.ok) {
          if (mounted) {
            setError({
              reason: ErrorReasons.TOKEN_INVALID,
              message: getAttendanceErrorMessage(ErrorReasons.TOKEN_INVALID),
            });
            setValidated(false);
          }
          return;
        }
        if (mounted) setSessionName(data.sessionName);
      } catch (err: any) {
        const reason = err?.response?.data?.reason as ValidatedError["reason"] | undefined;
        const status = err?.response?.status as number | undefined;
        if (!mounted) return;
        if (reason === ErrorReasons.SESSION_NOT_FOUND) {
          setError({ reason: ErrorReasons.SESSION_NOT_FOUND, message: getAttendanceErrorMessage(reason) });
        } else if (reason === ErrorReasons.SESSION_CLOSED) {
          setError({ reason: ErrorReasons.SESSION_CLOSED, message: getAttendanceErrorMessage(reason) });
        } else if (reason === ErrorReasons.TOKEN_INVALID) {
          setError({ reason: ErrorReasons.TOKEN_INVALID, message: getAttendanceErrorMessage(reason) });
        } else if (status === 429) {
          setError({ reason: ErrorReasons.RATE_LIMIT, message: getAttendanceErrorMessage(ErrorReasons.RATE_LIMIT, status) });
        } else {
          setError({ reason: ErrorReasons.NETWORK_ERROR, message: getAttendanceErrorMessage(undefined) });
        }
        return;
      }

      if (mounted) {
        setValidated(true);
        setError(null);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [sessionId, token]);

  return { validated, sessionName, error };
}