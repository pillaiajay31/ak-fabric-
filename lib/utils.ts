import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert numbers to Indian Rupees in words (e.g. 78639 -> "SEVENTY EIGHT THOUSAND SIX HUNDRED THIRTY NINE ONLY")
export function numberToWordsIndian(num: number): string {
  const roundNum = Math.round(num);
  if (roundNum === 0) return "ZERO ONLY";

  const units = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
    "SEVENTEEN", "EIGHTEEN", "NINETEEN"
  ];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? " " + units[unit] : "");
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = "";
    if (hundred) {
      res += units[hundred] + " HUNDRED";
      if (rest) res += " ";
    }
    if (rest) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let words = "";
  let n = roundNum;

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;

  if (crore > 0) {
    words += convertThreeDigits(crore) + " CRORE ";
  }
  if (lakh > 0) {
    words += convertThreeDigits(lakh) + " LAKH ";
  }
  if (thousand > 0) {
    words += convertThreeDigits(thousand) + " THOUSAND ";
  }
  if (n > 0) {
    words += convertThreeDigits(n);
  }

  return words.trim() + " ONLY";
}

export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateIndian(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateStr;
  }
}

