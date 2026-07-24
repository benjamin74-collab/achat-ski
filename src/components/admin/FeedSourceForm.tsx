"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import {
  createFeedSourceAction,
  updateFeedSourceAction,
} from "@/app/admin/feeds/actions";

import {
  INITIAL_FEED_SOURCE_FORM_STATE,
} from "@/app/admin/feeds/types";

type AffiliateProgramOption = {
  id: number;
  siteId: string;
  name: string | null;
  active: boolean;

  merchant: {
    name: string;
    active: boolean;
  };

  network: {
    name: string;
    active: boolean;
  };
};

type FeedSourceInitialValues = {
  affiliateProgramId: number | null;

  name: string;
  slug: string;
  sourceUrl: string;

  format: string;
  delimiter: string;
  encoding: string;

  active: boolean;
  autoImport: boolean;

  frequency: string;
  timezone: string;
};

type FeedSourceFormProps = {
  mode: "create" | "edit";
  feedId?: number;

  programs: AffiliateProgramOption[];
  initialValues: FeedSourceInitialValues;

  cancelHref: string;
};

export default function FeedSourceForm({
  mode,
  feedId,
  programs,
  initialValues,
  cancelHref,
}: FeedSourceFormProps) {
  const selectedAction =
    mode === "edit" && feedId
      ? updateFeedSourceAction.bind(null, feedId)
      : createFeedSourceAction;

  const [state, formAction, pending] = useActionState(
    selectedAction,
    INITIAL_FEED_SOURCE_FORM_STATE
  );

  const [name, setName] = useState(initialValues.name);
  const [slug, setSlug] = useState(initialValues.slug);
  const [slugTouched, setSlugTouched] = useState(
    Boolean(initialValues.slug)
  );

  const [format, setFormat] = useState(
    initialValues.format
  );

  const [frequency, setFrequency] = useState(
    initialValues.frequency
  );

  const [autoImport, setAutoImport] = useState(
    initialValues.autoImport
  );

  useEffect(() => {
    if (!slugTouched) {
      setSlug(createSlug(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    if (frequency === "MANUAL_ONLY") {
      setAutoImport(false);
    }
  }, [frequency]);

  return (
    <form
      action={formAction}
      className="space-y-8"
    >
      {state.message ? (
        <div
          role="alert"
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            state.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800",
          ].join(" ")}
        >
          {state.message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          title="Programme d’affiliation"
          description="Le site, le marchand et le réseau sont déterminés par le programme sélectionné."
        />

        <div className="mt-5">
          <FieldLabel
            htmlFor="affiliateProgramId"
            required
          >
            Programme
          </FieldLabel>

          <select
            id="affiliateProgramId"
            name="affiliateProgramId"
            defaultValue={
              initialValues.affiliateProgramId ?? ""
            }
            className={inputClasses(
              Boolean(
                state.errors?.affiliateProgramId
              )
            )}
            required
          >
            <option value="">
              Sélectionner un programme
            </option>

            {programs.map((program) => (
              <option
                key={program.id}
                value={program.id}
                disabled={
                  !program.active ||
                  !program.merchant.active ||
                  !program.network.active
                }
              >
                {program.merchant.name} —{" "}
                {program.network.name} —{" "}
                {program.siteId}
                {program.name
                  ? ` — ${program.name}`
                  : ""}
              </option>
            ))}
          </select>

          <FieldError
            message={
              state.errors?.affiliateProgramId
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          title="Informations générales"
          description="Nom interne et identifiant unique du flux."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="name" required>
              Nom du flux
            </FieldLabel>

            <input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Ekosport - Produits ski"
              className={inputClasses(
                Boolean(state.errors?.name)
              )}
              required
            />

            <FieldError
              message={state.errors?.name}
            />
          </div>

          <div>
            <FieldLabel htmlFor="slug" required>
              Slug
            </FieldLabel>

            <input
              id="slug"
              name="slug"
              type="text"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(createSlug(event.target.value));
              }}
              placeholder="ekosport-produits-ski"
              className={inputClasses(
                Boolean(state.errors?.slug)
              )}
              required
            />

            <FieldError
              message={state.errors?.slug}
            />
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel htmlFor="sourceUrl" required>
            URL du flux
          </FieldLabel>

          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            defaultValue={initialValues.sourceUrl}
            placeholder="https://..."
            className={inputClasses(
              Boolean(state.errors?.sourceUrl)
            )}
            required
          />

          <p className="mt-1 text-xs leading-5 text-slate-500">
            L’URL peut contenir les paramètres et
            identifiants fournis par la plateforme
            d’affiliation.
          </p>

          <FieldError
            message={state.errors?.sourceUrl}
          />
        </div>
		<div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
		  <Link
			href="/admin/affiliation/programs/new?returnTo=/admin/feeds/new"
			className="text-brand-700 hover:text-brand-800"
		  >
			+ Créer un programme
		  </Link>

		  <Link
			href="/admin/affiliation"
			className="text-slate-600 hover:text-slate-800"
		  >
			Gérer les marchands et réseaux
		  </Link>
		</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          title="Format du fichier"
          description="Configuration utilisée par le parseur générique."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div>
            <FieldLabel htmlFor="format" required>
              Format
            </FieldLabel>

            <select
              id="format"
              name="format"
              value={format}
              onChange={(event) =>
                setFormat(event.target.value)
              }
              className={inputClasses(
                Boolean(state.errors?.format)
              )}
            >
              <option value="CSV">CSV</option>
              <option value="TSV">TSV</option>
              <option value="XML">XML</option>
              <option value="JSON">JSON</option>
            </select>

            <FieldError
              message={state.errors?.format}
            />
          </div>

          <div>
            <FieldLabel htmlFor="delimiter">
              Séparateur
            </FieldLabel>

            <select
              id="delimiter"
              name="delimiter"
              defaultValue={
                initialValues.delimiter || ";"
              }
              className={inputClasses(false)}
              disabled={
                format !== "CSV" &&
                format !== "TSV"
              }
            >
              <option value=";">
                Point-virgule (;)
              </option>
              <option value=",">Virgule (,)</option>
              <option value="|">
                Barre verticale (|)
              </option>
              <option value={"\t"}>
                Tabulation
              </option>
            </select>

            {format !== "CSV" &&
            format !== "TSV" ? (
              <input
                type="hidden"
                name="delimiter"
                value={
                  initialValues.delimiter || ";"
                }
              />
            ) : null}
          </div>

          <div>
            <FieldLabel htmlFor="encoding">
              Encodage
            </FieldLabel>

            <select
              id="encoding"
              name="encoding"
              defaultValue={
                initialValues.encoding || "utf-8"
              }
              className={inputClasses(false)}
            >
              <option value="utf-8">UTF-8</option>
              <option value="latin1">
                ISO-8859-1 / Latin-1
              </option>
              <option value="windows-1252">
                Windows-1252
              </option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionTitle
          title="Planification"
          description="Cette configuration indique au cron quels flux doivent être traités."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <FieldLabel
              htmlFor="frequency"
              required
            >
              Fréquence
            </FieldLabel>

            <select
              id="frequency"
              name="frequency"
              value={frequency}
              onChange={(event) =>
                setFrequency(event.target.value)
              }
              className={inputClasses(
                Boolean(state.errors?.frequency)
              )}
            >
              <option value="MANUAL_ONLY">
                Uniquement manuel
              </option>
              <option value="EVERY_6_HOURS">
                Toutes les 6 heures
              </option>
              <option value="EVERY_12_HOURS">
                Toutes les 12 heures
              </option>
              <option value="DAILY">
                Tous les jours
              </option>
              <option value="WEEKLY">
                Toutes les semaines
              </option>
            </select>

            <FieldError
              message={state.errors?.frequency}
            />
          </div>

          <div>
            <FieldLabel htmlFor="timezone">
              Fuseau horaire
            </FieldLabel>

            <select
              id="timezone"
              name="timezone"
              defaultValue={
                initialValues.timezone ||
                "Europe/Paris"
              }
              className={inputClasses(
                Boolean(state.errors?.timezone)
              )}
            >
              <option value="Europe/Paris">
                Europe/Paris
              </option>
              <option value="UTC">UTC</option>
            </select>

            <FieldError
              message={state.errors?.timezone}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <CheckboxCard
            name="active"
            title="Flux actif"
            description="Le flux peut être importé manuellement ou automatiquement."
            defaultChecked={initialValues.active}
          />

          <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
            <input
              name="autoImport"
              type="checkbox"
              checked={autoImport}
              disabled={
                frequency === "MANUAL_ONLY"
              }
              onChange={(event) =>
                setAutoImport(event.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Import automatique
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Le cron pourra sélectionner ce flux
                lorsqu’il arrivera à échéance.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
          La planification détermine les flux éligibles.
          Le déclenchement réel dépend toujours du cron
          Vercel, que nous vérifierons à l’étape suivante.
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Annuler
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending
            ? "Enregistrement…"
            : mode === "create"
              ? "Créer le flux"
              : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-950">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  required = false,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-slate-800"
    >
      {children}

      {required ? (
        <span className="ml-1 text-red-600">*</span>
      ) : null}
    </label>
  );
}

function FieldError({
  message,
}: {
  message?: string;
}) {
  return message ? (
    <p className="mt-1.5 text-xs font-medium text-red-700">
      {message}
    </p>
  ) : null;
}

function CheckboxCard({
  name,
  title,
  description,
  defaultChecked,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />

      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function inputClasses(hasError: boolean): string {
  return [
    "block min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
  ].join(" ");
}

function createSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}