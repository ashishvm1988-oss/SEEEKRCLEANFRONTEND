import { useState } from 'react';

// A password <input> with a show/hide toggle, wrapped in the same
// label + .field markup every other form field on these pages uses —
// people mistype passwords blind more often than any other field, so
// letting them check what they typed cuts down on failed submits.
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  minLength,
  required,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          minLength={minLength}
          required={required}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          // Keep this out of the tab order between the field and the
          // submit button — it's a convenience, not a stop on the way through.
          tabIndex={-1}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
