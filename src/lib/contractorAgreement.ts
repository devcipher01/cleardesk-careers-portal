export const CONTRACTOR_HOURLY_RATE = "$24.50";

export const CONTRACTOR_AGREEMENT_SECTIONS = [
  {
    title: "Independent contractor relationship",
    body:
      "You are engaged as an independent contractor, not an employee. You are responsible for your own taxes, equipment, and working environment unless otherwise stated in writing by Worknesta.",
  },
  {
    title: "Compensation",
    body: `Your contracted rate is ${CONTRACTOR_HOURLY_RATE} USD per hour for approved production work. Payments are disbursed weekly via Wise or Payoneer after tasks pass quality review.`,
  },
  {
    title: "Accuracy and turnaround",
    body:
      "All submitted work must meet a minimum 97% accuracy standard. Tasks must be completed within assigned deadlines. Request extensions at least two hours before a deadline when needed.",
  },
  {
    title: "Confidentiality",
    body:
      "Client data, training materials, and internal workflows are confidential. You may not copy, share, or store production data outside approved Worknesta systems.",
  },
  {
    title: "Communication",
    body:
      "Respond to supervisor messages within four hours during your agreed working hours. Notify your lead in advance if you will be unavailable.",
  },
] as const;
