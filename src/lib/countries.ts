/** Hiring regions: Americas, Europe, and select Asia-Pacific (no India or China). */

export type CountryOption = {
  name: string;
  dialCode: string;
  /** IANA timezone used when applicant does not pick one (stored server-side only). */
  defaultTimezone: string;
};

export const HIRING_COUNTRIES: CountryOption[] = [
  // Americas
  { name: "United States", dialCode: "+1", defaultTimezone: "America/New_York" },
  { name: "Canada", dialCode: "+1", defaultTimezone: "America/Toronto" },
  { name: "Mexico", dialCode: "+52", defaultTimezone: "America/Mexico_City" },
  { name: "Costa Rica", dialCode: "+506", defaultTimezone: "America/Costa_Rica" },
  { name: "Panama", dialCode: "+507", defaultTimezone: "America/Panama" },
  { name: "Colombia", dialCode: "+57", defaultTimezone: "America/Bogota" },
  { name: "Argentina", dialCode: "+54", defaultTimezone: "America/Argentina/Buenos_Aires" },
  { name: "Chile", dialCode: "+56", defaultTimezone: "America/Santiago" },
  { name: "Peru", dialCode: "+51", defaultTimezone: "America/Lima" },
  { name: "Ecuador", dialCode: "+593", defaultTimezone: "America/Guayaquil" },
  { name: "Uruguay", dialCode: "+598", defaultTimezone: "America/Montevideo" },
  { name: "Paraguay", dialCode: "+595", defaultTimezone: "America/Asuncion" },
  { name: "Bolivia", dialCode: "+591", defaultTimezone: "America/La_Paz" },
  { name: "Guatemala", dialCode: "+502", defaultTimezone: "America/Guatemala" },
  { name: "Honduras", dialCode: "+504", defaultTimezone: "America/Tegucigalpa" },
  { name: "El Salvador", dialCode: "+503", defaultTimezone: "America/El_Salvador" },
  { name: "Nicaragua", dialCode: "+505", defaultTimezone: "America/Managua" },
  { name: "Dominican Republic", dialCode: "+1", defaultTimezone: "America/Santo_Domingo" },
  { name: "Puerto Rico", dialCode: "+1", defaultTimezone: "America/Puerto_Rico" },
  { name: "Jamaica", dialCode: "+1", defaultTimezone: "America/Jamaica" },
  { name: "Trinidad and Tobago", dialCode: "+1", defaultTimezone: "America/Port_of_Spain" },
  { name: "Barbados", dialCode: "+1", defaultTimezone: "America/Barbados" },
  { name: "Bahamas", dialCode: "+1", defaultTimezone: "America/Nassau" },
  { name: "Belize", dialCode: "+501", defaultTimezone: "America/Belize" },
  // Europe
  { name: "United Kingdom", dialCode: "+44", defaultTimezone: "Europe/London" },
  { name: "Ireland", dialCode: "+353", defaultTimezone: "Europe/Dublin" },
  { name: "Germany", dialCode: "+49", defaultTimezone: "Europe/Berlin" },
  { name: "France", dialCode: "+33", defaultTimezone: "Europe/Paris" },
  { name: "Spain", dialCode: "+34", defaultTimezone: "Europe/Madrid" },
  { name: "Italy", dialCode: "+39", defaultTimezone: "Europe/Rome" },
  { name: "Netherlands", dialCode: "+31", defaultTimezone: "Europe/Amsterdam" },
  { name: "Belgium", dialCode: "+32", defaultTimezone: "Europe/Brussels" },
  { name: "Portugal", dialCode: "+351", defaultTimezone: "Europe/Lisbon" },
  { name: "Poland", dialCode: "+48", defaultTimezone: "Europe/Warsaw" },
  { name: "Sweden", dialCode: "+46", defaultTimezone: "Europe/Stockholm" },
  { name: "Norway", dialCode: "+47", defaultTimezone: "Europe/Oslo" },
  { name: "Denmark", dialCode: "+45", defaultTimezone: "Europe/Copenhagen" },
  { name: "Finland", dialCode: "+358", defaultTimezone: "Europe/Helsinki" },
  { name: "Austria", dialCode: "+43", defaultTimezone: "Europe/Vienna" },
  { name: "Switzerland", dialCode: "+41", defaultTimezone: "Europe/Zurich" },
  { name: "Czech Republic", dialCode: "+420", defaultTimezone: "Europe/Prague" },
  { name: "Romania", dialCode: "+40", defaultTimezone: "Europe/Bucharest" },
  { name: "Greece", dialCode: "+30", defaultTimezone: "Europe/Athens" },
  { name: "Hungary", dialCode: "+36", defaultTimezone: "Europe/Budapest" },
  { name: "Croatia", dialCode: "+385", defaultTimezone: "Europe/Zagreb" },
  { name: "Slovakia", dialCode: "+421", defaultTimezone: "Europe/Bratislava" },
  { name: "Slovenia", dialCode: "+386", defaultTimezone: "Europe/Ljubljana" },
  { name: "Lithuania", dialCode: "+370", defaultTimezone: "Europe/Vilnius" },
  { name: "Latvia", dialCode: "+371", defaultTimezone: "Europe/Riga" },
  { name: "Estonia", dialCode: "+372", defaultTimezone: "Europe/Tallinn" },
  { name: "Luxembourg", dialCode: "+352", defaultTimezone: "Europe/Luxembourg" },
  { name: "Malta", dialCode: "+356", defaultTimezone: "Europe/Malta" },
  { name: "Cyprus", dialCode: "+357", defaultTimezone: "Asia/Nicosia" },
  { name: "Iceland", dialCode: "+354", defaultTimezone: "Atlantic/Reykjavik" },
  { name: "Bulgaria", dialCode: "+359", defaultTimezone: "Europe/Sofia" },
  { name: "Serbia", dialCode: "+381", defaultTimezone: "Europe/Belgrade" },
  { name: "North Macedonia", dialCode: "+389", defaultTimezone: "Europe/Skopje" },
  { name: "Albania", dialCode: "+355", defaultTimezone: "Europe/Tirane" },
  { name: "Bosnia and Herzegovina", dialCode: "+387", defaultTimezone: "Europe/Sarajevo" },
  { name: "Montenegro", dialCode: "+382", defaultTimezone: "Europe/Podgorica" },
  { name: "Ukraine", dialCode: "+380", defaultTimezone: "Europe/Kyiv" },
  // Asia-Pacific (selected)
  { name: "Philippines", dialCode: "+63", defaultTimezone: "Asia/Manila" },
  { name: "Thailand", dialCode: "+66", defaultTimezone: "Asia/Bangkok" },
  { name: "Vietnam", dialCode: "+84", defaultTimezone: "Asia/Ho_Chi_Minh" },
  { name: "Malaysia", dialCode: "+60", defaultTimezone: "Asia/Kuala_Lumpur" },
  { name: "Singapore", dialCode: "+65", defaultTimezone: "Asia/Singapore" },
  { name: "Indonesia", dialCode: "+62", defaultTimezone: "Asia/Jakarta" },
  { name: "Japan", dialCode: "+81", defaultTimezone: "Asia/Tokyo" },
  { name: "South Korea", dialCode: "+82", defaultTimezone: "Asia/Seoul" },
  { name: "Taiwan", dialCode: "+886", defaultTimezone: "Asia/Taipei" },
  { name: "Cambodia", dialCode: "+855", defaultTimezone: "Asia/Phnom_Penh" },
  { name: "Laos", dialCode: "+856", defaultTimezone: "Asia/Vientiane" },
  { name: "Brunei", dialCode: "+673", defaultTimezone: "Asia/Brunei" },
];

export const COUNTRIES = HIRING_COUNTRIES.map((c) => c.name).sort((a, b) => a.localeCompare(b));

export const HOURS_PER_WEEK_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60] as const;

export function getCountryByName(name: string): CountryOption | undefined {
  return HIRING_COUNTRIES.find((c) => c.name === name);
}

export function timezoneLabelForCountry(countryName: string): string {
  const c = getCountryByName(countryName);
  const tz = c?.defaultTimezone ?? "UTC";
  try {
    const offset = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    return `${offset ?? "GMT"} — ${tz.replace(/_/g, " ")} (${countryName})`;
  } catch {
    return `${tz} (${countryName})`;
  }
}
