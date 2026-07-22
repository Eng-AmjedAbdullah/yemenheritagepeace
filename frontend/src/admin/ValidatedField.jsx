import { useId } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ValidatedField({
  label,
  value,
  onChange,
  onBlur,
  error = '',
  touched = false,
  required = false,
  type = 'text',
  as = 'input',
  options = [],
  dir,
  placeholder = '',
  rows = 4,
  disabled = false,
  hint = '',
  min,
  max,
  accept,
  multiple,
}) {
  const fieldId = useId()
  const feedbackId = `${fieldId}-feedback`
  const showError = touched && Boolean(error)
  const showSuccess =
    touched && !error && String(value ?? '').trim().length > 0

  const commonProps = {
    value: value ?? '',
    onChange: (event) => onChange?.(event.target.value),
    onBlur,
    disabled,
    dir,
    required,
    placeholder,
    id: fieldId,
    'aria-invalid': showError ? 'true' : 'false',
    'aria-describedby': showError || hint ? feedbackId : undefined,
    className: `input-field ${showError || showSuccess ? (dir === 'ltr' ? 'pr-10' : 'pl-10') : ''} ${
      showError
        ? 'border-red-400 ring-4 ring-red-50 focus:border-red-500 focus:ring-red-100'
        : showSuccess
          ? 'border-green-400 focus:border-green-500 focus:ring-green-100'
          : ''
    }`,
  }

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="ms-1 text-red-500">*</span>}
      </label>

      <div className="relative">
        {as === 'textarea' ? (
          <textarea {...commonProps} rows={rows} />
        ) : as === 'select' ? (
          <select {...commonProps}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'file' ? (
          <input
            type="file"
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            dir={dir}
            required={required}
            accept={accept}
            multiple={multiple}
            id={fieldId}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={showError || hint ? feedbackId : undefined}
            className={`input-field file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary ${
              showError ? 'border-red-400 ring-4 ring-red-50' : ''
            }`}
          />
        ) : (
          <input
            {...commonProps}
            type={type}
            min={min}
            max={max}
          />
        )}

        {type !== 'file' && (showError || showSuccess) && (
          <span
            className={`pointer-events-none absolute inset-y-0 flex items-center ${
              dir === 'ltr' ? 'right-3' : 'left-3'
            }`}
          >
            {showError ? (
              <AlertCircle size={17} className="text-red-500" />
            ) : (
              <CheckCircle2 size={17} className="text-green-500" />
            )}
          </span>
        )}
      </div>

      {showError ? (
        <p id={feedbackId} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle size={13} />
          {error}
        </p>
      ) : hint ? (
        <p id={feedbackId} className="mt-1.5 text-xs leading-5 text-gray-400">{hint}</p>
      ) : null}
    </div>
  )
}
