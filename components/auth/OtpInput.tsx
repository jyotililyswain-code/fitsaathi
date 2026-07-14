"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

export function OtpInput({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");

  function setDigit(index: number, nextValue: string) {
    const numeric = nextValue.replace(/\D/g, "");
    if (numeric.length > 1) return fillCode(numeric, index);
    const next = [...digits];
    next[index] = numeric.slice(-1);
    onChange(next.join("").slice(0, 6));
    if (numeric && index < 5) inputs.current[index + 1]?.focus();
  }

  function fillCode(raw: string, start = 0) {
    const numeric = raw.replace(/\D/g, "").slice(0, 6 - start);
    if (!numeric) return;
    const next = [...digits];
    for (let offset = 0; offset < numeric.length; offset += 1) next[start + offset] = numeric[offset];
    onChange(next.join("").slice(0, 6));
    inputs.current[Math.min(start + numeric.length, 5)]?.focus();
  }

  function keyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...digits];
      if (next[index]) next[index] = "";
      else if (index > 0) {
        next[index - 1] = "";
        inputs.current[index - 1]?.focus();
      }
      onChange(next.join(""));
    }
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) inputs.current[index + 1]?.focus();
  }

  function paste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    fillCode(event.clipboardData.getData("text"), 0);
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Six-digit email verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { inputs.current[index] = element; }}
          value={digit}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => keyDown(index, event)}
          onPaste={paste}
          onFocus={(event) => event.currentTarget.select()}
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={index === 0}
          maxLength={1}
          aria-label={`Verification code digit ${index + 1}`}
          className="focus-ring h-14 w-11 rounded-xl border border-white/15 bg-ink text-center text-2xl font-bold text-white disabled:opacity-50 sm:h-16 sm:w-14"
        />
      ))}
    </div>
  );
}
