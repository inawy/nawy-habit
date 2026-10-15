/**
 * One digit style for the whole app: Western digits inside Arabic text.
 * `toLocaleString("ar")` alone gives Arabic-Indic digits on some devices and
 * Western on others, so numbers are formatted through this helper instead.
 */
const fmt = new Intl.NumberFormat("ar-u-nu-latn");

export const num = (value: number): string => fmt.format(value);

/** Arabic date/time formatters that keep the same Western digits. */
export const arabicFmt = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat("ar-u-nu-latn", options);
