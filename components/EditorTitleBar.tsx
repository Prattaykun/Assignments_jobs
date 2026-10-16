"use client";

import Link from "next/link";
import { DocLogo } from "./toolbar/icons";
import type { PresencePeer } from "@/hooks/useDocumentPresence";

type Props = {
  title: string;
  onTitleChange: (title: string) => void;
  onTitleBlur: () => void;
  canEdit: boolean;
  statusLabel: string;
  accessLabel: string;
  isOwner: boolean;
  onShare: () => void;
  onSaveNow: () => void;
  onDelete?: () => void;
  onExportPdf?: () => void;
  exportingPdf?: boolean;
  peers?: PresencePeer[];
};

export function EditorTitleBar({
  title,
  onTitleChange,
  onTitleBlur,
  canEdit,
  statusLabel,
  accessLabel,
  isOwner,
  onShare,
  onSaveNow,
  onDelete,
  onExportPdf,
  exportingPdf,
  peers = [],
}: Props) {
  return (
    <div
      className="flex items-stretch bg-[#eef1f5] text-[#1f2937] pt-2 pb-1"
      data-testid="title-bar"
      onMouseDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (!["INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(tag)) {
          e.preventDefault();
        }
      }}
    >
      <div className="flex items-center flex-shrink-0 pl-3 pr-1">
        <Link
          href="/documents"
          className="flex items-center"
          title="Back to documents"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DocLogo />
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 min-w-0 py-1 overflow-hidden">
        <div className="flex items-center gap-2 px-1 min-w-0 flex-wrap">
          <input
            value={title}
            disabled={!canEdit}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-base font-normal text-[#1f2937] bg-transparent border-0 outline-none px-2 py-0 rounded min-w-[100px] max-w-[360px] hover:bg-[#f1f3f4] focus:bg-white focus:ring-2 focus:ring-[#1a73e8] truncate disabled:opacity-80"
            aria-label="Document name"
          />
          <span className="text-xs text-[#5f6368] hidden sm:inline whitespace-nowrap">
            {statusLabel}
          </span>
          <span className="text-[10px] rounded-full bg-white/80 border border-[#dadce0] px-2 py-0.5 text-[#5f6368] whitespace-nowrap">
            {accessLabel}
          </span>
          {peers.length > 0 && (
            <div
              className="flex items-center gap-1.5 min-w-0"
              title={peers.map((p) => p.name).join(", ")}
            >
              {peers.slice(0, 4).map((p) => (
                <span
                  key={p.userId}
                  className="inline-flex items-center gap-1 rounded-full border border-[#dadce0] bg-white pl-0.5 pr-2 py-0.5 text-[11px] text-[#202124] max-w-[140px]"
                >
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: p.color }}
                    aria-hidden
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate">{p.name}</span>
                  <span className="text-[#5f6368] shrink-0">editing</span>
                </span>
              ))}
              {peers.length > 4 && (
                <span className="text-[11px] text-[#5f6368]">
                  +{peers.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {isOwner && onDelete && (
          <div className="flex items-center px-1 pt-0.5">
            <button
              type="button"
              onClick={onDelete}
              onMouseDown={(e) => e.stopPropagation()}
              className="px-2.5 py-1 text-sm rounded text-[#c5221f] hover:bg-[#fce8e6]"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center flex-shrink-0 gap-2 px-3">
        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            disabled={exportingPdf}
            onMouseDown={(e) => e.stopPropagation()}
            className="inline-flex text-sm px-3 py-1.5 rounded-full border border-[#dadce0] bg-white hover:bg-[#f1f3f4] text-[#202124] disabled:opacity-60"
            title="Export PDF via Browserless"
          >
            {exportingPdf ? "Exporting…" : "Export PDF"}
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={onSaveNow}
            onMouseDown={(e) => e.stopPropagation()}
            className="hidden sm:inline-flex text-sm px-3 py-1.5 rounded-full hover:bg-[#f1f3f4] text-[#202124]"
          >
            Save
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={onShare}
            onMouseDown={(e) => e.stopPropagation()}
            className="inline-flex items-center rounded-full bg-[#1a73e8] text-white text-sm font-medium px-4 py-1.5 hover:bg-[#1557b0]"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}
