"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import {
  createAffiliateNetworkAction,
  INITIAL_AFFILIATION_FORM_STATE,
  updateAffiliateNetworkAction,
} from "@/app/admin/affiliation/actions";

type Props = {
  mode: "create" | "edit";
  networkId?: number;

  initialValues: {
    name: string;
    slug: string;
    websiteUrl: string;
    active: boolean;
  };
};

export default function AffiliateNetworkForm({
  mode,
  networkId,
  initialValues,
}: Props) {
  const action =
    mode === "edit" && networkId
      ? updateAffiliateNetworkAction.bind(
          null,
          networkId
        )
      : createAffiliateNetworkAction;

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
      <FormMessage state={state} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Nom du réseau"
            error={state.errors?.name}
          >
            <input
              name="name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className={inputClass}
              placeholder="Awin"
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
        </div>

        <div className="mt-5">
          <Field
            label="Site web"
            error={state.errors?.websiteUrl}
          >
            <input
              name="websiteUrl"
              type="url"
              defaultValue={
                initialValues.websiteUrl
              }
              className={inputClass}
              placeholder="https://www.awin.com/"
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
            <span className="block text-sm font-semibold text-slate-900">
              Réseau actif
            </span>

            <span className="block text-xs text-slate-500">
              Les nouveaux programmes pourront
              utiliser ce réseau.
            </span>
          </span>
        </label>
      </div>

      <FormActions
        pending={pending}
        label={
          mode === "create"
            ? "Créer le réseau"
            : "Enregistrer"
        }
      />
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

function FormMessage({
  state,
}: {
  state: {
    message: string;
    success: boolean;
  };
}) {
  return state.message ? (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        state.success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {state.message}
    </div>
  ) : null;
}

function FormActions({
  pending,
  label,
}: {
  pending: boolean;
  label: string;
}) {
  return (
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
        {pending ? "Enregistrement…" : label}
      </button>
    </div>
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