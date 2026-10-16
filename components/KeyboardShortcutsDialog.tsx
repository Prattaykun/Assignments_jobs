"use client";

type Props = {
  open: boolean;
  onClose: () => void;
};

const GROUPS: { title: string; rows: { keys: string; label: string }[] }[] = [
  {
    title: "Common",
    rows: [
      { keys: "Ctrl+S", label: "Save" },
      { keys: "Ctrl+P", label: "Print" },
      { keys: "Ctrl+Z", label: "Undo" },
      { keys: "Ctrl+Y", label: "Redo" },
      { keys: "Ctrl+/", label: "Keyboard shortcuts" },
    ],
  },
  {
    title: "Formatting",
    rows: [
      { keys: "Ctrl+B", label: "Bold" },
      { keys: "Ctrl+I", label: "Italic" },
      { keys: "Ctrl+U", label: "Underline" },
      { keys: "Ctrl+Shift+X", label: "Strikethrough" },
      { keys: "Ctrl+K", label: "Insert link" },
      { keys: "Ctrl+=", label: "Subscript" },
      { keys: "Ctrl+Shift+=", label: "Superscript" },
      { keys: "Ctrl+L", label: "Align left" },
      { keys: "Ctrl+E", label: "Align center" },
      { keys: "Ctrl+R", label: "Align right" },
      { keys: "Ctrl+J", label: "Justify" },
    ],
  },
  {
    title: "Clipboard",
    rows: [
      { keys: "Ctrl+X", label: "Cut" },
      { keys: "Ctrl+C", label: "Copy" },
      { keys: "Ctrl+V", label: "Paste" },
      { keys: "Ctrl+A", label: "Select all" },
    ],
  },
];

export function KeyboardShortcutsDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-auto rounded-xl bg-white shadow-2xl border border-[#dadce0]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed]">
          <h2 className="text-lg font-semibold text-[#202124]">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm hover:bg-[#f1f3f4]"
          >
            Close
          </button>
        </div>
        <div className="px-5 py-4 space-y-5">
          <p className="text-xs text-[#5f6368]">
            On Mac, use ⌘ instead of Ctrl.
          </p>
          {GROUPS.map((g) => (
            <section key={g.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#5f6368] mb-2">
                {g.title}
              </h3>
              <ul className="space-y-1.5">
                {g.rows.map((r) => (
                  <li
                    key={r.keys}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-[#202124]">{r.label}</span>
                    <kbd className="font-mono text-xs text-[#5f6368] bg-[#f1f3f4] border border-[#dadce0] rounded px-1.5 py-0.5">
                      {r.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
