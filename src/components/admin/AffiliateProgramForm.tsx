"use client";

import {
  useActionState,
} from "react";
import Link from "next/link";

import {
  createAffiliateProgramAction,
  updateAffiliateProgramAction,
} from "@/app/admin/affiliation/actions";

import {
  INITIAL_AFFILIATION_FORM_STATE,
} from "@/app/admin/affiliation/types";

type Option = {
  id: number;
  name: string;
  active: boolean;
};

type Props = {
  mode: "create" | "edit";
  programId?: number;
  returnTo?: string;

  merchants: Option[];
  networks: Option[];
  siteIds: string[];

  initialValues: {
    siteId: string;
    merchantId: number | null;
    networkId: number | null;
    name: string;
    externalProgramId: string;
    trackingId: string;
    active: boolean;
  };
};

export default function AffiliateProgramForm({
  mode,
  programId,
  returnTo,
  merchants,
  networks,
  siteIds,
  initialValues,
}: Props) {
  const action =
    mode === "edit" && programId
      ? updateAffiliateProgramAction.bind(
          null,
          programId
        )
      : createAffiliateProgramAction;

  const [state, formAction, pending] =
    useActionState(
      action,
      INITIAL_AFFILIATION_FORM_STATE
    );

  return (
    <form action={formAction} className="space-y-6">
      {returnTo ? (
        <input
          type="hidden"
          name="returnTo"
          value={returnTo}
        />
      ) : null}

      {state.message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Programme d’affiliation
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Reliez un marchand, un réseau d’affiliation
          et l’un des sites du groupe Meilleur.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Site"
            error={state.errors?.siteId}
          >
            <select
              name="siteId"
              defaultValue={initialValues.siteId}
              className={inputClass}
              required
            >
              <option value="">
                Sélectionner un site
              </option>

              {siteIds.map((siteId) => (
                <option key={siteId} value={siteId}>
                  {siteId}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Nom du programme"
          >
            <input
              name="name"
              defaultValue={initialValues.name}
              className={inputClass}
              placeholder="Snowleader / meilleur-ski"
            />
          </Field>

          <Field
            label="Marchand"
            error={state.errors?.merchantId}
          >
            <select
              name="merchantId"
              defaultValue={
                initialValues.merchantId ?? ""
              }
              className={inputClass}
              required
            >
              <option value="">
                Sélectionner un marchand
              </option>

              {merchants.map((merchant) => (
                <option
                  key={merchant.id}
                  value={merchant.id}
                  disabled={!merchant.active}
                >
                  {merchant.name}
                  {!merchant.active
                    ? " — inactif"
                    : ""}
                </option>
              ))}
            </select>

            <Link
              href="/admin/affiliation/merchants/new"
              className="mt-2 inline-block text-xs font-medium text-brand-700"
            >
              + Créer un marchand
            </Link>
          </Field>

          <Field
            label="Réseau"
            error={state.errors?.networkId}
          >
            <select
              name="networkId"
              defaultValue={
                initialValues.networkId ?? ""
              }
              className={inputClass}
              required
            >
              <option value="">
                Sélectionner un réseau
              </option>

              {networks.map((network) => (
                <option
                  key={network.id}
                  value={network.id}
                  disabled={!network.active}
                >
                  {network.name}
                  {!network.active
                    ? " — inactif"
                    : ""}
                </option>
              ))}
            </select>

            <Link
              href="/admin/affiliation/networks/new"
              className="mt-2 inline-block text-xs font-medium text-brand-700"
            >
              + Créer un réseau
            </Link>
          </Field>

          <Field label="Identifiant externe du programme">
            <input
              name="externalProgramId"
              defaultValue={
                initialValues.externalProgramId
              }
              className={inputClass}
              placeholder="Identifiant fourni par Awin, Kwanko..."
            />
          </Field>

          <Field label="Identifiant de tracking">
            <input
              name="trackingId"
              defaultValue={
                initialValues.trackingId
              }
              className={inputClass}
              placeholder="meilleur-ski"
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
              Programme actif
            </span>

            <span className="text-xs text-slate-500">
              Le programme sera disponible lors de
              la création des flux produits.
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
              ? "Créer le programme"
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