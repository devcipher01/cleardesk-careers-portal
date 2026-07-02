/** Validate national number (digits only) for a given E.164 dial code. */
export function validatePhoneNumber(dialCode: string, national: string): true | string {
  const digits = national.replace(/\D/g, "");
  if (!digits) return "Phone number is required";
  if (!/^\+\d{1,4}$/.test(dialCode)) return "Select a valid country code";

  if (dialCode === "+1") {
    if (digits.length !== 10) return "Enter a 10-digit number for US/Canada";
    return true;
  }
  if (dialCode === "+44") {
    if (digits.length < 10 || digits.length > 11) return "Enter a valid UK number (10–11 digits)";
    return true;
  }
  if (dialCode === "+63") {
    if (digits.length < 10 || digits.length > 11) return "Enter a valid Philippines number (10–11 digits)";
    return true;
  }
  if (digits.length < 6 || digits.length > 12) {
    return "Enter a valid phone number (6–12 digits)";
  }
  return true;
}

export function formatFullPhone(dialCode: string, national: string): string {
  const digits = national.replace(/\D/g, "");
  return `${dialCode} ${digits}`;
}
