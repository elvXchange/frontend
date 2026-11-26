import { useId, useState, type InputHTMLAttributes, type Ref } from 'react';

export function AuthInput({
  inputRef,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  inputRef?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const [error, setError] = useState('');
  return (
    <>
      <input
        {...props}
        ref={inputRef}
        aria-invalid={!!error}
        aria-describedby={error ? id : undefined}
        onInvalid={(event) => setError(event.currentTarget.validationMessage)}
        onBlur={(event) => setError(event.currentTarget.validationMessage)}
        onChange={(event) => {
          if (error) setError(event.currentTarget.validationMessage);
          props.onChange?.(event);
        }}
      />
      {error && (
        <small id={id} className="text-danger">
          {error}
        </small>
      )}
    </>
  );
}
