
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

function isCurrencyType(
  currency: unknown
): currency is CurrencyType {
  return (
    currency === "gold" ||
    currency === "gems"
  );
}

function isValidCurrencyAmount(
  amount: number
): boolean {
  return (
    Number.isSafeInteger(amount) &&
    amount >= 0
  );
}

function isValidCurrencyWallet(
  wallet: CurrencyWallet
): boolean {
  if (
    typeof wallet !== "object" ||
    wallet === null
  ) {
    return false;
  }

  return (
    isValidCurrencyAmount(wallet.gold) &&
    isValidCurrencyAmount(wallet.gems)
  );
}

function validateWallet(
  wallet: CurrencyWallet
): void {
  if (!isValidCurrencyWallet(wallet)) {
    throw new Error("Invalid currency wallet");
  }
}

function validateCurrency(
  currency: CurrencyType
): void {
  if (!isCurrencyType(currency)) {
    throw new Error("Invalid currency type");
  }
}

function validatePositiveAmount(
  amount: number
): void {
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Currency amount must be a positive safe integer"
    );
  }
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
  validateWallet(wallet);
  validateCurrency(currency);
  validatePositiveAmount(amount);

  const nextBalance = wallet[currency] + amount;

  if (!Number.isSafeInteger(nextBalance)) {
    throw new Error("Currency balance overflow");
  }

  return {
    ...wallet,
    [currency]: nextBalance
  };
}

export function spendCurrency(
  wallet: CurrencyWallet,
  currency: CurrencyType,
  amount: number
): CurrencyWallet {
  validateWallet(wallet);
  validateCurrency(currency);
  validatePositiveAmount(amount);

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
  if (
    !isValidCurrencyWallet(wallet) ||
    !isCurrencyType(currency) ||
    !isValidCurrencyAmount(amount)
  ) {
    return false;
  }

  return wallet[currency] >= amount;
}

export function getTotalCurrencyValue(
  wallet: CurrencyWallet
): number {
  validateWallet(wallet);

  const total = wallet.gold + wallet.gems;

  if (!Number.isSafeInteger(total)) {
    throw new Error("Total currency value overflow");
  }

  return total;
}
