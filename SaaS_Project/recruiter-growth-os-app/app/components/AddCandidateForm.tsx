"use client";

import { useState } from "react";
import type { Candidate } from "../lib/types";
import { CloseIcon } from "./icons";

type Props = {
  onCreated: (candidate: Candidate) => void;
  onCancel: () => void;
};

type FormState = {
  name: string;
  role: string;
  company: string;
  linkedinUrl: string;
  daysSinceContact: string;
  keySellingPoint: string;
  candidateHook: string;
};

const empty: FormState = {
  name: "",
  role: "",
  company: "",
  linkedinUrl: "",
  daysSinceContact: "0",
  keySellingPoint: "",
  candidateHook: "",
};

export function AddCandidateForm({ onCreated, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.role.trim() || !form.company.trim()) {
      setError("Name, role and company are required.");
      return;
    }

    const keySellingPoint = form.keySellingPoint.trim();
    const candidateHook = form.candidateHook.trim();

    const signals: Record<string, string> = {};
    if (keySellingPoint) signals.keySellingPoint = keySellingPoint;
    if (candidateHook) signals.candidateHook = candidateHook;

    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      company: form.company.trim(),
      linkedinUrl: form.linkedinUrl.trim() || undefined,
      interactionType: "FOLLOW_UP",
      signals,
      daysSinceContact: Number(form.daysSinceContact) || 0,
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to add candidate");

      onCreated({ ...(data as Candidate), lastAction: null });
      setForm(empty);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-btn border border-border bg-surface px-2.5 py-1.5 text-[13px] text-text-primary placeholder:text-text-muted hover:border-border-strong";

  const labelClass =
    "text-[11px] uppercase tracking-wide text-text-muted";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-border bg-surface"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-[13px] font-medium text-text-primary">
          Add candidate
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="
            inline-flex h-6 w-6 items-center justify-center rounded-md
            text-text-muted hover:bg-surface-2 hover:text-text-primary
          "
        >
          <CloseIcon size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className={labelClass}>Name *</span>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ola Nordmann"
            className={inputClass}
            required
          />
        </label>

        <label className="space-y-1">
          <span className={labelClass}>Role *</span>
          <input
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder="Senior Recruiter"
            className={inputClass}
            required
          />
        </label>

        <label className="space-y-1">
          <span className={labelClass}>Company *</span>
          <input
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Acme"
            className={inputClass}
            required
          />
        </label>

        <label className="space-y-1">
          <span className={labelClass}>LinkedIn URL</span>
          <input
            type="url"
            value={form.linkedinUrl}
            onChange={(e) => set("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className={inputClass}
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className={labelClass}>Days since last contact</span>
          <input
            type="number"
            min={0}
            value={form.daysSinceContact}
            onChange={(e) => set("daysSinceContact", e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className={labelClass}>Key selling point</span>
          <input
            value={form.keySellingPoint}
            onChange={(e) => set("keySellingPoint", e.target.value)}
            placeholder="Hva er det sterkeste med denne rollen? (lønn, tech, impact)"
            className={inputClass}
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className={labelClass}>Candidate hook</span>
          <input
            value={form.candidateHook}
            onChange={(e) => set("candidateHook", e.target.value)}
            placeholder="Hvorfor passer denne kandidaten spesielt? (erfaring, selskap, stack)"
            className={inputClass}
          />
        </label>
      </div>

      {error && (
        <div className="px-4 pb-2">
          <div
            className="
              rounded-md border border-danger/30 bg-danger-bg
              px-2.5 py-1.5 text-[12px] text-danger
            "
          >
            {error}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="
            rounded-btn border border-border bg-surface px-3 py-1.5 text-[12px]
            text-text-secondary hover:border-border-strong hover:text-text-primary
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="
            inline-flex items-center gap-1.5 rounded-btn bg-accent px-3 py-1.5
            text-[12px] font-medium text-white hover:bg-accent-hover
            disabled:opacity-60
          "
        >
          {submitting && <span className="spinner" />}
          {submitting ? "Saving..." : "Add candidate"}
        </button>
      </div>
    </form>
  );
}
