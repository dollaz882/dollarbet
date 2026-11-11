import { useEffect, useRef, useState } from "react";

const NAMES = ["Akwasi", "Adwoa", "Kojo", "Kweku", "Fiifi", "Ama", "Esi", "Yaw"];
const HISTORY = ["1.27x", "15.34x", "2.34x", "1.12x", "5.67x", "1.05x"];

export default function Aviator({ balance, setBalance }) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [phase, setPhase] = useState("flying");
  const [round, setRound] = useState(56447);
  const [bet1, setBet1] = useState({ amount: "10", auto: "2.00", placed: false, cashed: false, cashAt: null });
  const [bet2, setBet2] = useState({ amount: "10", auto: "5.00", placed: false, cashed: false, cashAt: null });
  const [msg, setMsg] = useState("");
  const intervalRef = useRef(null);

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
      setBalance((b) => b + parseFloat(win)); setBet1((b) => ({ ...b, cashed: true, cashAt: multiplier.toFixed(2) })); setMsg(`Bet 1 @ ${multiplier.toFixed(2)}x - Won GHS ${win} ✅`);
    }
    if (bet2.placed && !bet2.cashed && multiplier >= parseFloat(bet2.auto || "999")) {
      const win = (parseFloat(bet2.amount || 0) * multiplier).toFixed(2);
      setBalance((b) => b + parseFloat(win)); setBet2((b) => ({ ...b, cashed: true, cashAt: multiplier.toFixed(2) })); setMsg(`Bet 2 @ ${multiplier.toFixed(2)}x - Won GHS ${win} ✅`);
    }
  }, [multiplier, phase, bet1, bet2, setBalance]);

  const placeBet = (which) => {
    const bet = which === 1 ? bet1 : bet2; const setBet = which === 1 ? setBet1 : setBet2;
    const amt = parseFloat(bet.amount || 0);
    if (!amt || amt <= 0) return alert("Enter amount"); if (amt > balance) return alert("Not enough balance!");
    setBalance((b) => b - amt); setBet({ ...bet, placed: true, cashed: false }); setMsg(`Bet ${which}: GHS ${amt} - Auto @ ${bet.auto}x`);
  };
  const cashOut = (which) => {
    const bet = which === 1 ? bet1 : bet2; const setBet = which === 1 ? setBet1 : setBet2;
    if (!bet.placed || bet.cashed || phase !== "flying") return;
    const win = (parseFloat(bet.amount || 0) * multiplier).toFixed(2);
    setBalance((b) => b + parseFloat(win)); setBet({ ...bet, cashed: true, cashAt: multiplier.toFixed(2) }); setMsg(`Bet ${which} @ ${multiplier.toFixed(2)}x - Won GHS ${win} ✅`);
  };

  const renderBet = (which, bet, setBet, color, title) => (
    <div style={{ flex: "1 1 170px", minWidth: 0, maxWidth: "100%", background: "#1a1a1a", borderRadius: 6, padding: 6, border: `1px solid ${color}33`, boxSizing: "border-box" }}>
      <div style={{ color, fontWeight: "900", fontSize: 10, marginBottom: 3 }}>{title}</div>
      <div style={{ display: "flex", gap: 2 }}>
        <button onClick={() => setBet({ ...bet, amount: String(Math.max(1, parseFloat(bet.amount || 0) - 10)) })} style={{ width: 22, background: "#222", color: "#fff", border: "1px solid #333", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>-</button>
        <input value={bet.amount} onChange={(e) => setBet({ ...bet, amount: e.target.value })} type="number" style={{ flex: 1, minWidth: 0, padding: 3, borderRadius: 4, border: "1.5px solid #008542", background: "#fff", fontWeight: "900", fontSize: 11, textAlign: "center" }} />
        <button onClick={() => setBet({ ...bet, amount: String(parseFloat(bet.amount || 0) + 10) })} style={{ width: 22, background: "#222", color: "#fff", border: "1px solid #333", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>+</button>
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 3 }}>
        {["10", "20", "50", "100"].map((v) => <button key={v} onClick={() => setBet({ ...bet, amount: v })} style={{ flex: 1, padding: 3, background: bet.amount === v ? "#ffcc00" : "#2a2a2a", color: bet.amount === v ? "#000" : "#fff", border: "none", borderRadius: 4, fontWeight: "bold", fontSize: 9, cursor: "pointer" }}>{v}</button>)}
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 3, flexWrap: "wrap" }}>
        {["1.50x", "2.00x", "5.00x", "10.00x"].map((v) => { const clean = v.replace("x", ""); const active = bet.auto === clean; return <button key={v} onClick={() => setBet({ ...bet, auto: clean })} style={{ flex: "1 1 0", minWidth: 32, padding: "3px 1px", background: active ? "#ffcc00" : "#2a2a2a", color: active ? "#000" : "#fff", border: "none", borderRadius: 4, fontWeight: "bold", fontSize: 9, cursor: "pointer" }}>{v}</button>; })}
      </div>
      {!bet.placed ? (
        <button onClick={() => placeBet(which)} disabled={phase === "crashed"} style={{ width: "100%", marginTop: 4, padding: 6, background: phase === "crashed" ? "#555" : "#008542", color: "#fff", border: "none", borderRadius: 5, fontWeight: "900", fontSize: 10, cursor: "pointer" }}>{phase === "crashed" ? "WAIT..." : `BET - GHS ${bet.amount || 0}`}</button>
      ) : bet.cashed ? (
        <div style={{ marginTop: 4, padding: 6, background: "#008542", borderRadius: 5, textAlign: "center", fontWeight: "900", fontSize: 10 }}>✅ @ {bet.cashAt}x</div>
      ) : (
        <button onClick={() => cashOut(which)} style={{ width: "100%", marginTop: 4, padding: 6, background: "#ffcc00", color: "#000", border: "none", borderRadius: 5, fontWeight: "900", fontSize: 10, cursor: "pointer" }}>CASH @ {multiplier.toFixed(2)}x</button>
      )}
    </div>
  );

  return (
    <div style={{ background: "#111", color: "#fff", padding: 4, paddingBottom: 70, boxSizing: "border-box", overflowX: "hidden", maxWidth: 480, margin: "0 auto" }}>
      {/* HEADER - SMALL LIKE SPORTY */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px" }}>
        <span style={{ fontWeight: "900", fontSize: 12 }}>✈️ AVIATOR</span>
        <span style={{ fontSize: 9, color: "#22c55e" }}>● LIVE #{round} • GHS {balance.toFixed(2)}</span>
      </div>

      {/* HERO - SPORTY SIZE: ~140px tall */}
      <div style={{ background: "linear-gradient(135deg, #0a0a2a 0%, #1a1a4a 100%)", borderRadius: 8, padding: "6px 8px", minHeight: 130, height: 130, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 2, position: "absolute", top: 4, left: 0, right: 0, justifyContent: "center" }}>
          {HISTORY.map((h, i) => <span key={i} style={{ padding: "1px 5px", borderRadius: 10, fontSize: 8, fontWeight: "bold", background: parseFloat(h) > 5 ? "#7c3aed" : parseFloat(h) > 2 ? "#008542" : "#e53935" }}>{h}</span>)}
        </div>
        <div style={{ fontSize: 26, fontWeight: "900", color: phase === "crashed" ? "#ff4444" : "#ffcc00", lineHeight: 1, marginTop: 8 }}>{multiplier.toFixed(2)}x <span style={{ fontSize: 16 }}>{phase === "crashed" ? "💥" : "✈️"}</span></div>
        <div style={{ fontSize: 9, color: "#aaa", marginTop: 2 }}>{phase === "crashed" ? "CRASHED! Wait..." : phase === "waiting" ? "Next round..." : "FLYING..."}</div>
      </div>

      {msg && <div style={{ background: "#1e3a1e", padding: 4, borderRadius: 5, fontSize: 9, textAlign: "center", marginTop: 4 }}>{msg}</div>}

      {/* BETS - COMPACT, SIDE BY SIDE LIKE SPORTY */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
        {renderBet(1, bet1, setBet1, "#22c55e", "BET 1")}
        {renderBet(2, bet2, setBet2, "#a855f7", "BET 2")}
      </div>

      <div style={{ fontSize: 9, textAlign: "center", color: "#888", marginTop: 4 }}>💡 Bet 1 = Safe 1.50x • Bet 2 = Big 10.00x</div>
    </div>
  );
}