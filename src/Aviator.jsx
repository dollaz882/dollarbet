import { useEffect, useRef, useState } from "react";

const NAMES = ["Akwasi", "Adwoa", "Kojo", "Kweku", "Fiifi", "Ama", "Esi", "Yaw", "Kwame", "Efua", "Kofi", "Abena"];
const HISTORY = ["1.27x", "15.34x", "2.34x", "1.12x", "5.67x", "1.05x", "3.45x", "8.90x"];

export default function Aviator({ balance, setBalance }) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [phase, setPhase] = useState("flying");
  const [round, setRound] = useState(56447);
  const [bet1, setBet1] = useState({ amount: "10", auto: "2.00", placed: false, cashed: false, cashAt: null });
  const [bet2, setBet2] = useState({ amount: "10", auto: "5.00", placed: false, cashed: false, cashAt: null });
  const [liveBets, setLiveBets] = useState([]);
  const [msg, setMsg] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    const gen = () => NAMES.slice(0, 8).map((n) => ({ name: `${n} ${Math.floor(Math.random() * 90) + 10}`, amount: [10, 20, 50, 100][Math.floor(Math.random() * 4)], cash: (1.2 + Math.random() * 0.5).toFixed(2) }));
    setLiveBets(gen());
    const t = setInterval(() => setLiveBets(gen()), 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase !== "flying") return;
    const crashAt = 1.5 + Math.random() * 6;
    intervalRef.current = setInterval(() => {
      setMultiplier((m) => {
        const next = m + 0.02 + m * 0.015;
        if (next >= crashAt) {
          clearInterval(intervalRef.current);
          setPhase("crashed");
          setTimeout(() => { setRound((r) => r + 1); setMultiplier(1.0); setBet1((b) => ({ ...b, placed: false, cashed: false })); setBet2((b) => ({ ...b, placed: false, cashed: false })); setPhase("waiting"); setTimeout(() => setPhase("flying"), 3000); }, 2500);
          return crashAt;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [phase, round]);

  useEffect(() => {
    if (phase !== "flying") return;
    if (bet1.placed && !bet1.cashed && multiplier >= parseFloat(bet1.auto || "999")) {
      const win = (parseFloat(bet1.amount || 0) * multiplier).toFixed(2);
      setBalance((b) => b + parseFloat(win)); setBet1((b) => ({ ...b, cashed: true, cashAt: multiplier.toFixed(2) })); setMsg(`Bet 1 Cashed @ ${multiplier.toFixed(2)}x - Won GHS ${win} ✅`);
    }
    if (bet2.placed && !bet2.cashed && multiplier >= parseFloat(bet2.auto || "999")) {
      const win = (parseFloat(bet2.amount || 0) * multiplier).toFixed(2);
      setBalance((b) => b + parseFloat(win)); setBet2((b) => ({ ...b, cashed: true, cashAt: multiplier.toFixed(2) })); setMsg(`Bet 2 Cashed @ ${multiplier.toFixed(2)}x - Won GHS ${win} ✅`);
    }
  }, [multiplier, phase, bet1, bet2, setBalance]);

  const placeBet = (which) => {
    const bet = which === 1 ? bet1 : bet2; const setBet = which === 1 ? setBet1 : setBet2;
    const amt = parseFloat(bet.amount || 0);
    if (!amt || amt <= 0) return alert("Enter amount"); if (amt > balance) return alert("Not enough balance!");
    setBalance((b) => b - amt); setBet({ ...bet, placed: true, cashed: false }); setMsg(`Bet ${which} placed: GHS ${amt} - Auto @ ${bet.auto}x`);
  };
  const cashOut = (which) => {
    const bet = which === 1 ? bet1 : bet2; const setBet = which === 1 ? setBet1 : setBet2;
    if (!bet.placed || bet.cashed || phase !== "flying") return;
    const win = (parseFloat(bet.amount || 0) * multiplier).toFixed(2);
    setBalance((b) => b + parseFloat(win)); setBet({ ...bet, cashed: true, cashAt: multiplier.toFixed(2) }); setMsg(`Bet ${which} Cashed @ ${multiplier.toFixed(2)}x - Won GHS ${win} ✅`);
  };

  const renderBet = (which, bet, setBet, color, title) => (
    <div style={{ flex: "1 1 260px", minWidth: 0, maxWidth: "100%", background: "#1a1a1a", borderRadius: 8, padding: 8, border: `1px solid ${color}33`, boxSizing: "border-box" }}>
      <div style={{ color, fontWeight: "900", fontSize: 11, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 9, color: "#aaa", textAlign: "center", marginBottom: 2 }}>AMOUNT (GHS)</div>
      <div style={{ display: "flex", gap: 3 }}>
        <button onClick={() => setBet({ ...bet, amount: String(Math.max(1, parseFloat(bet.amount || 0) - 10)) })} style={{ width: 28, background: "#222", color: "#fff", border: "1px solid #333", borderRadius: 5, fontSize: 14, cursor: "pointer" }}>-</button>
        <input value={bet.amount} onChange={(e) => setBet({ ...bet, amount: e.target.value })} type="number" style={{ flex: 1, minWidth: 0, padding: 5, borderRadius: 5, border: "2px solid #008542", background: "#fff", fontWeight: "900", fontSize: 13, textAlign: "center" }} />
        <button onClick={() => setBet({ ...bet, amount: String(parseFloat(bet.amount || 0) + 10) })} style={{ width: 28, background: "#222", color: "#fff", border: "1px solid #333", borderRadius: 5, fontSize: 14, cursor: "pointer" }}>+</button>
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
        {["10", "20", "50", "100"].map((v) => <button key={v} onClick={() => setBet({ ...bet, amount: v })} style={{ flex: 1, padding: 5, background: bet.amount === v ? "#ffcc00" : "#2a2a2a", color: bet.amount === v ? "#000" : "#fff", border: "none", borderRadius: 5, fontWeight: "bold", fontSize: 10, cursor: "pointer" }}>{v}</button>)}
      </div>
      <div style={{ fontSize: 9, color: "#aaa", textAlign: "center", margin: "6px 0 2px" }}>AUTO CASHOUT @</div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {["2.00", "1.50x", "2.00x", "5.00x", "10.00x"].map((v) => { const clean = v.replace("x", ""); const active = bet.auto === clean; return <button key={v} onClick={() => setBet({ ...bet, auto: clean })} style={{ flex: "1 1 0", minWidth: 42, padding: "5px 1px", background: active ? "#ffcc00" : "#2a2a2a", color: active ? "#000" : "#fff", border: "none", borderRadius: 5, fontWeight: "bold", fontSize: 10, cursor: "pointer" }}>{v}</button>; })}
      </div>
      {!bet.placed ? (
        <button onClick={() => placeBet(which)} disabled={phase === "crashed"} style={{ width: "100%", marginTop: 6, padding: 8, background: phase === "crashed" ? "#555" : "#008542", color: "#fff", border: "none", borderRadius: 6, fontWeight: "900", fontSize: 11, cursor: "pointer" }}>{phase === "crashed" ? "WAIT..." : `PLACE BET - GHS ${bet.amount || 0}`}</button>
      ) : bet.cashed ? (
        <div style={{ marginTop: 6, padding: 8, background: "#008542", borderRadius: 6, textAlign: "center", fontWeight: "900", fontSize: 11 }}>✅ Cashed @ {bet.cashAt}x</div>
      ) : (
        <button onClick={() => cashOut(which)} style={{ width: "100%", marginTop: 6, padding: 8, background: "#ffcc00", color: "#000", border: "none", borderRadius: 6, fontWeight: "900", fontSize: 11, cursor: "pointer" }}>CASH OUT @ {multiplier.toFixed(2)}x = GHS {(parseFloat(bet.amount || 0) * multiplier).toFixed(2)}</button>
      )}
      <div style={{ textAlign: "center", fontSize: 9, color: "#888", marginTop: 3 }}>{bet.placed && !bet.cashed ? `Bet ${which} LIVE` : `No Bet ${which}`}</div>
    </div>
  );

  return (
    <div style={{ background: "#111", color: "#fff", padding: 6, paddingBottom: 80, boxSizing: "border-box", overflowX: "hidden", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ textAlign: "center", fontWeight: "900", fontSize: 13 }}>✈️ AVIATOR - 2 BETS</div>
      <div style={{ textAlign: "center", fontSize: 10, color: "#22c55e" }}>● LIVE - Round #{round} • Balance: GHS {balance.toFixed(2)}</div>

      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center", margin: "6px 0" }}>
        {HISTORY.map((h, i) => <span key={i} style={{ padding: "2px 6px", borderRadius: 20, fontSize: 10, fontWeight: "bold", background: parseFloat(h) > 5 ? "#7c3aed" : parseFloat(h) > 2 ? "#008542" : "#e53935" }}>{h}</span>)}
      </div>

      {/* SMALLER GAME AREA */}
      <div style={{ background: "#0a0a2a", borderRadius: 10, padding: 10, textAlign: "center", minHeight: 90, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 30, fontWeight: "900", color: phase === "crashed" ? "#ff4444" : "#ffcc00", lineHeight: 1 }}>{multiplier.toFixed(2)}x</div>
        <div style={{ fontSize: 20 }}>{phase === "crashed" ? "💥" : "✈️"}</div>
        <div style={{ fontSize: 10, color: "#aaa" }}>{phase === "crashed" ? "CRASHED!" : phase === "waiting" ? "Next round..." : "FLYING..."}</div>
      </div>

      {msg && <div style={{ background: "#1e3a1e", border: "1px solid #008542", padding: 5, borderRadius: 6, fontSize: 10, textAlign: "center", marginTop: 6 }}>{msg}</div>}

      {/* SMALLER + STACKS ON PHONE */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
        {renderBet(1, bet1, setBet1, "#22c55e", "BET 1")}
        {renderBet(2, bet2, setBet2, "#a855f7", "BET 2")}
      </div>

      <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 6, marginTop: 6, fontSize: 10, textAlign: "center", color: "#ccc" }}>
        <b>💡 Pro Strategy:</b> Bet 1 = Safe 1.50x • Bet 2 = Big 10.00x
      </div>

      <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 6, marginTop: 6 }}>
        <div style={{ textAlign: "center", fontWeight: "900", fontSize: 11, marginBottom: 4 }}>👥 Live Bets</div>
        {liveBets.map((b, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #222", fontSize: 11 }}>
            <span>{b.name}</span><span>GHS {b.amount}</span><span style={{ color: "#22c55e" }}>@ {b.cash}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}