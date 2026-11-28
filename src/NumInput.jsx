import { forwardRef, useLayoutEffect, useRef } from "react";
import { cleanInput, fmtExpr } from "./calc.js";

// ช่องกรอกที่ใส่ลูกน้ำให้อัตโนมัติตอนพิมพ์ (เก็บค่าจริงแบบไม่มีลูกน้ำ)
// onChange ส่งค่าที่ไม่มีลูกน้ำกลับมา และเคอร์เซอร์ไม่เด้งไปท้ายช่อง
const NumInput = forwardRef(function NumInput({ value, onChange, ...rest }, ref) {
  const inner = useRef(null);
  const caret = useRef(null);

  const setRefs = (el) => {
    inner.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  useLayoutEffect(() => {
    const el = inner.current;
    if (caret.current !== null && el && document.activeElement === el) {
      el.setSelectionRange(caret.current, caret.current);
    }
    caret.current = null;
  });

  const handle = (e) => {
    const el = e.target;
    const typedBefore = el.value.slice(0, el.selectionStart).replace(/,/g, "").length;
    const raw = cleanInput(el.value).replace(/,/g, "");
    if (raw === String(value ?? "")) { caret.current = null; return; }

    const shown = fmtExpr(raw);
    let count = 0, idx = 0;
    while (idx < shown.length && count < typedBefore) {
      if (shown[idx] !== ",") count++;
      idx++;
    }
    caret.current = idx;
    onChange(raw);
  };

  return <input ref={setRefs} value={fmtExpr(value)} onChange={handle} {...rest} />;
});

export default NumInput;
