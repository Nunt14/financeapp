import { useEffect, useMemo, useState } from "react";

// ---------- ตัวคำนวณ (ไม่ใช้ eval) รองรับ + - * / ( ) และทศนิยม ----------
export function evaluate(src) {
  const s = String(src ?? "")
    .replace(/,/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "");
  if (!s) return null;
  let i = 0;
  const peek = () => s[i];

  function expr() {
    let v = term();
    if (v === null) return null;
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const r = term();
      if (r === null) return null;
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function term() {
    let v = unary();
    if (v === null) return null;
    while (peek() === "*" || peek() === "/") {
      const op = s[i++];
      const r = unary();
      if (r === null) return null;
      if (op === "/" && r === 0) return null;
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function unary() {
    if (peek() === "-") { i++; const v = unary(); return v === null ? null : -v; }
    if (peek() === "+") { i++; return unary(); }
    return primary();
  }
  function primary() {
    if (peek() === "(") {
      i++;
      const v = expr();
      if (v === null || peek() !== ")") return null;
      i++;
      return v;
    }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (!m) return null;
    i += m[0].length;
    return parseFloat(m[0]);
  }

  const result = expr();
  if (result === null || i !== s.length || !Number.isFinite(result)) return null;
  return Math.round(result * 1e8) / 1e8;
}

export const startsWithOp = (s) => /^\s*[+\-*/×÷]/.test(s);
export const cleanInput = (v) => v.replace(/[^0-9+\-*/().,×÷ ]/g, "");

// ใส่ลูกน้ำให้ตัวเลขทุกตัวในสูตร เช่น "1234567+89000" -> "1,234,567+89,000"
export function fmtExpr(s) {
  return String(s ?? "")
    .replace(/,/g, "")
    .replace(/(\d+)(\.\d*)?|\.\d+/g, (m, int, dec) =>
      int === undefined ? m : int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec || "")
    );
}

export function fmt(n) {
  if (n === null || n === undefined) return "–";
  const x = Object.is(n, -0) ? 0 : n;
  return x.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// ---------- เก็บข้อมูลในเครื่อง (localStorage) ----------
export function useLocal(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

// ---------- ประวัติการคำนวณ ----------
// mode "chain": บรรทัดที่ขึ้นต้นด้วย + - × ÷ จะต่อจากผลของบรรทัดก่อนหน้า (แก้บรรทัดบน ผลล่างเปลี่ยนตาม)
// mode "sum"  : ทุกบรรทัดเป็นตัวเลขที่เอามาบวกรวมกัน (ใช้ในหน้าครบ 5,000)
export function useTape(key, mode) {
  const [entries, setEntries] = useLocal(key, []);

  const { rows, total, last } = useMemo(() => {
    let prev = 0;
    let sum = 0;
    const rows = entries.map((e) => {
      const chain = mode === "chain" && startsWithOp(e.expr);
      const full = chain ? `(${prev})${e.expr}` : e.expr;
      const value = evaluate(full);
      if (value !== null) {
        prev = value;
        sum += value;
      }
      return { id: e.id, expr: e.expr, value };
    });
    return { rows, total: sum, last: prev };
  }, [entries, mode]);

  return {
    mode,
    rows,
    total,
    last,
    add: (expr) => setEntries((l) => [...l, { id: Date.now() + Math.random(), expr }]),
    update: (id, expr) => setEntries((l) => l.map((e) => (e.id === id ? { ...e, expr } : e))),
    remove: (id) => setEntries((l) => l.filter((e) => e.id !== id)),
    clear: () => setEntries([]),
  };
}
