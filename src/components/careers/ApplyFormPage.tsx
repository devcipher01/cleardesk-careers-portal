import React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Upload, AlertTriangle, Ban, FileText, X } from "lucide-react";
import { JOBS } from "@/lib/jobs";
import {
  COUNTRIES,
  getCountryByName,
  HOURS_PER_WEEK_OPTIONS,
  timezoneLabelForCountry,
} from "@/lib/countries";
import { formatFullPhone, validatePhoneNumber } from "@/lib/phone";
import { PIPELINE_SESSION_KEY } from "@/lib/careersPipeline";
import { submitApplication } from "@/lib/server/actions";

export interface ApplyForm {
  fullName: string;
  email: string;
  phoneDialCode: string;
  phoneNational: string;
  country: string;
  timezone: string;
  position: string;
  hasComputer: "yes" | "no";
  internet: string;
  typingSpeed: string;
  availability: string;
  hoursPerWeek: number;
  resume: FileList;
  whyRemote: string;
  experience: string;
  workedRemote: "yes" | "no";
  remoteDescription?: string;
  source: string;
}

export function ApplyFormPage({ role }: { role?: string }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const openJobs = useMemo(() => JOBS.filter((j) => j.status === "open"), []);

  const defaultRole = useMemo(() => {
    if (role) {
      const match = openJobs.find((j) => j.slug === role);
      if (match) return match.slug;
    }
    return openJobs[0]?.slug ?? "";
  }, [role, openJobs]);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplyForm>({
    mode: "onTouched",
    defaultValues: {
      position: defaultRole,
      workedRemote: "no",
      hasComputer: "yes",
      phoneDialCode: "+1",
      phoneNational: "",
      country: "",
      timezone: "",
    },
  });

  const workedRemote = watch("workedRemote");
  const hasComputer = watch("hasComputer");
  const country = watch("country");
  const phoneDialCode = watch("phoneDialCode");
  const phoneNational = watch("phoneNational");
  const resumeFiles = watch("resume");
  const resumeFile = resumeFiles?.[0];
  const { ref: resumeRef, ...resumeField } = register("resume", {
    required: "Resume required",
    validate: (files) => {
      if (!files || files.length === 0) return "Resume required";
      if (files[0].size > 5 * 1024 * 1024) return "Max 5MB";
      return true;
    },
  });

  useEffect(() => {
    if (defaultRole) setValue("position", defaultRole);
  }, [defaultRole, setValue]);

  useEffect(() => {
    if (!country) return;
    const meta = getCountryByName(country);
    if (meta) {
      setValue("phoneDialCode", meta.dialCode);
      setValue("timezone", timezoneLabelForCountry(country));
    }
  }, [country, setValue]);

  const next = async () => {
    const fields: (keyof ApplyForm)[][] = [
      [],
      ["fullName", "email", "phoneDialCode", "phoneNational", "country", "position"],
      ["hasComputer", "internet", "typingSpeed", "availability", "hoursPerWeek", "resume"],
      ["whyRemote", "experience", "workedRemote", "source"],
    ];
    const ok = await trigger(fields[step] as (keyof ApplyForm)[]);
    if (ok) setStep((s) => Math.min(3, s + 1));
  };

  const onSubmit = (data: ApplyForm) => {
    void (async () => {
      setSubmitting(true);
      setSubmitError("");
      try {
        const resume = data.resume?.[0];
        const phone = formatFullPhone(data.phoneDialCode, data.phoneNational);
        const result = await submitApplication({
          data: {
            fullName: data.fullName,
            email: data.email,
            phone,
            country: data.country,
            timezone: data.timezone || timezoneLabelForCountry(data.country),
            position: data.position,
            hasComputer: data.hasComputer,
            internet: data.internet,
            typingSpeed: data.typingSpeed,
            availability: data.availability,
            hoursPerWeek: data.hoursPerWeek,
            whyRemote: data.whyRemote,
            experience: data.experience,
            workedRemote: data.workedRemote,
            remoteDescription: data.remoteDescription ?? null,
            source: data.source,
            resumeMeta: resume
              ? { filename: resume.name, mime: resume.type || "application/octet-stream", size: resume.size }
              : null,
          },
        });
        if (typeof window !== "undefined") {
          sessionStorage.setItem(PIPELINE_SESSION_KEY, result.applicationId);
        }
        await navigate({
          to: "/careers/assessment",
          search: { applicationId: result.applicationId },
        });
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
        setSubmitting(false);
      }
    })();
  };

  const progress = (step / 3) * 100;

  return (
    <section className="container-page overflow-x-hidden py-10 md:py-14">
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        <div className="rounded-3xl border border-ink/10 bg-card p-4 shadow-sm sm:p-6 md:p-9">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold tracking-tight text-ink sm:text-base md:text-lg">Step {step} of 3</p>
            <p className="text-sm font-bold tabular-nums text-ink sm:text-base md:text-lg">{Math.round(progress)}% complete</p>
          </div>
          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-cream">
            <div className="h-full rounded-full bg-lime transition-all" style={{ width: `${progress}%` }} />
          </div>
          <h1 className="text-3xl font-medium text-ink md:text-4xl">
            {step === 1 && (<>Personal <span className="font-serif italic">info.</span></>)}
            {step === 2 && (<>Your <span className="font-serif italic">work setup.</span></>)}
            {step === 3 && (<>A few short <span className="font-serif italic">questions.</span></>)}
          </h1>

          {submitError && (
            <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 min-w-0 space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {step === 1 && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Full name" error={errors.fullName?.message}>
                      <input {...register("fullName", { required: "Required", maxLength: { value: 100, message: "Max 100 characters" } })} className="ipt" />
                    </Field>
                    <Field label="Email address" error={errors.email?.message}>
                      <input type="email" {...register("email", { required: "Required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } })} className="ipt" />
                    </Field>
                    <Field label="Country of residence" error={errors.country?.message}>
                      <select {...register("country", { required: "Required" })} className="ipt">
                        <option value="">Select country...</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-xs text-ink/50">
                        Americas, Europe, and select Asia-Pacific regions (India and China not eligible).
                      </p>
                    </Field>
                    <Field
                      label="Phone / WhatsApp"
                      error={errors.phoneNational?.message || errors.phoneDialCode?.message}
                      className="md:col-span-2"
                    >
                      <div className="flex w-full items-stretch gap-2">
                        <input
                          {...register("phoneDialCode", { required: "Required" })}
                          className="ipt-code"
                          readOnly
                          aria-label="Country code"
                        />
                        <input
                          {...register("phoneNational", {
                            required: "Required",
                            validate: () => {
                              const r = validatePhoneNumber(phoneDialCode, phoneNational);
                              return r === true ? true : r;
                            },
                          })}
                          className="ipt ipt-grow"
                          placeholder="555 123 4567"
                          inputMode="tel"
                          autoComplete="tel-national"
                        />
                      </div>
                    </Field>
                    <input type="hidden" {...register("timezone")} />
                    <Field label="Position applying for" error={errors.position?.message}>
                      <select
                        {...register("position", {
                          required: "Required",
                          validate: (slug) =>
                            openJobs.some((j) => j.slug === slug) || "Select an available open position",
                        })}
                        className="ipt"
                      >
                        {openJobs.length === 0 && <option value="">No open positions</option>}
                        {openJobs.map((j) => (
                          <option key={j.slug} value={j.slug}>{j.title}</option>
                        ))}
                        {JOBS.filter((j) => j.status === "filled").map((j) => (
                          <option key={j.slug} value={j.slug} disabled>
                            ⛔ {j.title} — not available
                          </option>
                        ))}
                      </select>
                      {JOBS.some((j) => j.status === "filled") && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/50">
                          <Ban className="h-3.5 w-3.5 text-destructive" aria-hidden />
                          Filled roles cannot be selected.
                        </p>
                      )}
                    </Field>
                  </div>
                )}

                {step === 2 && (
                  <>
                    <Field label="Do you have a laptop or desktop computer?" error={errors.hasComputer?.message}>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((v) => (
                          <label key={v} className="flex flex-1 cursor-pointer items-center gap-2 rounded-2xl border border-ink/10 bg-cream p-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-lime/30">
                            <input type="radio" value={v} {...register("hasComputer", { required: "Required" })} />
                            {v === "yes" ? "Yes" : "No"}
                          </label>
                        ))}
                      </div>
                    </Field>
                    {hasComputer === "no" && (
                      <div className="flex items-start gap-3 rounded-2xl border border-butter bg-butter/40 p-4 text-sm text-ink">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>Most Worknesta roles require a laptop or desktop. You may still apply but please note this requirement.</p>
                      </div>
                    )}
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Internet connection" error={errors.internet?.message}>
                        <select className="ipt" {...register("internet", { required: "Required" })}>
                          <option value="">Select...</option>
                          <option>Fiber</option>
                          <option>Cable Broadband</option>
                          <option>DSL</option>
                          <option>Mobile Data</option>
                          <option>Other</option>
                        </select>
                      </Field>
                      <Field label="Typing speed" error={errors.typingSpeed?.message}>
                        <select className="ipt" {...register("typingSpeed", { required: "Required" })}>
                          <option value="">Select...</option>
                          <option>Below 40 WPM</option>
                          <option>40–50 WPM</option>
                          <option>51–60 WPM</option>
                          <option>60+ WPM</option>
                        </select>
                      </Field>
                      <Field label="Availability" error={errors.availability?.message}>
                        <div className="flex flex-wrap gap-2">
                          {(["Full-Time", "Part-Time", "Flexible"] as const).map((v) => (
                            <label key={v} className="flex cursor-pointer items-center gap-2 rounded-2xl border border-ink/10 bg-cream px-3 py-2 text-sm has-[:checked]:border-ink has-[:checked]:bg-lime/30">
                              <input type="radio" value={v} {...register("availability", { required: "Required" })} />
                              {v}
                            </label>
                          ))}
                        </div>
                      </Field>
                      <Field label="Hours per week" error={errors.hoursPerWeek?.message}>
                        <select
                          className="ipt"
                          {...register("hoursPerWeek", {
                            required: "Required",
                            valueAsNumber: true,
                          })}
                        >
                          <option value="">Select...</option>
                          {HOURS_PER_WEEK_OPTIONS.map((h) => (
                            <option key={h} value={h}>
                              {h} hours / week
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Upload CV / Resume (PDF or Word)" error={errors.resume?.message as string | undefined}>
                      <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf,.doc,.docx"
                        className="sr-only"
                        {...resumeField}
                        ref={(el) => {
                          resumeRef(el);
                          resumeInputRef.current = el;
                        }}
                      />
                      {resumeFile ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-ink/15 bg-cream p-3">
                          <ResumeFileBadge file={resumeFile} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{resumeFile.name}</p>
                            <p className="text-xs text-ink/50">
                              {(resumeFile.size / 1024).toFixed(0)} KB — ready to upload
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (resumeInputRef.current) resumeInputRef.current.value = "";
                              const empty = new DataTransfer();
                              setValue("resume", empty.files, { shouldValidate: true });
                            }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/5"
                          >
                            <X className="h-3.5 w-3.5" /> Change
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="resume-upload"
                          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-ink/20 bg-cream p-4 text-sm text-ink/60 hover:border-ink/40"
                        >
                          <Upload className="h-4 w-4 shrink-0 text-ink" />
                          <span className="flex-1">Choose file (PDF, DOC, DOCX — max 5MB)</span>
                        </label>
                      )}
                    </Field>
                  </>
                )}

                {step === 3 && (
                  <>
                    <Field label="Why do you want to work remotely?" error={errors.whyRemote?.message}>
                      <textarea rows={3} {...register("whyRemote", { required: "Required", minLength: { value: 30, message: "At least 30 characters" }, maxLength: { value: 1000, message: "Max 1000 characters" } })} className="ipt" />
                    </Field>
                    <Field label="Describe any experience with data entry or transcription" error={errors.experience?.message}>
                      <textarea rows={4} {...register("experience", { required: "Required", minLength: { value: 30, message: "At least 30 characters" }, maxLength: { value: 1500, message: "Max 1500 characters" } })} className="ipt" />
                    </Field>
                    <Field label="Have you worked remotely before?" error={errors.workedRemote?.message}>
                      <div className="flex gap-3">
                        {(["yes", "no"] as const).map((v) => (
                          <label key={v} className="flex flex-1 cursor-pointer items-center gap-2 rounded-2xl border border-ink/10 bg-cream p-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-lime/30">
                            <input type="radio" value={v} {...register("workedRemote", { required: "Required" })} />
                            {v === "yes" ? "Yes" : "No"}
                          </label>
                        ))}
                      </div>
                    </Field>
                    {workedRemote === "yes" && (
                      <Field label="Briefly describe the role and how long you did it" error={errors.remoteDescription?.message}>
                        <textarea rows={3} {...register("remoteDescription", { maxLength: { value: 1000, message: "Max 1000 characters" } })} className="ipt" />
                      </Field>
                    )}
                    <Field label="How did you hear about us?" error={errors.source?.message}>
                      <select className="ipt" {...register("source", { required: "Required" })}>
                        <option value="">Select...</option>
                        <option>Indeed</option>
                        <option>Facebook</option>
                        <option>LinkedIn</option>
                        <option>Instagram</option>
                        <option>Referred by someone</option>
                        <option>Other</option>
                      </select>
                    </Field>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1 || submitting}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-lime px-5 py-2.5 text-sm font-medium text-lime-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Continue <ArrowUpRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit application"} <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-ink/55">
          After submitting you will continue to the{" "}
          <Link to="/careers/assessment" className="font-medium text-ink underline-offset-4 hover:underline">
            Skills Profile Review
          </Link>
          .
        </p>
      </div>
      <style>{`
        .ipt { width: 100%; max-width: 100%; box-sizing: border-box; min-width: 0; border-radius: 0.875rem; border: 1px solid var(--border); background: var(--cream); padding: 0.75rem 0.875rem; font-size: 16px; color: var(--ink); outline: none; transition: border-color .15s, box-shadow .15s; }
        .ipt-grow { width: auto; flex: 1 1 0%; min-width: 0; }
        .ipt-code { flex: 0 0 4.25rem; width: 4.25rem; max-width: 30%; box-sizing: border-box; border-radius: 0.875rem; border: 1px solid var(--border); background: var(--cream); padding: 0.75rem 0.25rem; font-size: 0.8125rem; font-weight: 600; color: var(--ink); text-align: center; outline: none; }
        .ipt:focus, .ipt-code:focus { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in oklab, var(--lime) 50%, transparent); }
      `}</style>
    </section>
  );
}

function ResumeFileBadge({ file }: { file: File }) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf" || file.type === "application/pdf";
  return (
    <div
      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-white ${isPdf ? "bg-red-600" : "bg-blue-700"}`}
      aria-hidden
    >
      <FileText className="h-5 w-5" />
      <span className="mt-0.5 text-[9px] font-bold uppercase leading-none">{isPdf ? "PDF" : "DOC"}</span>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
