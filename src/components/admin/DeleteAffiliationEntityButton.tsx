"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  deleteAffiliateNetworkAction,
  deleteAffiliateProgramAction,
  deleteMerchantAction,
} from "@/app/admin/affiliation/actions";

type EntityType =
  | "network"
  | "merchant"
  | "program";

type Props = {
  entityType: EntityType;
  entityId: number;
  entityName: string;
};

export default function DeleteAffiliationEntityButton({
  entityType,
  entityId,
  entityName,
}: Props) {
  const router = useRouter();

  const [pending, startTransition] =
    useTransition();

  const [message, setMessage] = useState<
    string | null
  >(null);

  function handleDelete(): void {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${entityName} » ?`
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const result =
        entityType === "network"
          ? await deleteAffiliateNetworkAction(
              entityId
            )
          : entityType === "merchant"
            ? await deleteMerchantAction(entityId)
            : await deleteAffiliateProgramAction(
                entityId
              );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
      >
        {pending ? "Suppression…" : "Supprimer"}
      </button>

      {message ? (
        <p className="mt-1 max-w-xs text-xs text-red-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}