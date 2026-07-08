import React, { useState } from 'react'
import clsx from 'clsx'

/**
 * @typedef {Object} InputProps
 * @property {string} [label] - Input label displayed above the field
 * @property {string} name - Name attribute of input
 * @property {string} [type] - HTML input type (text, email, password, number, tel, date etc.)
 * @property {string} [placeholder] - Placeholder text
 * @property {string} [value] - Bound state value
 * @property {(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void} [onChange] - Input edit callback
 * @property {string} [error] - Validation error message to display
 * @property {string} [helperText] - Subtext instruction displayed below field
 * @property {boolean} [disabled] - Disables interaction and dims opacity
 * @property {number} [maxLength] - Max length constraint
 * @property {React.ReactNode} [prefixIcon] - Prefix icon aligned left
 * @property {React.ReactNode} [suffixIcon] - Suffix icon aligned right
 * @property {boolean} [textarea] - Render textarea variant
 * @property {boolean} [select] - Render select variant
 * @property {string} [id] - Unique element ID
 */

/**
 * Troopp Common Form Input Component.
 */
const Input = React.forwardRef(({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  maxLength,
  prefixIcon = null,
  suffixIcon = null,
  textarea = false,
  select = false,
  id,
  children, // options for select
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const isPassword = type === 'password'
  const isSelect = select || type === 'select'
  const isTextarea = textarea || type === 'textarea'
  const currentType = isPassword && showPassword ? 'text' : type

  const togglePasswordVisibility = (e) => {
    e.preventDefault()
    setShowPassword((prev) => !prev)
  }

  const hasIcon = !!prefixIcon
  const isError = !!error

  const inputClass = clsx(
    'w-full bg-surface border rounded-md text-base text-text-primary outline-none transition-[border-color,box-shadow] duration-150',
    isTextarea ? 'py-3.5 px-4 min-h-[120px] resize-y' : 'h-[52px]',
    !isTextarea && (hasIcon ? 'pl-12' : 'px-4'),
    isSelect && 'appearance-none pr-11 bg-no-repeat',
    isError 
      ? 'border-danger focus:border-danger' 
      : 'border-border focus:border-primary',
    disabled && 'opacity-50 cursor-not-allowed bg-border/10 text-text-disabled'
  )

  const inputStyle = {
    outline: 'none',
    borderWidth: '1.5px',
    ...(isSelect && {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
      backgroundPosition: 'right 14px center'
    }),
    ...(isFocused && !isError && {
      boxShadow: 'var(--shadow-glow)',
      borderColor: 'var(--color-primary)'
    }),
    ...(isFocused && isError && {
      boxShadow: '0 0 0 3px rgba(220,38,38,0.12)',
      borderColor: 'var(--color-danger)'
    })
  }

  return (
    <div className="flex flex-col w-full text-left relative">
      {/* Label */}
      {label && (
        <label
          htmlFor={id || name}
          className="block text-[13px] font-semibold text-text-secondary mb-1.5 select-none"
        >
          {label}
        </label>
      )}

      {/* Input container wrapper */}
      <div className="relative flex items-center w-full">
        {/* Prefix Icon */}
        {prefixIcon && (
          <span 
            className="absolute left-[14px] text-text-secondary flex items-center justify-center pointer-events-none w-5 h-5"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            aria-hidden="true"
          >
            {prefixIcon}
          </span>
        )}

        {/* Input Elements */}
        {isTextarea ? (
          <textarea
            ref={ref}
            id={id || name}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            maxLength={maxLength}
            className={inputClass}
            style={inputStyle}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        ) : isSelect ? (
          <select
            ref={ref}
            id={id || name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={inputClass}
            style={inputStyle}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          >
            {children}
          </select>
        ) : (
          <input
            ref={ref}
            id={id || name}
            name={name}
            type={currentType}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            maxLength={maxLength}
            className={inputClass}
            style={inputStyle}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        )}

        {/* Suffix Password toggler or custom suffix icon */}
        {isPassword && !disabled && !isSelect && !isTextarea && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3.5 text-text-secondary hover:text-text-primary text-xs font-semibold focus:outline-none select-none z-10 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'HIDE' : 'SHOW'}
          </button>
        )}
        {!isPassword && suffixIcon && !isSelect && !isTextarea && (
          <span className="absolute right-3.5 text-text-secondary flex items-center justify-center pointer-events-none z-10" aria-hidden="true">
            {suffixIcon}
          </span>
        )}
      </div>

      {/* Sub-text information or Errors */}
      {isError ? (
        <div className="text-[12px] text-danger mt-1.5 flex gap-1 items-center select-none font-semibold" role="alert">
          <svg className="w-4 h-4 text-danger flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[12px] text-text-secondary mt-1.5 select-none">{helperText}</p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
export { Input }
