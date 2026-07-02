import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

export function Section({ id, className = "", children }: SectionProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`py-16 md:py-24 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  italicWord,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  italicWord?: string;
  description?: string;
  align?: "center" | "left";
}) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
          {eyebrow}
        </p>
      )}
      <h2 className="text-balance text-3xl font-medium leading-[1.05] text-ink md:text-5xl">
        {title}{" "}
        {italicWord && <span className="font-serif italic text-ink/80">{italicWord}</span>}
      </h2>
      {description && (
        <p className="mt-4 max-w-xl text-base text-ink/60 md:text-lg">{description}</p>
      )}
    </div>
  );
}
