export type CurrencyType =
  | "gold"
  | "gems";

export interface CurrencyWallet {
  gold: number;
  gems: number;
}

export interface CurrencyTransaction {
  currency: CurrencyType;
  amount: number;
  reason: string;
}

export function createInitialWallet(): CurrencyWallet {
  return {
    gold: 100,
    gems: 0
  };
}

export function addCurrency(
  wallet: CurrencyWallet,
  currency: CurrencyType,
  amount: number
): CurrencyWallet {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Currency amount must be a positive integer");
  }

  return {
    ...wallet,
    [currency]: wallet[currency] + amount
  };
}

export function spendCurrency(
  wallet: CurrencyWallet,
  currency: CurrencyType,
  amount: number
): CurrencyWallet {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Currency amount must be a positive integer");
  }

  if (wallet[currency] < amount) {
    throw new Error("Not enough currency");
  }

  return {
    ...wallet,
    [currency]: wallet[currency] - amount
  };
}

export function canAfford(
  wallet: CurrencyWallet,
  currency: CurrencyType,
  amount: number
): boolean {
  return (
    Number.isInteger(amount) &&
    amount >= 0 &&
    wallet[currency] >= amount
  );
}

export function getTotalCurrencyValue(
  wallet: CurrencyWallet
): number {
  return wallet.gold + wallet.gems;
}