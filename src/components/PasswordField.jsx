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
          // type="password" is exempt from autocapitalize/autocorrect/spellcheck
          // by default in every mobile browser, but the moment "Show" flips
          // this to type="text" that exemption goes away — iOS/Android will
          // then auto-capitalize the first character as it's typed. That
          // silently changes the password being submitted while both the
          // "new" and "confirm" fields still match each other (since they're
          // typed the same way), so the mismatch only shows up later, as a
          // login failure with a password the user is sure is correct.
          // Setting these explicitly, regardless of visible/hidden state,
          // closes that off.
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
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
