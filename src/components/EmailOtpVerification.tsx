import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailOtpVerificationProps {
  email: string;
  userId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  className?: string;
}

export const EmailOtpVerification: React.FC<EmailOtpVerificationProps> = ({
  email,
  userId,
  onSuccess,
  onCancel,
  className = '',
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [expiryRemaining, setExpiryRemaining] = useState<number | null>(null);
  const expiryTimerRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.functions.invoke('send-email-otp', {
        body: { email, user_id: userId },
      });
      if (error) throw error;
      setMessage('Code envoyé ! Vérifiez votre boîte mail.');
      setResendCooldown(60);
      // Mark expiry client-side (15 minutes) so we can show a countdown
      setExpiryRemaining(15 * 60);
      // clear previous timers if any
      if (expiryTimerRef.current) window.clearInterval(expiryTimerRef.current);
      expiryTimerRef.current = window.setInterval(() => {
        setExpiryRemaining(prev => {
          if (!prev || prev <= 1) {
            if (expiryTimerRef.current) {
              window.clearInterval(expiryTimerRef.current);
              expiryTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 4) {
      setError('Code à 4 chiffres requis');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { email, code: otpCode },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Code invalide');

      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // cooldown timer for resend button
    if (resendCooldown <= 0) return;
    cooldownTimerRef.current = window.setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            window.clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
    return () => {
      if (cooldownTimerRef.current) {
        window.clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, [resendCooldown]);

  useEffect(() => {
    // send OTP on mount
    sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      // cleanup timers on unmount
      if (expiryTimerRef.current) {
        window.clearInterval(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
      if (cooldownTimerRef.current) {
        window.clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className={`space-y-4 ${className}`}
    >
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Un code à 4 chiffres a été envoyé à <strong>{email}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          Valable 15 minutes {expiryRemaining !== null && expiryRemaining > 0 && (
            <span> - expire dans {Math.floor(expiryRemaining / 60)}:{String(expiryRemaining % 60).padStart(2, '0')}</span>
          )}
        </p>
      </div>

      <Input
        type="text"
        placeholder="0000"
        maxLength={4}
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
        className="text-center text-2xl tracking-widest font-mono"
        disabled={loading}
      />

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      {message && <p className="text-sm text-green-600 text-center">{message}</p>}

      <Button onClick={verifyOtp} disabled={loading || otpCode.length !== 4} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {otpCode.length === 4 ? 'Vérifier et activer' : 'Entrez le code reçu'}
      </Button>

      <div className="text-center">
        <button
          onClick={sendOtp}
          disabled={resendCooldown > 0 || loading}
          className="text-sm text-primary underline disabled:opacity-50"
        >
          {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
        </button>
      </div>

      {onCancel && (
        <Button variant="ghost" onClick={onCancel} className="w-full">
          Annuler
        </Button>
      )}
    </motion.div>
  );
};

export default EmailOtpVerification;
