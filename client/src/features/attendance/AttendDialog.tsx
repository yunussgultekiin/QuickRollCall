import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, CircularProgress, Divider, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSessionValidation } from '../../hooks/useSessionValidation';
import { attendanceApi } from '../../services/api';
import { AttendForm,type FormValues } from './AttendForm';

const ValidationLoadingView = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
    <CircularProgress aria-label="Validating" />
  </Box>
);

const ValidationErrorView = ({ message }: { message: string }) => (
  <Typography color="error">{message}</Typography>
);

const SuccessView = ({ sessionName, sessionId }: { sessionName?: string | null, sessionId?: string }) => (
  <Box sx={{ my: 2 }}>
    <Typography variant="h6" sx={{ mb: 1 }}>Success</Typography>
    <Typography variant="body2">
      Recorded for <strong>{sessionName || sessionId}</strong>.
    </Typography>
  </Box>
);

const AttendanceFormView = ({ sessionName, sessionId, fail, onSubmit, isSubmitting }: {
  sessionName?: string | null;
  sessionId?: string;
  fail: string | null;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}) => (
  <>
    <Typography variant="body2" sx={{ mb: 2 }}>
      Session: <strong>{sessionName || sessionId}</strong>
    </Typography>
    {fail && <Typography color="error" sx={{ mb: 1 }}>{fail}</Typography>}
    <AttendForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
  </>
);

interface Props { open: boolean; onClose: () => void; sessionId?: string; token?: string; }

export function AttendDialog({ open, onClose, sessionId, token }: Props) {
  const { validated, sessionName, error } = useSessionValidation(sessionId, token);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

  useEffect(() => { if (!open) { setSubmitting(false); setSuccess(false); setFail(null); } }, [open]);

  const onSubmit = async (values: FormValues) => {
    if (!sessionId || !token) return;
    setSubmitting(true); setFail(null);
    try { 
      await attendanceApi.submit(sessionId, { token, ...values }); setSuccess(true); 
    } catch (e: any) { 
       setFail(e?.response?.data?.message || 'Attendance failed'); 
    }finally { 
      setSubmitting(false); 
    }
  };

  const renderBody = () => {
    if (error) return <ValidationErrorView message={error.message} />;
    if (!validated) return <ValidationLoadingView />;
    if (success) return <SuccessView sessionName={sessionName} sessionId={sessionId} />;
    
    return <AttendanceFormView 
      sessionName={sessionName} 
      sessionId={sessionId} 
      fail={fail} 
      onSubmit={onSubmit} 
      isSubmitting={submitting} 
    />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="attend-title">
      <DialogTitle id="attend-title" sx={{ pr: 6 }}>
        Student / Participant
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {renderBody()}
        {!success && !error && validated && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="caption" color="text.secondary">Close when finished.</Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}