// src/components/admin/RichTextEditor.tsx
"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

type Props = {
  name: string;
  initialValue?: string;
  label?: string;
  placeholder?: string;
  rows?: number;
};

export default function RichTextEditor({ name, initialValue = "", label, placeholder = "Saisir le contenu…", rows = 16 }: Props) {
  const editor = useEditor({
    content: initialValue || "",
    extensions: [
      StarterKit.configure({ heading: { levels: [1,2,3,4] } }),
      Underline,
      Link.configure({ openOnClick: true, autolink: true }),
      Image,
    ],
    editorProps: {
      attributes: {
        class: "prose max-w-none p-3 min-h-["+Math.max(rows*16, 240)+"px] focus:outline-none",
        "data-placeholder": placeholder,
      } as any,
    },
  });

  // met à jour le champ caché à chaque modif
  useEffect(() => {
    // no-op
  }, [editor]);

  return (
    <div className="grid gap-2">
      {label ? <label className="text-sm">{label}</label> : null}
      {/* barre d'outils minimale */}
      <div className="flex flex-wrap gap-1">
        <Btn on={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")}>B</Btn>
        <Btn on={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")}><i>I</i></Btn>
        <Btn on={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")}><u>U</u></Btn>
        <Btn on={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")}>• Liste</Btn>
        <Btn on={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")}>1. Liste</Btn>
        <Btn on={() => editor?.chain().focus().setParagraph().run()} active={editor?.isActive("paragraph")}>P</Btn>
        <Btn on={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })}>H2</Btn>
        <Btn on={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })}>H3</Btn>
      </div>

      <div className="rounded-xl border bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* champ caché pour envoyer le HTML au serveur */}
      <input type="hidden" name={name} value={editor?.getHTML() ?? initialValue} />
    </div>
  );
}

function Btn({ on, active, children }: { on: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button type="button"
      onClick={on}
      className={`px-2 py-1 rounded border text-sm ${active ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}
