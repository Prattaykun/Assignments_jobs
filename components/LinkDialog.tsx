"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Props = {
  open: boolean;
  initialUrl?: string;
  initialText?: string;
  hasSelection: boolean;
  onClose: () => void;
  onApply: (url: string, text?: string) => void;
  onRemove: () => void;
};

export function LinkDialog({
  open,
  initialUrl = "",
  initialText = "",
  hasSelection,
  onClose,
  onApply,
  onRemove,
}: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setUrl(initialUrl || "https://");
    setText(initialText);
    const t = window.setTimeout(() => {
      urlRef.current?.focus();
      urlRef.current?.select();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, initialUrl, initialText]);

  if (!open) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || trimmed === "https://" || trimmed === "http://") return;
    onApply(trimmed, hasSelection ? undefined : text.trim() || undefined);
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Insert link"
      onClick={onClose}
    >
      <form
        className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-[#dadce0] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed]">
          <h2 className="text-lg font-semibold text-[#202124]">Insert link</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm hover:bg-[#f1f3f4]"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {!hasSelection && (
            <label className="block text-sm">
              <span className="text-[#5f6368]">Text</span>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Link text"
                className="mt-1 w-full rounded-lg border border-[#dadce0] px-3 py-2 text-[#202124] outline-none focus:ring-2 focus:ring-[#1a73e8]"
              />
            </label>
          )}

          <label className="block text-sm">
            <span className="text-[#5f6368]">Link</span>
            <input
              ref={urlRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              autoComplete="url"
              className="mt-1 w-full rounded-lg border border-[#dadce0] px-3 py-2 text-[#202124] outline-none focus:ring-2 focus:ring-[#1a73e8]"
            />
          </label>

          {hasSelection && (
            <p className="text-xs text-[#5f6368]">
              The selected text will become the hyperlink.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-[#e8eaed] bg-[#f8f9fa]">
          <button
            type="button"
            onClick={onRemove}
            disabled={!initialUrl}
            className="text-sm text-[#c5221f] px-3 py-1.5 rounded-lg hover:bg-[#fce8e6] disabled:opacity-40"
          >
            Remove link
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-1.5 rounded-full hover:bg-[#e8eaed]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm px-4 py-1.5 rounded-full bg-[#1a73e8] text-white font-medium hover:bg-[#1557b0]"
            >
              Apply
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
