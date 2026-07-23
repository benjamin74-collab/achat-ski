"use client";

import { useState, useTransition } from "react";
import {
  runFeedImportAction,
  type FeedImportActionResult,
} from "@/app/admin/feeds/[id]/actions";

type FeedImportButtonProps = {
  feedId: number;
  disabled?: boolean;
};

export default function FeedImportButton({
  feedId,
  disabled = false,
}: FeedImportButtonProps) {
  const [isPending, startTransition] =
    useTransition();

  const [result, setResult] =
    useState<FeedImportActionResult | null>(
      null
    );

  function handleImport(): void {
    const confirmed = window.confirm(
      "Lancer maintenant l’import complet de ce flux ?"
    );

    if (!confirmed) {
      return;
    }

    setResult(null);

    startTransition(async () => {
      const actionResult =
        await runFeedImportAction(feedId);

      setResult(actionResult);
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleImport}
        disabled={disabled || isPending}
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending
          ? "Import en cours…"
          : "Importer maintenant"}
      </button>

      {result && (
        <p
          className={[
            "max-w-sm text-sm",
            result.success
              ? "text-emerald-700"
              : "text-red-700",
          ].join(" ")}
          role="status"
        >
          {result.message}
        </p>
      )}
    </div>
  );
}