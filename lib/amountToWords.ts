const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
];

function tensToWords(value: number): string {
  if (value < 17) return UNITS[value];
  if (value < 20) return `dix-${UNITS[value - 10]}`;
  if (value < 70) {
    const ten = Math.floor(value / 10);
    const unit = value % 10;
    const tenWord = ["vingt", "trente", "quarante", "cinquante", "soixante"][ten - 2];
    if (unit === 0) return tenWord;
    if (unit === 1) return `${tenWord} et un`;
    return `${tenWord}-${UNITS[unit]}`;
  }
  if (value < 80) return value === 71 ? "soixante et onze" : `soixante-${tensToWords(value - 60)}`;
  const rest = value - 80;
  if (rest === 0) return "quatre-vingts";
  return `quatre-vingt-${tensToWords(rest)}`;
}

function belowThousand(value: number): string {
  if (value < 100) return tensToWords(value);
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const hundredWord = hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent${rest === 0 ? "s" : ""}`;
  if (rest === 0) return hundredWord;
  return `${hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent`} ${tensToWords(rest)}`;
}

function integerToWords(value: number): string {
  if (value < 1000) return belowThousand(value);
  if (value < 1_000_000) {
    const thousands = Math.floor(value / 1000);
    const rest = value % 1000;
    const thousandWord = thousands === 1 ? "mille" : `${belowThousand(thousands)} mille`;
    if (rest === 0) return thousandWord;
    return `${thousandWord} ${belowThousand(rest)}`;
  }
  const millions = Math.floor(value / 1_000_000);
  const rest = value % 1_000_000;
  const millionWord = millions === 1 ? "un million" : `${integerToWords(millions)} millions`;
  if (rest === 0) return millionWord;
  return `${millionWord} ${integerToWords(rest)}`;
}

export function amountToWordsFr(amount: number) {
  const safe = Math.round((Number(amount) || 0) * 100) / 100;
  const euros = Math.floor(safe);
  const cents = Math.round((safe - euros) * 100);
  const euroLabel = euros <= 1 ? "euro" : "euros";
  let result = `${integerToWords(euros)} ${euroLabel}`;
  if (cents > 0) {
    const centLabel = cents <= 1 ? "centime" : "centimes";
    result += ` et ${integerToWords(cents)} ${centLabel}`;
  }
  return result;
}
