/**
 * Form field component with real-time validation
 */

import { useState, useEffect } from 'react';
import { ValidationRule, validateField } from '@/lib/utils/form-validation';

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rules?: ValidationRule[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
  touched?: boolean;
}

export default function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  rules = [],
  placeholder,
  required = false,
  className = '',
  error: externalError,
  touched: externalTouched,
}: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (touched || externalTouched) {
      const validationError = validateField(value, rules);
      setError(validationError);
    }
  }, [value, rules, touched, externalTouched]);

  const handleBlur = () => {
    setTouched(true);
    if (onBlur) {
      onBlur();
    }
    const validationError = validateField(value, rules);
    setError(validationError);
  };

  const displayError = externalError || error;
  const isTouched = externalTouched !== undefined ? externalTouched : touched;
  const showError = isTouched && displayError;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
          showError
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300 focus:ring-indigo-500'
        } ${className}`}
      />
      {showError && (
        <p className="mt-1 text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
}
