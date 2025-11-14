// src/components/admin/RichTextEditor.tsx
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

type Props = {
  name: string;
  label?: string;
  initialValue?: string;
};

type EditorMode = "visual" | "html";

type MediaLite = {
  id: number;
  publicUrl: string;
  title: string | null;
  alt: string | null;
};

type ImageTab = "upload" | "library";

export default function RichTextEditor({
  name,
  label = "Contenu",
  initialValue = "",
}: Props) {
  const [mode, setMode] = useState<EditorMode>("visual");
  const [value, setValue] = useState<string>(initialValue);
  const visualRef = useRef<HTMLDivElement | null>(null);

  // Modal image
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageTab, setImageTab] = useState<ImageTab>("upload");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [library, setLibrary] = useState<MediaLite[]>([]);
  const [libraryLoaded, setLibraryLoaded] = useState(false);

  // ✅ Sync valeur -> éditeur visuel UNIQUEMENT quand on passe / repasse en "visual"
  useEffect(() => {
    if (mode === "visual" && visualRef.current) {
      visualRef.current.innerHTML = value || "";
    }
    // ⚠️ on ne dépend PAS de `value` pour éviter de déplacer le curseur à chaque frappe
  }, [mode]); 

  // Récupération de la valeur depuis le div contentEditable
  const syncFromVisual = useCallback(() => {
    if (visualRef.current) {
      setValue(visualRef.current.innerHTML);
    }
  }, []);

  // Helpers de formatage très simples
  function wrapSelection(tag: string) {
    if (mode === "html") {
      return;
    }
    if (!visualRef.current) return;

    const html = visualRef.current.innerHTML;
    visualRef.current.innerHTML = `<${tag}>${html}</${tag}>`;
    syncFromVisual();
  }

  function applyParagraph() {
    if (mode === "html") return;
    if (!visualRef.current) return;
    const html = visualRef.current.innerHTML;
    visualRef.current.innerHTML = `<p>${html}</p>`;
    syncFromVisual();
  }

  function insertAtEnd(htmlChunk: string) {
    const newVal = (value || "") + htmlChunk;
    setValue(newVal);
    if (mode === "visual" && visualRef.current) {
      visualRef.current.innerHTML = newVal;
    }
  }

  // Insertion image dans le contenu
  function insertImage(url: string, alt: string | null = null) {
    const safeAlt = alt ?? "";
    const htmlChunk = `<p><img src="${url}" alt="${safeAlt.replace(
      /"/g,
      "&quot;"
    )}" /></p>`;
    insertAtEnd(htmlChunk);
    setImageModalOpen(false);
  }

  // Upload d’une nouvelle image
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "pages/content");
      fd.append("kind", "IMAGE");

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Échec upload");

      const json = await res.json();
      const url: string = json.asset.publicUrl ?? json.asset.url ?? "";
      const alt: string | null = json.asset.alt ?? json.asset.title ?? null;

      if (url) {
        insertImage(url, alt);
      } else {
        alert("Upload OK mais URL manquante dans la réponse.");
      }
    } catch (err) {
      console.error(err);
      alert("Échec de l’upload de l’image");
    } finally {
      setUploadBusy(false);
      e.target.value = "";
    }
  }

  // Chargement de la médiathèque
  async function loadLibrary() {
    if (libraryLoaded || libraryBusy) return;
    setLibraryBusy(true);
    try {
      const res = await fetch("/api/admin/media/list?kind=IMAGE&limit=60");
      if (!res.ok) throw new Error("Erreur de chargement médiathèque");
      const json = (await res.json()) as { assets: MediaLite[] };
      setLibrary(json.assets ?? []);
      setLibraryLoaded(true);
    } catch (err) {
      console.error(err);
      alert("Impossible de charger la médiathèque");
    } finally {
      setLibraryBusy(false);
    }
  }

  function openImageModal() {
    setImageTab("upload");
    setImageModalOpen(true);
  }

  function handleImageTabChange(tab: ImageTab) {
    setImageTab(tab);
    if (tab === "library") {
      void loadLibrary();
    }
  }

  function handleHtmlChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
  }

  function handleVisualInput(_e: FormEvent<HTMLDivElement>) {
    syncFromVisual();
  }

  // VIDÉO : pour l’instant, mini prompt URL simple
  function insertVideo() {
    const url = window.prompt("URL de la vidéo (YouTube, etc.)");
    if (!url) return;
    const htmlChunk = `<p><iframe src="${url}" frameborder="0" allowfullscreen></iframe></p>`;
    insertAtEnd(htmlChunk);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={
              mode === "visual"
                ? "px-2 py-1 rounded-full bg-white shadow-sm text-slate-900"
                : "px-2 py-1 rounded-full text-slate-500 hover:text-slate-800"
            }
          >
            Éditeur visuel
          </button>
          <button
            type="button"
            onClick={() => setMode("html")}
            className={
              mode === "html"
                ? "px-2 py-1 rounded-full bg-white shadow-sm text-slate-900"
                : "px-2 py-1 rounded-full text-slate-500 hover:text-slate-800"
            }
          >
            HTML
          </button>
        </div>
      </div>

      {/* Barre d’outils */}
      {mode === "visual" && (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
          <button type="button" className="btn-xs" onClick={applyParagraph}>
            P
          </button>
          <button
            type="button"
            className="btn-xs"
            onClick={() => wrapSelection("h2")}
          >
            H2
          </button>
          <button
            type="button"
            className="btn-xs"
            onClick={() => wrapSelection("h3")}
          >
            H3
          </button>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <button
            type="button"
            className="btn-xs"
            onClick={() =>
              insertAtEnd("<p><strong>Texte en gras</strong></p>")
            }
          >
            B
          </button>
          <button
            type="button"
            className="btn-xs"
            onClick={() =>
              insertAtEnd("<p><em>Texte en italique</em></p>")
            }
          >
            I
          </button>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <button
            type="button"
            className="btn-xs"
            onClick={() => insertAtEnd("<ul><li>Élément</li></ul>")}
          >
            Liste à puces
          </button>
          <button
            type="button"
            className="btn-xs"
            onClick={() => insertAtEnd("<ol><li>Élément</li></ol>")}
          >
            Liste numérotée
          </button>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <button type="button" className="btn-xs" onClick={openImageModal}>
            Image
          </button>
          <button type="button" className="btn-xs" onClick={insertVideo}>
            Vidéo
          </button>
        </div>
      )}

      {/* Zone d’édition */}
      {mode === "visual" ? (
        <div
          ref={visualRef}
          className="min-h-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-500/60"
          contentEditable
          suppressContentEditableWarning
          onInput={handleVisualInput}
        />
      ) : (
        <textarea
          className="input min-h-[260px] font-mono text-xs"
          value={value}
          onChange={handleHtmlChange}
        />
      )}

      {/* Champ caché pour le <form> */}
      <textarea name={name} value={value} readOnly className="hidden" />

      {/* MODALE IMAGE (upload + médiathèque) */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Insérer une image
              </h2>
              <button
                type="button"
                className="btn-xs"
                onClick={() => setImageModalOpen(false)}
              >
                Fermer
              </button>
            </div>

            {/* Onglets modale */}
            <div className="flex border-b border-slate-200 px-4">
              <button
                type="button"
                onClick={() => handleImageTabChange("upload")}
                className={`px-3 py-2 text-xs border-b-2 -mb-px ${
                  imageTab === "upload"
                    ? "border-brand-500 text-brand-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Téléverser
              </button>
              <button
                type="button"
                onClick={() => handleImageTabChange("library")}
                className={`px-3 py-2 text-xs border-b-2 -mb-px ${
                  imageTab === "library"
                    ? "border-brand-500 text-brand-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Médiathèque
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {imageTab === "upload" && (
                <div className="grid gap-3 text-sm">
                  <p className="text-slate-600">
                    Choisissez un fichier image, il sera ajouté à la médiathèque
                    et inséré dans le contenu.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadBusy}
                  />
                  {uploadBusy && (
                    <p className="text-xs text-slate-500">
                      Upload en cours…
                    </p>
                  )}
                </div>
              )}

              {imageTab === "library" && (
                <div className="grid gap-3 text-sm">
                  {libraryBusy && <p>Chargement de la médiathèque…</p>}
                  {!libraryBusy && library.length === 0 && (
                    <p className="text-slate-500 text-sm">
                      Aucun média trouvé. Téléversez une image dans l’onglet
                      “Téléverser” ou via la page “Médiathèque”.
                    </p>
                  )}
                  {!libraryBusy && library.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {library.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            insertImage(m.publicUrl, m.alt ?? m.title)
                          }
                          className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-brand-500 hover:bg-brand-50 transition"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.publicUrl}
                            alt={m.alt ?? m.title ?? ""}
                            className="w-full h-24 object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="px-2 py-1 text-[11px] text-slate-600 text-left line-clamp-2">
                            {m.title || m.alt || `Image #${m.id}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
