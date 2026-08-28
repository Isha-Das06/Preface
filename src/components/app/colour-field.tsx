"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A colour, chosen the way people actually choose colours.
 *
 * The swatch IS the control: clicking it opens the operating
 * system's own picker — wheel, eyedropper, recent colours, whatever
 * that platform gives you. This used to be a hex field with a
 * decorative square beside it, which asked a business to know its
 * brand colour in hexadecimal before it could set one.
 *
 * The hex field stays, because a brand guideline gives you `#1F6F4A`
 * and typing it is faster than hunting for it on a wheel. The two
 * are bound together: drag the wheel and the text follows, type a
 * valid hex and the swatch follows.
 *
 * One hidden input carries the value, so the whole thing still posts
 * with the form like any other field.
 */
export function ColourField({
  name,
  defaultValue,
  presets = [],
  ariaLabel,
}: {
  name: string;
  defaultValue: string;
  presets?: { label: string; value: string }[];
  ariaLabel: string;
}) {
  const [value, setValue] = useState(normalise(defaultValue));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/*
          The native input is the swatch rather than sitting next to
          one: a colour control you cannot click is the thing being
          fixed here. Chrome draws its own bevel and padding on
          type=color, so the inset resets strip it back to a plain
          block of colour.
        */}
        <input
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={ariaLabel}
          className={cn(
            "size-10 shrink-0 cursor-pointer rounded-md border border-ink-200 bg-transparent p-0",
            "[&::-webkit-color-swatch]:rounded-[5px] [&::-webkit-color-swatch]:border-none",
            "[&::-webkit-color-swatch-wrapper]:p-0",
            "[&::-moz-color-swatch]:rounded-[5px] [&::-moz-color-swatch]:border-none",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
          )}
        />

        <input
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            // Let them type freely; only push a complete colour into
            // the swatch, or it jumps around mid-keystroke.
            setValue(next.startsWith("#") || next === "" ? next : `#${next}`);
          }}
          onBlur={() => setValue(normalise(value))}
          spellCheck={false}
          aria-label={`${ariaLabel} hex`}
          className="h-10 w-[130px] rounded-md border border-ink-200 bg-surface px-3 font-mono text-sm text-ink-900 uppercase focus:border-accent-600 focus:shadow-(--focus-ring) focus:outline-none"
        />
      </div>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setValue(p.value)}
              title={p.label}
              aria-label={p.label}
              className={cn(
                "size-7 rounded-md border transition-transform hover:scale-110",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus)",
                value.toLowerCase() === p.value.toLowerCase()
                  ? "border-accent-600 ring-2 ring-accent-300"
                  : "border-ink-200",
              )}
              style={{ background: p.value }}
            />
          ))}
        </div>
      )}

      <input type="hidden" name={name} value={normalise(value)} />
    </div>
  );
}

/** Whatever they typed, coerced to something the form can store. */
function normalise(raw: string): string {
  const v = (raw || "").trim().toLowerCase();
  const hex = v.startsWith("#") ? v : `#${v}`;
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return "#000000";
}
