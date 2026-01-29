import type { Tx } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatKRW(value: number) {
  return `${Math.abs(value).toLocaleString("ko-KR")}원`;
}

export function formatNum(value: number) {
  return Math.abs(value).toLocaleString("ko-KR");
}

export function toISODate(y: number, m0: number, d: number) {
  const mm = String(m0 + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function sumIncome(txs: Tx[]) {
  return txs.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
}

export function sumExpense(txs: Tx[]) {
  const raw = txs.filter((t) => t.amount < 0).reduce((acc, t) => acc + t.amount, 0);
  return Math.abs(raw);
}
