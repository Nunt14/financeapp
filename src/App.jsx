import { useState } from "react";
import Tape from "./Tape.jsx";
import NumInput from "./NumInput.jsx";
import DepositPage from "./Deposit.jsx";
import { evaluate, fmt, useLocal, useTape } from "./calc.js";

/* ------------------------- หน้า 1: เครื่องคิดเลข ------------------------- */
function CalculatorPage() {
  const tape = useTape("calc-tape", "chain");
  return (
    <>
      <h1>เครื่องคิดเลข</h1>
      <div className="big-result">
        <span>ผลล่าสุด</span>
        <strong>{fmt(tape.last)}</strong>
      </div>
      <Tape tape={tape} />
    </>
  );
}

/* ------------------------- หน้า 2: สรุปรายรับ ------------------------- */
function MoneyField({ label, value, onChange, plus }) {
  return (
    <div className="field">
      <label>{label}</label>
      <span className="sign">=</span>
      <NumInput
        className="box"
        value={value}
        inputMode="decimal"
        placeholder="0"
        onChange={onChange}
      />
      {plus && <>{plus}</>}
    </div>
  );
}

const EMPTY = { total: "", exp1: "", exp2: "", credit: "", check: "", transfer: "" };

function SummaryPage() {
  const [f, setF] = useLocal("summary", EMPTY);
  const set = (k) => (v) => setF((o) => ({ ...o, [k]: v }));
  const n = (k) => evaluate(f[k]) ?? 0;
  const spend = n("exp1") + n("exp2");
  const income = n("total") - spend - n("credit") - n("check") - n("transfer");

  return (
    <>
      <h1>สรุปรายรับ</h1>
      <div className="card form">
        <MoneyField label="เงินรวม" value={f.total} onChange={set("total")} />

        <div className="field">
          <label>รายจ่าย</label>
          <span className="sign">=</span>
          <NumInput className="box" value={f.exp1} inputMode="decimal" placeholder="0"
            onChange={set("exp1")} />
          <span className="sign">+</span>
          <NumInput className="box" value={f.exp2} inputMode="decimal" placeholder="0"
            onChange={set("exp2")} />
        </div>

        <MoneyField label="เครดิต" value={f.credit} onChange={set("credit")} />
        <MoneyField label="เช็ค" value={f.check} onChange={set("check")} />
        <MoneyField label="เงินโอน" value={f.transfer} onChange={set("transfer")} />

        <p className="hint">ช่องกรอกพิมพ์สูตรได้ เช่น 500+250-30</p>

        <div className="income">
          <span>รายรับ</span>
          <strong>{fmt(income)}</strong>
        </div>

        <button className="link-btn" onClick={() => confirm("ล้างทุกช่อง?") && setF(EMPTY)}>
          ล้างทุกช่อง
        </button>
      </div>
    </>
  );
}

/* ------------------------- หน้า 3: บวกให้ครบเป้า ------------------------- */
function TargetPage() {
  const [target, setTarget] = useLocal("target-value", 5000);
  const tape = useTape("target-tape", "sum");
  const diff = tape.total - target;
  const done = diff >= 0;
  const pct = target > 0 ? Math.max(0, Math.min(100, (tape.total / target) * 100)) : 0;

  return (
    <>
      <h1>บวกให้ครบ {fmt(target)}</h1>

      <div className={"status " + (done ? "ok" : "short")}>
        <strong>{done ? (diff === 0 ? "0" : "+" + fmt(diff)) : fmt(diff)}</strong>
        <span>
          {done
            ? diff === 0 ? "ครบพอดีแล้ว ✓" : "ครบแล้ว และเกินอยู่"
            : `ขาดอีก ${fmt(-diff)}`}
        </span>
        <div className="bar"><i style={{ width: pct + "%" }} /></div>
        <div className="status-meta">
          <span>บวกแล้ว {fmt(tape.total)}</span>
          <label>
            เป้าหมาย
            <NumInput
              className="target-input"
              inputMode="decimal"
              value={String(target)}
              onChange={(v) => setTarget(Number(v.replace(/[^0-9.]/g, "")) || 0)}
            />
          </label>
        </div>
      </div>

      <Tape tape={tape} placeholder="พิมพ์ตัวเลขที่จะบวก เช่น 500 หรือ 120+80" />
    </>
  );
}

/* ------------------------- โครงหลัก ------------------------- */
const TABS = [
  { id: "calc", label: "เครื่องคิดเลข", icon: "🧮", page: CalculatorPage },
  { id: "summary", label: "สรุปรายรับ", icon: "🧾", page: SummaryPage },
  { id: "target", label: "ครบเป้า 5,000", icon: "🎯", page: TargetPage },
  { id: "deposit", label: "ฝากเงิน", icon: "🏦", page: DepositPage },
];

export default function App() {
  const [tab, setTab] = useState("calc");
  const Page = TABS.find((t) => t.id === tab).page;

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <img src="/logo.png" alt="Pak Chong Animal Hospital" />
        </div>
        <nav>
          {TABS.map((t) => (
            <button key={t.id} data-tab={t.id} className={"tab" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
              <span className="ico">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Page />
      </main>
    </div>
  );
}
