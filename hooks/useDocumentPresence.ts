"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

export type PresencePeer = {
  userId: string;
  name: string;
  email: string;
  cursorFrom: number;
  cursorTo: number;
  lastSeenAt: string;
  color: string;
};

const POLL_MS = 10_000;
/** Push selection/caret sooner so remote highlights feel live. */
const CURSOR_PUSH_MS = 1_500;

type Options = {
  documentId: string;
  editor: Editor | null;
  enabled?: boolean;
};

export function useDocumentPresence({
  documentId,
  editor,
  enabled = true,
}: Options) {
  const [peers, setPeers] = useState<PresencePeer[]>([]);
  const lastPush = useRef(0);
  const alive = useRef(true);

  const heartbeat = useCallback(
    async (force = false) => {
      if (!enabled || !alive.current) return;
      const now = Date.now();
      if (!force && now - lastPush.current < 2_000) return;

      const sel = editor?.state.selection;
      const cursorFrom = sel?.from ?? 1;
      const cursorTo = sel?.to ?? 1;

      try {
        const res = await fetch(`/api/documents/${documentId}/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cursorFrom, cursorTo }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { peers?: PresencePeer[] };
        setPeers(data.peers ?? []);
        lastPush.current = now;
      } catch {
        // ignore transient network errors
      }
    },
    [documentId, editor, enabled]
  );

  useEffect(() => {
    alive.current = true;
    if (!enabled) return;

    void heartbeat(true);
    const poll = window.setInterval(() => void heartbeat(true), POLL_MS);

    const leave = () => {
      alive.current = false;
      // keepalive so the request survives unload
      void fetch(`/api/documents/${documentId}/presence`, {
        method: "DELETE",
        keepalive: true,
      });
    };
    window.addEventListener("pagehide", leave);
    window.addEventListener("beforeunload", leave);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("beforeunload", leave);
      leave();
    };
  }, [documentId, enabled, heartbeat]);

  // Push cursor more often while editing (still rate-limited).
  useEffect(() => {
    if (!enabled || !editor) return;
    const onSel = () => {
      const now = Date.now();
      if (now - lastPush.current < CURSOR_PUSH_MS) return;
      void heartbeat();
    };
    editor.on("selectionUpdate", onSel);
    return () => {
      editor.off("selectionUpdate", onSel);
    };
  }, [editor, enabled, heartbeat]);

  return { peers, refreshPresence: () => void heartbeat(true) };
}
