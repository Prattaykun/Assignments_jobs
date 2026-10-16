"use client";

import { useEffect, useState, type RefObject } from "react";
import type { Editor } from "@tiptap/react";
import type { PresencePeer } from "@/hooks/useDocumentPresence";

type Rect = { top: number; left: number; width: number; height: number };

type PeerOverlay = {
  userId: string;
  name: string;
  color: string;
  caret: { top: number; left: number; height: number };
  selection: Rect[];
};

type Props = {
  editor: Editor | null;
  peers: PresencePeer[];
  containerRef: RefObject<HTMLElement | null>;
};

function clampPos(pos: number, size: number) {
  return Math.min(Math.max(1, pos), Math.max(1, size));
}

function selectionRects(
  view: Editor["view"],
  from: number,
  to: number,
  containerRect: DOMRect,
  scrollTop: number,
  scrollLeft: number
): Rect[] {
  if (from === to) return [];
  try {
    const start = view.domAtPos(from);
    const end = view.domAtPos(to);
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    return Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({
        top: r.top - containerRect.top + scrollTop,
        left: r.left - containerRect.left + scrollLeft,
        width: r.width,
        height: r.height,
      }));
  } catch {
    return [];
  }
}

export function RemoteCursors({ editor, peers, containerRef }: Props) {
  const [overlays, setOverlays] = useState<PeerOverlay[]>([]);

  useEffect(() => {
    if (!editor || !containerRef.current) {
      setOverlays([]);
      return;
    }

    const update = () => {
      const container = containerRef.current;
      const view = editor.view;
      if (!container || !view) {
        setOverlays([]);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const scrollLeft = container.scrollLeft;
      const docSize = view.state.doc.content.size;
      const next: PeerOverlay[] = [];

      for (const peer of peers) {
        try {
          const rawFrom = clampPos(peer.cursorFrom ?? 1, docSize);
          const rawTo = clampPos(peer.cursorTo ?? rawFrom, docSize);
          const from = Math.min(rawFrom, rawTo);
          const to = Math.max(rawFrom, rawTo);
          const head = clampPos(peer.cursorTo ?? to, docSize);
          const coords = view.coordsAtPos(head);

          next.push({
            userId: peer.userId,
            name: peer.name,
            color: peer.color,
            caret: {
              top: coords.top - containerRect.top + scrollTop,
              left: coords.left - containerRect.left + scrollLeft,
              height: Math.max(16, coords.bottom - coords.top),
            },
            selection: selectionRects(
              view,
              from,
              to,
              containerRect,
              scrollTop,
              scrollLeft
            ),
          });
        } catch {
          // position out of range after edits — skip
        }
      }
      setOverlays(next);
    };

    update();
    editor.on("transaction", update);
    window.addEventListener("resize", update);
    return () => {
      editor.off("transaction", update);
      window.removeEventListener("resize", update);
    };
  }, [editor, peers, containerRef]);

  if (overlays.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {overlays.map((o) => (
        <div key={o.userId}>
          {o.selection.map((r, i) => (
            <div
              key={`${o.userId}-sel-${i}`}
              className="absolute rounded-sm"
              style={{
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
                backgroundColor: o.color,
                opacity: 0.28,
              }}
            />
          ))}
          <div
            className="absolute"
            style={{ top: o.caret.top, left: o.caret.left }}
          >
            <div
              className="w-0.5 rounded-sm"
              style={{
                height: o.caret.height,
                backgroundColor: o.color,
              }}
            />
            <div
              className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
              style={{ backgroundColor: o.color }}
            >
              {o.name}
              {o.selection.length > 0 ? " (selecting)" : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
