const DEFAULT_FAILURE = "We couldn't submit your attendance. Please try again.";

export function getAttendanceErrorMessage(reason?: string, status?: number): string {
  switch (reason) {
    case 'DUPLICATE_ATTENDANCE':
      return 'This student has already been marked present.';
    case 'DUPLICATE_DEVICE_SUBMISSION':
      return 'This device has already submitted attendance.';
    case 'SESSION_CLOSED':
      return 'This session is closed and no longer accepts attendance.';
    case 'SESSION_NOT_FOUND':
      return 'We could not find this session. Please verify the QR code with the organizer.';
    case 'TOKEN_INVALID':
      return 'This attendance link is no longer valid. Please scan a fresh QR code.';
    case 'TOKEN_MISSING':
      return 'Attendance token missing. Open the form via the official QR code link.';
    case 'RATE_LIMIT':
      return 'Too many attempts in a short time. Please wait a few seconds and try again.';
    default:
      if (status === 429) {
        return 'Too many attempts in a short time. Please wait a few seconds and try again.';
      }
      return DEFAULT_FAILURE;
  }
}
