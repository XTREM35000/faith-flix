import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';

interface EmailInputWithSuffixProps {
  email: string;
  onEmailChange: (email: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  error?: string;
}

/** Format email complet (type="email") — ne force plus de domaine ni de suffixe. */
const EmailInputWithSuffix: React.FC<EmailInputWithSuffixProps> = ({
  email,
  onEmailChange,
  onValidationChange,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (value: string) => {
    if (!value.trim()) {
      onValidationChange?.(false);
      return;
    }
    const el = inputRef.current;
    if (el && typeof el.checkValidity === 'function') {
      onValidationChange?.(el.checkValidity());
      return;
    }
    onValidationChange?.(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));
  };

  const handleChange = (value: string) => {
    onEmailChange(value);
    validate(value);
  };

  const handleBlur = () => {
    const t = email.trim();
    if (t !== email) {
      onEmailChange(t);
      validate(t);
    } else {
      validate(email);
    }
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          ref={inputRef}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
          aria-invalid={Boolean(error)}
        />
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default EmailInputWithSuffix;
