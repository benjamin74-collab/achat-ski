// src/components/Comments.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { signIn, useSession } from "next-auth/react";

type Comment = {
  id: number;
  body: string;
  createdAt: string;
  authorName: string;
};

export default function Comments({ pageId }: { pageId: number }) {
  const { status } = useSession();
  const [items, setItems] = useState<Comment[]>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    fetch(`/api/pages/${pageId}/comments`).then(r => r.json()).then(setItems).catch(()=>{});
  }, [pageId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const res = await fetch(`/api/pages/${pageId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      const c = await res.json();
      setItems([c, ...items]);
      setBody("");
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Commentaires</h2>

      {status !== "authenticated" ? (
        <div className="mt-3 text-sm">
          <button onClick={() => signIn()} className="underline">Connectez-vous</button> pour commenter.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-2">
          <textarea
            className="w-full rounded-xl border px-3 py-2 text-sm"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Votre commentaire…"
          />
          <button className="btn">Publier</button>
        </form>
      )}

      <ul className="mt-4 space-y-3">
        {items.map(c => (
          <li key={c.id} className="rounded-xl border p-3">
            <div className="text-xs text-slate-500">
              {c.authorName} · {c.createdAt.slice(0,10)}
            </div>
            <p className="text-sm mt-1">{c.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
