interface InputProps {
  id?: string;
  name?: string;
  label?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  min?: number | string;
  step?: number | string;
  className?: string;
  containerClassName?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  readOnly?: boolean;
  autoComplete?: string;
  required?: boolean;
}

export function Input({ id, name, label, type = 'text', value, onChange, placeholder, error, maxLength, min, step, className = '', containerClassName = '', onKeyDown, onBlur, readOnly = false, autoComplete, required = false }: InputProps) {
  const errorId = id ? `${id}-error` : undefined;

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        step={step}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        readOnly={readOnly}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`${className} w-full bg-slate-850 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors ${
          error ? 'border-red-500/50' : 'border-slate-700'
        }`}
      />
      {error && <p id={errorId} role="alert" className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
