import { useEffect, useRef, useState } from "react";
import { evaluate, fmt, startsWithOp } from "./calc.js";
import NumInput from "./NumInput.jsx";

const KEYS = [
  ["7", "7"], ["8", "8"], ["9", "9"], ["÷", "÷"],
  ["4", "4"], ["5", "5"], ["6", "6"], ["×", "×"],
  ["1", "1"], ["2", "2"], ["3", "3"], ["−", "-"],
  ["0", "0"], [".", "."], ["⌫", "BACK"], ["+", "+"],
];

export default function Tape({ tape, placeholder }) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const { mode, rows } = tape;

  // พิมพ์ตัวเลข/เครื่องหมายจากคีย์บอร์ดตรงไหนของหน้าก็ได้ จะเด้งเข้าช่องกรอก
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9+\-*/.()]$/.test(e.key)) inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [rows.length]);

  const preview = (() => {
    if (!draft.trim()) return null;
    const chain = mode === "chain" && startsWithOp(draft);
    return evaluate(chain ? `(${tape.last})${draft}` : draft);
  })();

  const commit = () => {
    if (!draft.trim() || preview === null) return;
    tape.add(draft.trim());
    setDraft("");
  };

  const press = (k) => {
    if (k === "BACK") setDraft((d) => d.slice(0, -1));
    else setDraft((d) => d + k);
    inputRef.current?.focus();
  };

  return (
    <div className="tape-wrap">
      <div className="card tape">
        <div className="tape-head">
          <h2>ประวัติการคำนวณ</h2>
          {rows.length > 0 && (
            <button className="link-btn" onClick={() => confirm("ล้างประวัติทั้งหมด?") && tape.clear()}>
              ล้างทั้งหมด
            </button>
          )}
        </div>

        <div className="tape-list" ref={listRef}>
          {rows.length === 0 && (
            <p className="empty">
              ยังไม่มีรายการ พิมพ์ตัวเลขด้านล่างแล้วกด Enter
              {mode === "chain" && <><br />พิมพ์เครื่องหมายนำหน้า เช่น +500 เพื่อต่อจากผลก่อนหน้า</>}
            </p>
          )}
          {rows.map((r) => (
            <div className="tape-row" key={r.id}>
              <NumInput
                className="expr"
                value={r.expr}
                inputMode="decimal"
                onChange={(v) => tape.update(r.id, v)}
                aria-label="แก้ไขรายการ"
              />
              <span className={"eq" + (r.value === null ? " bad" : "")}>
                = {r.value === null ? "ผิดพลาด" : fmt(r.value)}
              </span>
              <button className="x" onClick={() => tape.remove(r.id)} aria-label="ลบรายการ">×</button>
            </div>
          ))}
        </div>

        <div className="draft">
          <NumInput
            ref={inputRef}
            className="draft-input"
            value={draft}
            inputMode="decimal"
            placeholder={placeholder || "พิมพ์ตัวเลข เช่น 1200+350"}
            onChange={setDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "=") { e.preventDefault(); commit(); }
              if (e.key === "Escape") setDraft("");
            }}
          />
          <span className="draft-preview">{preview === null ? "" : "= " + fmt(preview)}</span>
        </div>
      </div>

      <div className="keypad">
        {KEYS.map(([label, val]) => (
          <button key={label} className={"key" + (/[÷×−+]/.test(label) ? " op" : "")} onClick={() => press(val)}>
            {label}
          </button>
        ))}
        <button className="key clear" onClick={() => setDraft("")}>ล้างช่อง</button>
        <button className="key enter" onClick={commit}>เพิ่ม (Enter)</button>
      </div>
    </div>
  );
}
