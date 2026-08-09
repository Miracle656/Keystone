"use client";

import { useEffect, useState } from "react";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

const CURRENCY_KEY = "keystone:displayCurrency";
const RAW_VALUES_KEY = "keystone:rawValues";

function isCurrencyCode(v: string | null): v is CurrencyCode {
  return v !== null && (CURRENCIES as readonly string[]).includes(v);
}

/** Display-currency and raw-values are user preferences that should hold across the whole app,
 * not reset per page — persisted to localStorage. Reads happen in an effect (not the initial
 * state) so server and first client render both produce the default and avoid a hydration
 * mismatch; the real stored value applies a moment later. */
export function useDisplayCurrency(): [CurrencyCode, (c: CurrencyCode) => void] {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_KEY);
    if (isCurrencyCode(stored)) setCurrencyState(stored);
  }, []);

  function setCurrency(c: CurrencyCode) {
    setCurrencyState(c);
    localStorage.setItem(CURRENCY_KEY, c);
  }

  return [currency, setCurrency];
}

export function useRawValues(): [boolean, (raw: boolean) => void] {
  const [raw, setRawState] = useState(false);

  useEffect(() => {
    setRawState(localStorage.getItem(RAW_VALUES_KEY) === "1");
  }, []);

  function setRaw(v: boolean) {
    setRawState(v);
    localStorage.setItem(RAW_VALUES_KEY, v ? "1" : "0");
  }

  return [raw, setRaw];
}
