import NumInput from "./NumInput.jsx";
import { evaluate, fmt, useLocal } from "./calc.js";

/* ---------- ตัวช่วยเรื่องวันที่ (ใช้เวลาท้องถิ่น ไม่ให้วันเพี้ยน) ---------- */
const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (s, n) => {
  const [y, m, d] = s.split("-").map(Number);
  return toStr(new Date(y, m - 1, d + n));
};
const thaiDate = (s) => {
  if (!s) return "ยังไม่ได้เลือกวันที่";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
};

const MIN_DAYS = 3;
const SHIFTS = [["morning", "กะเช้า"], ["night", "กะดึก"]];

const newDay = (date) => ({
  id: Date.now() + Math.random(),
  date,
  morning: { amt: "", done: false },
  night: { amt: "", done: false },
});
const initialDays = () => {
  const today = toStr(new Date());
  return [0, 1, 2].map((i) => newDay(addDays(today, i)));
};

/* ---------- หนึ่งหมวด (เช่น คาเฟ่) ---------- */
function DepositSection({ title, storageKey, tone }) {
  const [days, setDays] = useLocal(storageKey, initialDays());

  const patchDay = (id, fn) => setDays((l) => l.map((d) => (d.id === id ? fn(d) : d)));
  const setShift = (id, shift, change) =>
    patchDay(id, (d) => ({ ...d, [shift]: { ...d[shift], ...change } }));

  const addDay = () =>
    setDays((l) => {
      const last = l[l.length - 1]?.date;
      return [...l, newDay(last ? addDays(last, 1) : toStr(new Date()))];
    });

  const shifts = days.flatMap((d) => [d.morning, d.night]);
  const val = (s) => evaluate(s.amt) ?? 0;
  const total = shifts.reduce((a, s) => a + val(s), 0);
  const allDone = shifts.length > 0 && shifts.every((s) => s.done);

  const setAllDone = (done) =>
    setDays((l) => l.map((d) => ({ ...d, morning: { ...d.morning, done }, night: { ...d.night, done } })));
  const clearAmounts = () =>
    setDays((l) => l.map((d) => ({ ...d, morning: { amt: "", done: false }, night: { amt: "", done: false } })));

  return (
    <section className="dep-section">
      <div className={"stat " + tone}>
        <span>{title} · ยอดรวม</span>
        <strong>{fmt(total)}</strong>
      </div>

      <div className="dep-tools">
        <button className="link-btn" onClick={() => setAllDone(!allDone)}>
          {allDone ? "ยกเลิกติ๊กทั้งหมด" : "ติ๊กถูกทั้งหมด"}
        </button>
        <button className="link-btn" onClick={() => confirm("ล้างยอดเงินและเครื่องหมายถูกทั้งหมด?") && clearAmounts()}>
          ล้างยอดทั้งหมด
        </button>
      </div>

      {days.map((d) => {
        const daySum = val(d.morning) + val(d.night);
        return (
          <div className="card day" key={d.id}>
            <div className="day-head">
              <input
                type="date"
                className="date-input"
                value={d.date}
                onChange={(e) => patchDay(d.id, (x) => ({ ...x, date: e.target.value }))}
                aria-label="เลือกวันที่"
              />
              <span className="date-th">{thaiDate(d.date)}</span>
              {days.length > MIN_DAYS && (
                <button
                  className="x"
                  onClick={() => setDays((l) => l.filter((x) => x.id !== d.id))}
                  aria-label="ลบวันนี้"
                >×</button>
              )}
            </div>

            {SHIFTS.map(([key, label]) => (
              <div className={"shift" + (d[key].done ? " done" : "")} key={key}>
                <span className="shift-name">{label}</span>
                <NumInput
                  className="box"
                  value={d[key].amt}
                  inputMode="decimal"
                  placeholder="0"
                  onChange={(v) => setShift(d.id, key, { amt: v })}
                />
                <input
                  type="checkbox"
                  className="tick"
                  checked={d[key].done}
                  onChange={(e) => setShift(d.id, key, { done: e.target.checked })}
                  aria-label={`ยืนยัน${label}ถูกต้อง`}
                />
              </div>
            ))}

            <div className="day-sum">รวมวันนี้ <b>{fmt(daySum)}</b></div>
          </div>
        );
      })}

      <button className="add-day" onClick={addDay}>＋ เพิ่มวัน</button>
    </section>
  );
}

export default function DepositPage() {
  return (
    <div className="dep-grid">
      <DepositSection title="คาเฟ่" storageKey="deposit-cafe" tone="cafe" />
      <DepositSection title="โรงพยาบาล" storageKey="deposit-hospital" tone="hospital" />
    </div>
  );
}
