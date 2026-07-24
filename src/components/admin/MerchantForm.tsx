"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import {
  createMerchantAction,
  INITIAL_AFFILIATION_FORM_STATE,
  updateMerchantAction,
} from "@/app/admin/affiliation/actions";

type Props = {
  mode: "create" | "edit";
  merchantId?: number;

  initialValues: {
    name: string;
    slug: string;
    websiteUrl: string;
    platform: string;
    network: string;
    programId: string;
    status: string;
    active: boolean;
  };
};

export default function MerchantForm({
  mode,
  merchantId,
  initialValues,
}: Props) {
  const action =
    mode === "edit" && merchantId
      ? updateMerchantAction.bind(
          null,
          merchantId
        )
      : createMerchantAction;

  const [state, formAction, pending] =
    useActionState(
      action,
      INITIAL_AFFILIATION_FORM_STATE
    );

  const [name, setName] = useState(
    initialValues.name
  );

  const [slug, setSlug] = useState(
    initialValues.slug
  );

  const [slugTouched, setSlugTouched] =
    useState(Boolean(initialValues.slug));

  useEffect(() => {
    if (!slugTouched) {
      setSlug(createSlug(name));
    }
  }, [name, slugTouched]);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Informations du marchand
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Nom"
            error={state.errors?.name}
          >
            <input
              name="name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className={inputClass}
              placeholder="Snowleader"
              required
            />
          </Field>

          <Field
            label="Slug"
            error={state.errors?.slug}
          >
            <input
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(
                  createSlug(event.target.value)
                );
              }}
              className={inputClass}
              required
            />
          </Field>

          <Field
            label="Site marchand"
            error={state.errors?.websiteUrl}
          >
            <input
              name="websiteUrl"
              type="url"
              defaultValue={
                initialValues.websiteUrl
              }
              className={inputClass}
              placeholder="https://www.snowleader.com/"
            />
          </Field>

          <Field
            label="Plateforme principale"
            error={state.errors?.platform}
          >
            <select
              name="platform"
              defaultValue={initialValues.platform}
              className={inputClass}
            >
              <option value="KWANKO">
                Kwanko
              </option>
              <option value="AWIN">Awin</option>
              <option value="AFFILAE">
                Affilae
              </option>
              <option value="DIRECT">
                Direct
              </option>
              <option value="OTHER">
                Autre
              </option>
            </select>
          </Field>

          <Field label="Réseau historique">
            <input
              name="network"
              defaultValue={initialValues.network}
              className={inputClass}
              placeholder="Champ historique facultatif"
            />
          </Field>

          <Field label="Identifiant historique du programme">
            <input
              name="programId"
              defaultValue={
                initialValues.programId
              }
              className={inputClass}
            />
          </Field>

          <Field label="Statut">
            <input
              name="status"
              defaultValue={initialValues.status}
              className={inputClass}
              placeholder="active, pending..."
            />
          </Field>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 p-4">
          <input
            name="active"
            type="checkbox"
            defaultChecked={initialValues.active}
            className="mt-1 h-4 w-4"
          />

          <span>
            <span className="block text-sm font-semibold">
              Marchand actif
            </span>

            <span className="text-xs text-slate-500">
              Le marchand pourra être utilisé dans
              les programmes d’affiliation.
            </span>
          </span>
        </label>
      </section>

      <div className="flex justify-end gap-3">
        <Link
          href="/admin/affiliation"
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold"
        >
          Annuler
        </Link>

        <button
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white disabled:bg-slate-400"
        >
          {pending
            ? "Enregistrement…"
            : mode === "create"
              ? "Créer le marchand"
              : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-800">
        {label}
      </span>

      {children}

      {error ? (
        <span className="mt-1 block text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function createSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}