"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { deleteFeedSourceAction } from "@/app/admin/feeds/actions";

type DeleteFeedSourceButtonProps = {
  feedId: number;
  feedName: string;
};

export default function DeleteFeedSourceButton({
  feedId,
  feedName,
}: DeleteFeedSourceButtonProps) {
  const router = useRouter();

  const [pending, startTransition] =
    useTransition();

  const [error, setError] = useState<
    string | null
  >(null);

  function handleDelete(): void {
    const confirmed = window.confirm(
      `Supprimer définitivement le flux « ${feedName} » ?\n\nLes mappings seront supprimés. Les offres et les imports historiques seront conservés mais ne seront plus rattachés à ce flux.`
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result =
        await deleteFeedSourceAction(feedId);

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.push("/admin/feeds");
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Suppression…"
          : "Supprimer le flux"}
      </button>

      {error ? (
        <p
          role="alert"
          className="mt-2 max-w-sm text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}