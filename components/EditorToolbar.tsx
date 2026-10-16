"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSelect,
  ColorSwatchButton,
} from "./toolbar/ToolbarPrimitives";
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconBold,
  IconFormatClear,
  IconHighlight,
  IconIndentDecrease,
  IconIndentIncrease,
  IconItalic,
  IconLineSpacing,
  IconLink,
  IconListBulleted,
  IconListNumbered,
  IconPrint,
  IconRedo,
  IconSpellcheck,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconTextColor,
  IconUnderline,
  IconUndo,
} from "./toolbar/icons";

const ICON = 18;

const FONTS = [
  { value: "Arial", label: "Arial" },
  { value: "Calibri", label: "Calibri" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
];

const STYLES = [
  { value: "paragraph", label: "Normal text" },
  { value: "heading1", label: "Heading 1" },
  { value: "heading2", label: "Heading 2" },
  { value: "heading3", label: "Heading 3" },
];

const ZOOM_OPTIONS = [
  { value: "0.75", label: "75%" },
  { value: "0.9", label: "90%" },
  { value: "1", label: "100%" },
  { value: "1.25", label: "125%" },
  { value: "1.5", label: "150%" },
];

type Props = {
  editor: Editor | null;
  disabled?: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

function currentFontSize(editor: Editor): string {
  const size = editor.getAttributes("textStyle").fontSize as string | undefined;
  if (!size) return "11";
  return size.replace("pt", "").replace("px", "");
}

function currentStyle(editor: Editor): string {
  if (editor.isActive("heading", { level: 1 })) return "heading1";
  if (editor.isActive("heading", { level: 2 })) return "heading2";
  if (editor.isActive("heading", { level: 3 })) return "heading3";
  return "paragraph";
}

export function EditorToolbar({
  editor,
  disabled,
  zoom,
  onZoomChange,
}: Props) {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("transaction", refresh);
    };
  }, [editor, refresh]);

  if (!editor) return null;

  const fontFamily =
    (editor.getAttributes("textStyle").fontFamily as string) || "Arial";
  const fontSize = currentFontSize(editor);
  const textColor =
    (editor.getAttributes("textStyle").color as string) || "#000000";
  const highlight =
    (editor.getAttributes("highlight").color as string) || "#fef08a";
  const styleValue = currentStyle(editor);

  const applyStyle = (value: string) => {
    const chain = editor.chain().focus();
    if (value === "heading1") chain.toggleHeading({ level: 1 }).run();
    else if (value === "heading2") chain.toggleHeading({ level: 2 }).run();
    else if (value === "heading3") chain.toggleHeading({ level: 3 }).run();
    else chain.setParagraph().run();
  };

  const bumpSize = (delta: number) => {
    const next = Math.min(72, Math.max(8, Number(fontSize) + delta));
    editor.chain().focus().setFontSize(`${next}pt`).run();
  };

  const insertLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      data-testid="formatting-bar"
      className="flex items-center px-2 py-1 mx-2 mb-1 bg-[#f1f5f9] text-[#1f2937] rounded-full min-h-[40px] overflow-x-auto"
      onMouseDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (!["INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(tag)) {
          e.preventDefault();
        }
      }}
    >
      <ToolbarGroup label="History">
        <ToolbarButton
          title="Undo"
          shortcut="Ctrl+Z"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <IconUndo size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          shortcut="Ctrl+Y"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <IconRedo size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Print"
          shortcut="Ctrl+P"
          disabled={disabled}
          onClick={() => window.print()}
        >
          <IconPrint size={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Spellcheck" disabled>
          <IconSpellcheck size={ICON} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Zoom">
        <ToolbarSelect
          title="Zoom"
          width={72}
          disabled={disabled}
          value={String(zoom)}
          onChange={(v) => onZoomChange(Number(v))}
          options={ZOOM_OPTIONS}
        />
      </ToolbarGroup>

      <ToolbarGroup label="Styles">
        <ToolbarSelect
          title="Styles"
          width={120}
          disabled={disabled}
          value={styleValue}
          onChange={applyStyle}
          options={STYLES}
        />
      </ToolbarGroup>

      <ToolbarGroup label="Font">
        <ToolbarSelect
          title="Font"
          width={110}
          disabled={disabled}
          value={FONTS.some((f) => f.value === fontFamily) ? fontFamily : "Arial"}
          onChange={(v) => editor.chain().focus().setFontFamily(v).run()}
          options={FONTS}
        />
        <div className="flex items-center gap-0.5 ml-1">
          <ToolbarButton
            title="Decrease font size"
            disabled={disabled}
            onClick={() => bumpSize(-1)}
          >
            <span className="text-base leading-none">−</span>
          </ToolbarButton>
          <input
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={fontSize}
            onChange={(e) => {
              const n = e.target.value.replace(/[^\d]/g, "");
              if (!n) return;
              editor.chain().focus().setFontSize(`${n}pt`).run();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-10 h-7 text-center text-sm rounded border border-[#dadce0] bg-white"
            aria-label="Font size"
          />
          <ToolbarButton
            title="Increase font size"
            disabled={disabled}
            onClick={() => bumpSize(1)}
          >
            <span className="text-base leading-none">+</span>
          </ToolbarButton>
        </div>
      </ToolbarGroup>

      <ToolbarGroup label="Text formatting">
        <ToolbarButton
          title="Bold"
          shortcut="Ctrl+B"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <IconBold size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          shortcut="Ctrl+I"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <IconItalic size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          shortcut="Ctrl+U"
          active={editor.isActive("underline")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <IconUnderline size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <IconStrikethrough size={ICON} />
        </ToolbarButton>
        <ColorSwatchButton
          title="Text color"
          color={textColor.startsWith("#") ? textColor : "#000000"}
          disabled={disabled}
          icon={<IconTextColor size={ICON} />}
          onPick={(c) => editor.chain().focus().setColor(c).run()}
        />
        <ColorSwatchButton
          title="Highlight color"
          color={highlight.startsWith("#") ? highlight : "#fef08a"}
          disabled={disabled}
          icon={<IconHighlight size={ICON} />}
          onPick={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
        />
        <ToolbarButton
          title="Insert link"
          shortcut="Ctrl+K"
          active={editor.isActive("link")}
          disabled={disabled}
          onClick={insertLink}
        >
          <IconLink size={ICON} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Script">
        <ToolbarButton
          title="Superscript"
          active={editor.isActive("superscript")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <IconSuperscript size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Subscript"
          active={editor.isActive("subscript")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <IconSubscript size={ICON} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Alignment">
        <ToolbarButton
          title="Align left"
          active={editor.isActive({ textAlign: "left" })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <IconAlignLeft size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          active={editor.isActive({ textAlign: "center" })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <IconAlignCenter size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          active={editor.isActive({ textAlign: "right" })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <IconAlignRight size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Justify"
          active={editor.isActive({ textAlign: "justify" })}
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <IconAlignJustify size={ICON} />
        </ToolbarButton>
        <ToolbarSelect
          title="Line spacing"
          width={56}
          disabled={disabled}
          value="1.15"
          onChange={(v) => editor.chain().focus().setLineHeight(v).run()}
          options={[
            { value: "1", label: "1.0" },
            { value: "1.15", label: "1.15" },
            { value: "1.5", label: "1.5" },
            { value: "2", label: "2.0" },
          ]}
        />
        <span className="sr-only">
          <IconLineSpacing size={ICON} />
        </span>
      </ToolbarGroup>

      <ToolbarGroup label="Lists">
        <ToolbarButton
          title="Bulleted list"
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <IconListBulleted size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <IconListNumbered size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Decrease indent"
          disabled={disabled}
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        >
          <IconIndentDecrease size={ICON} />
        </ToolbarButton>
        <ToolbarButton
          title="Increase indent"
          disabled={disabled}
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        >
          <IconIndentIncrease size={ICON} />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Clear">
        <ToolbarButton
          title="Clear formatting"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <IconFormatClear size={ICON} />
        </ToolbarButton>
      </ToolbarGroup>
    </div>
  );
}
