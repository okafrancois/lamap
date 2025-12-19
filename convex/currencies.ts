import { v } from "convex/values";

export type Currency = "XAF" | "EUR" | "USD";

export const SUPPORTED_CURRENCIES: Currency[] = ["XAF", "EUR", "USD"];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  XAF: "FCFA",
  EUR: "€",
  USD: "$",
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  XAF: "Franc CFA",
  EUR: "Euro",
  USD: "Dollar US",
};

export const BET_AMOUNTS: Record<Currency, number[]> = {
  XAF: [50, 100, 500, 1000, 5000, 10000, 50000],
  EUR: [1, 2, 5, 10, 50, 100, 500],
  USD: [1, 2, 5, 10, 50, 100, 500],
};

export const DEFAULT_STARTING_BALANCE: Record<Currency, number> = {
  XAF: 1000,
  EUR: 10,
  USD: 10,
};

export const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  CM: "XAF",
  SN: "XAF",
  CI: "XAF",
  BJ: "XAF",
  BF: "XAF",
  TG: "XAF",
  NE: "XAF",
  ML: "XAF",
  GA: "XAF",
  CG: "XAF",
  TD: "XAF",
  CF: "XAF",
  GQ: "XAF",
  GN: "XAF",
  FR: "EUR",
  BE: "EUR",
  CH: "EUR",
  LU: "EUR",
  MC: "EUR",
  DE: "EUR",
  IT: "EUR",
  ES: "EUR",
  PT: "EUR",
  NL: "EUR",
  AT: "EUR",
  IE: "EUR",
  FI: "EUR",
  GR: "EUR",
  SI: "EUR",
  CY: "EUR",
  MT: "EUR",
  SK: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  US: "USD",
  CA: "USD",
  GB: "USD",
  AU: "USD",
  NZ: "USD",
};

export function formatAmount(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  
  if (currency === "XAF") {
    return `${amount.toLocaleString("fr-FR")} ${symbol}`;
  }
  
  if (currency === "EUR") {
    return `${amount.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${symbol}`;
  }
  
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getCurrencyFromCountry(countryCode: string): Currency {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || "USD";
}

export function isValidBetAmount(amount: number, currency: Currency): boolean {
  return BET_AMOUNTS[currency].includes(amount);
}

export function getMinimumBalance(betAmount: number): number {
  return betAmount * 3;
}

