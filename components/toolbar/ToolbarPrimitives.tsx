"use client";

import type { ReactNode } from "react";

export function ToolbarButton({
  active = false,
  disabled = false,
  title,
  shortcut,
  onClick,
  children,
  ariaLabel,
}: {
  active?: boolean;
  disabled?: boolean;
  title?: string;
  shortcut?: string;
  onClick?: () => void;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const tip = shortcut ? `${title} (${shortcut})` : title;

  return (
    <button
      type="button"
      title={tip}
      aria-label={ariaLabel || title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={disabled ? undefined : onClick}
      className={[
        "inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-100",
        "text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]",
        active
          ? "bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#e8f0fe] hover:text-[#1a73e8]"
          : "",
        disabled ? "opacity-30 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function ToolbarGroup({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-0.5 px-2.5 border-r border-[#dadce0] last:border-r-0 first:pl-0"
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function ToolbarSelect({
  value,
  onChange,
  disabled,
  options,
  width,
  title,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  options: { value: string; label: string }[];
  width?: number;
  title?: string;
}) {
  return (
    <select
      title={title}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      className="h-8 rounded-md border border-transparent bg-transparent px-1.5 text-sm text-[#202124] hover:bg-[#f1f3f4] focus:bg-white focus:border-[#1a73e8] outline-none disabled:opacity-40"
      style={{ width: width ?? 96 }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ColorSwatchButton({
  title,
  color,
  onPick,
  disabled,
  icon,
}: {
  title: string;
  color: string;
  onPick: (color: string) => void;
  disabled?: boolean;
  icon: ReactNode;
}) {
  return (
    <label
      title={title}
      className={[
        "relative inline-flex flex-col items-center justify-center w-8 h-8 rounded-md cursor-pointer",
        "text-[#5f6368] hover:bg-[#f1f3f4]",
        disabled ? "opacity-30 pointer-events-none" : "",
      ].join(" ")}
    >
      <span className="leading-none">{icon}</span>
      <span
        className="absolute bottom-1 left-1.5 right-1.5 h-[3px] rounded-sm"
        style={{ background: color }}
      />
      <input
        type="color"
        className="absolute inset-0 opacity-0 cursor-pointer"
        value={color}
        disabled={disabled}
        onChange={(e) => onPick(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </label>
  );
}
