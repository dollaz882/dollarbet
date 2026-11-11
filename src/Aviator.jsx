import { useEffect, useRef, useState } from "react";

function generateCrashPoint() {
  const r = Math.random();
  if (r < 0.01) return 1.00;
  const point = 0.97 / (1 - r);
  return Math.min(point, 100);
}
function makeHash(str) {
  let h = 0; for (let c of str) h = (h * 31 + c.charCodeAt(0)) % 1000000007;
  return h.toString(16).padStart(8, "0");
}
const NAMES = ["Kwame", "Ama", "Yaw", "Akosua", "Kofi", "Efua", "Kwesi", "Abena", "Fiifi", "Adwoa", "Kojo", "Esi", "Mensah", "Ama Serwaa", "Kwabena", "Yaa", "Akwasi", "Afi", "Kweku", "Ama Mensima"];

export default function Aviator({ balance, setBalance }) {
  const [phase, setPhase] = useState("waiting");
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("dollarbet-aviator-history") || "[2.34,1.12,5.67,1.05,3.45,8.90,1.23,2.10]"));
  const [roundId, setRoundId] = useState(() => Math.floor(Math.random() * 100000));
  const [showFair, setShowFair] = useState(false);
  const [message, setMessage] = useState("");
  const [liveBets, setLiveBets] = useState([]);

  // ===== 2 BETS - INDEPENDENT =====
  const [bet1Amount, setBet1Amount] = useState("10");
  const [bet1Auto, setBet1Auto] = useState("2.00");
  const [bet2Amount, setBet2Amount] = useState("10");
  const [bet2Auto, setBet2Auto] = useState("5.00");
  const [bet1, setBet1] = useState(null); // { amount, cashedAt }
  const [bet2, setBet2] = useState(null);

  const multiplierRef = useRef(1.00);
  const crashRef = useRef(0);
  const phaseRef = useRef("waiting");
  const bet1Ref = useRef(null);
  const bet2Ref = useRef(null);
  const bet1AutoRef = useRef("2.00");
  const bet2AutoRef = useRef("5.00");
  const rafRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { bet1AutoRef.current = bet1Auto; }, [bet1Auto]);
  useEffect(() => { bet2AutoRef.current = bet2Auto; }, [bet2Auto]);
  useEffect(() => { localStorage.setItem("dollarbet-aviator-history", JSON.stringify(history)); }, [history]);

  useEffect(() => {
    if (phase === "waiting") {
      const bets = [];
      const count = 8 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        bets.push({ name: NAMES[Math.floor(Math.random() * NAMES.length)] + " " + Math.floor(Math.random() * 100), amount: [5, 10, 20, 50, 100][Math.floor(Math.random() * 5)], cashed: null, id: i });
      }
      setLiveBets(bets);
    }
  }, [phase, roundId]);

  // Countdown
  useEffect(() => {
    if (phase !== "waiting") return;
    if (countdown <= 0) {
      const cp = generateCrashPoint();
      crashRef.current = cp;
      setCrashPoint(cp);
      multiplierRef.current = 1.00;
      setMultiplier(1.00);
      setPhase("flying");
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Flying loop
  useEffect(() => {
    if (phase !== "flying") return;
    const start = Date.now();
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const elapsed = (Date.now() - start) / 1000;
      const m = Math.pow(1.0006, elapsed * 100);
      const val = Math.max(1.00, m);
      multiplierRef.current = val;
      setMultiplier(val);

      // AUTO CASHOUT - BET 1
      if (bet1Ref.current && !bet1Ref.current.cashedAt && val >= Number(bet1AutoRef.current || 999)) {
        doCashout(1, val);
        return;
      }
      // AUTO CASHOUT - BET 2
      if (bet2Ref.current && !bet2Ref.current.cashedAt && val >= Number(bet2AutoRef.current || 999)) {
        doCashout(2, val);
        return;
      }

      setLiveBets(prev => prev.map(b => {
        if (!b.cashed && Math.random() < 0.02 && val > 1.2) return { ...b, cashed: val.toFixed(2) };
        return b;
      }));

      if (val >= crashRef.current) {
        setPhase("crashed");
        setHistory(prev => [Number(crashRef.current.toFixed(2)), ...prev].slice(0, 20));
        const b1 = bet1Ref.current, b2 = bet2Ref.current;
        let msg = `💥 CRASHED @ ${crashRef.current.toFixed(2)}x`;
        if (b1 && !b1.cashedAt) msg += ` - Bet 1 lost GHS ${b1.amount}`;
        if (b1?.cashedAt) msg += ` - Bet 1 cashed @ ${b1.cashedAt.toFixed(2)}x ✅`;
        if (b2 && !b2.cashedAt) msg += ` - Bet 2 lost GHS ${b2.amount}`;
        if (b2?.cashedAt) msg += ` - Bet 2 cashed @ ${b2.cashedAt.toFixed(2)}x ✅`;
        setMessage(msg);
        setTimeout(() => {
          setRoundId(r => r + 1);
          setCountdown(5);
          setBet1(null); setBet2(null);
          bet1Ref.current = null; bet2Ref.current = null;
          setPhase("waiting");
          setMultiplier(1.00);
          setMessage("");
        }, 3000);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line
  }, [phase]);

  const placeBet = (which) => {
    if (phase !== "waiting") return alert("Wait for next round! Bet only during countdown.");
    const amt = Number(which === 1 ? bet1Amount : bet2Amount);
    if (!amt || amt <= 0) return alert("Enter amount");
    if (amt > balance) return alert("Not enough balance! Deposit MoMo.");
    const ref = which === 1 ? bet1Ref : bet2Ref;
    if (ref.current) return alert(`Bet ${which} already placed!`);
    setBalance(balance - amt);
    const b = { amount: amt, cashedAt: null };
    if (which === 1) { setBet1(b); bet1Ref.current = b; }
    else { setBet2(b); bet2Ref.current = b; }
    setMessage(`✅ Bet ${which} - GHS ${amt} placed! Waiting for takeoff...`);
  };

  const doCashout = (which, atVal) => {
    const val = atVal || multiplierRef.current;
    const ref = which === 1 ? bet1Ref : bet2Ref;
    if (!ref.current) return;
    if (ref.current.cashedAt) return;
    if (phaseRef.current !== "flying") return;
    const win = ref.current.amount * val;
    setBalance(prev => prev + win);
    const updated = { ...ref.current, cashedAt: val };
    if (which === 1) { setBet1(updated); bet1Ref.current = updated; }
    else { setBet2(updated); bet2Ref.current = updated; }
    setMessage(`🎉 BET ${which} CASHED OUT @ ${val.toFixed(2)}x - You won GHS ${win.toFixed(2)}!`);
  };

  const cancelBet = (which) => {
    // Only during waiting, before takeoff - refund
    if (phase !== "waiting") return;
    const ref = which === 1 ? bet1Ref : bet2Ref;
    if (!ref.current) return;
    setBalance(prev => prev + ref.current.amount);
    if (which === 1) { setBet1(null); bet1Ref.current = null; }
    else { setBet2(null); bet2Ref.current = null; }
    setMessage(`Bet ${which} cancelled - refunded.`);
  };

  const planeX = Math.min(80, (multiplier - 1) * 12);
  const planeY = Math.max(10, 70 - (multiplier - 1) * 8);

  // One bet panel - reused for Bet 1 and Bet 2
  const renderBetPanel = (which) => {
    const amount = which === 1 ? bet1Amount : bet2Amount;
    const setAmount = which === 1 ? setBet1Amount : setBet2Amount;
    const auto = which === 1 ? bet1Auto : bet2Auto;
    const setAuto = which === 1 ? setBet1Auto : setBet2Auto;
    const myBet = which === 1 ? bet1 : bet2;
    const color = which === 1 ? "#008542" : "#7c3aed";
    return (
      <div style={{ flex: 1, background: "#1c1c1c", padding: 12, borderRadius: 10, border: myBet ? `2px solid ${color}` : "1px solid #333" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: "900", color: color }}>BET {which}</span>
          {myBet && <span style={{ fontSize: 11, background: myBet.cashedAt ? "#14532d" : "#ffcc00", color: myBet.cashedAt ? "#fff" : "#000", padding: "2px 8px", borderRadius: 20, fontWeight: "bold" }}>{myBet.cashedAt ? `Cashed @ ${myBet.cashedAt.toFixed(2)}x` : "LOCKED 🔒"}</span>}
        </div>
        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginTop: 8 }}>AMOUNT (GHS)</label>
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          <button onClick={() => setAmount(String(Math.max(1, Number(amount || 10) - 10)))} disabled={!!myBet} style={{ padding: "10px 8px", background: "#333", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>-</button>
          <input value={amount} onChange={e => setAmount(e.target.value)} disabled={!!myBet} type="number" style={{ flex: 1, padding: 10, borderRadius: 6, border: `2px solid ${color}`, fontWeight: "bold", fontSize: 16, textAlign: "center", background: myBet ? "#222" : "#fff", color: myBet ? "#aaa" : "#000" }} />
          <button onClick={() => setAmount(String(Number(amount || 10) + 10))} disabled={!!myBet} style={{ padding: "10px 8px", background: "#333", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>+</button>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {["10", "20", "50", "100"].map(v => <button key={v} onClick={() => setAmount(v)} disabled={!!myBet} style={{ flex: 1, padding: 6, background: amount === v ? "#ffcc00" : "#333", color: amount === v ? "#000" : "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>{v}</button>)}
        </div>
        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginTop: 8 }}>AUTO CASHOUT @</label>
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          <input value={auto} onChange={e => setAuto(e.target.value)} type="number" step="0.1" style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ffcc00", fontWeight: "bold", textAlign: "center" }} />
          {["1.50", "2.00", "5.00", "10.00"].map(v => <button key={v} onClick={() => setAuto(v)} style={{ padding: "8px 6px", background: auto === v ? "#ffcc00" : "#333", color: auto === v ? "#000" : "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 11 }}>{v}x</button>)}
        </div>

        {phase === "waiting" && !myBet && <button onClick={() => placeBet(which)} style={{ width: "100%", padding: 14, background: color, color: "#fff", border: "none", borderRadius: 8, fontWeight: "900", fontSize: 15, marginTop: 10, cursor: "pointer" }}>BET {which} - GHS {amount || 0} ✈️</button>}
        {phase === "waiting" && myBet && !myBet.cashedAt && <button onClick={() => cancelBet(which)} style={{ width: "100%", padding: 12, background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", marginTop: 10, cursor: "pointer" }}>CANCEL BET {which} - Refund GHS {myBet.amount}</button>}
        {phase === "flying" && myBet && !myBet.cashedAt && <button onClick={() => doCashout(which)} style={{ width: "100%", padding: 16, background: "#ffcc00", color: "#000", border: "3px solid #fff", borderRadius: 8, fontWeight: "900", fontSize: 17, marginTop: 10, cursor: "pointer", boxShadow: "0 0 20px rgba(255,204,0,0.5)" }}>💰 CASH OUT {which} @ {multiplier.toFixed(2)}x<br /><span style={{ fontSize: 13 }}>WIN GHS {(myBet.amount * multiplier).toFixed(2)}</span></button>}
        {phase === "flying" && myBet?.cashedAt && <div style={{ textAlign: "center", padding: 12, background: "#14532d", borderRadius: 8, marginTop: 10, fontWeight: "bold", fontSize: 13 }}>✅ Bet {which} Cashed @ {myBet.cashedAt.toFixed(2)}x<br />Won GHS {(myBet.amount * myBet.cashedAt).toFixed(2)}</div>}
        {phase === "flying" && !myBet && <div style={{ textAlign: "center", padding: 10, background: "#333", borderRadius: 8, marginTop: 10, fontSize: 12 }}>No Bet {which} this round</div>}
        {phase === "crashed" && myBet && !myBet.cashedAt && <div style={{ textAlign: "center", padding: 10, background: "#7f1d1d", borderRadius: 8, marginTop: 10, fontSize: 12, fontWeight: "bold" }}>Bet {which} Lost 💥</div>}
      </div>
    );
  };

  return (
    <div style={{ padding: 12, color: "#fff", paddingBottom: 120 }}>
      <h2 style={{ textAlign: "center" }}>✈️ AVIATOR - 2 BETS</h2>
      <p style={{ textAlign: "center", fontSize: 12, color: "#22c55e" }}>● LIVE • Round #{roundId} • Balance: GHS {balance.toFixed(2)} • {liveBets.length} players online</p>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "8px 0", whiteSpace: "nowrap" }}>
        {history.map((h, i) => (
          <span key={i} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "bold", background: h < 2 ? "#ef4444" : h < 5 ? "#f59e0b" : h < 10 ? "#22c55e" : "#a855f7", color: "#fff", flexShrink: 0 }}>{h.toFixed(2)}x</span>
        ))}
      </div>

      <div style={{ background: "linear-gradient(180deg,#0f172a,#1e1b4b)", height: 220, borderRadius: 12, position: "relative", overflow: "hidden", border: "2px solid #333" }}>
        <div style={{ position: "absolute", bottom: 10, left: 10, fontSize: 11, color: "#aaa" }}>Round #{roundId} • Hash: {makeHash(String(roundId) + crashPoint)}</div>
        {phase === "waiting" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 48, fontWeight: "900", color: "#ffcc00" }}>Next round in {countdown}s</div>
            <div style={{ color: "#aaa", marginTop: 6 }}>{(bet1 || bet2) ? `✅ ${bet1 ? "Bet 1 locked " : ""}${bet2 ? "• Bet 2 locked " : ""}- Get ready to CASH OUT!` : "Place Bet 1 and / or Bet 2 now!"}</div>
            <div style={{ fontSize: 40, marginTop: 10 }}>✈️</div>
          </div>
        )}
        {phase === "flying" && (
          <>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontSize: 64, fontWeight: "900", color: multiplier > 5 ? "#a855f7" : multiplier > 2 ? "#22c55e" : "#fff" }}>{multiplier.toFixed(2)}x</div>
              <div style={{ color: "#ffcc00", fontSize: 13 }}>FLYING...</div>
              {(bet1 || bet2) && <div style={{ marginTop: 6, display: "flex", gap: 6, justifyContent: "center" }}>{bet1 && !bet1.cashedAt && <span style={{ background: "#008542", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "bold" }}>Bet 1: GHS {bet1.amount}</span>}{bet2 && !bet2.cashedAt && <span style={{ background: "#7c3aed", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "bold" }}>Bet 2: GHS {bet2.amount}</span>}</div>}
            </div>
            <div style={{ position: "absolute", left: `${10 + planeX}%`, top: `${planeY}%`, fontSize: 36, transition: "all 0.1s", transform: "rotate(-10deg)" }}>✈️</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, background: "#ef4444", width: `${Math.min(100, (multiplier / (crashRef.current || 10)) * 100)}%` }} />
          </>
        )}
        {phase === "crashed" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.2)" }}>
            <div style={{ fontSize: 56, fontWeight: "900", color: "#ef4444" }}>💥 {crashPoint.toFixed(2)}x</div>
            <div style={{ color: "#fff", fontWeight: "bold" }}>FLEW AWAY!</div>
          </div>
        )}
      </div>

      {message && <div style={{ background: message.includes("won") || message.includes("CASHED") ? "#14532d" : message.includes("lost") || message.includes("CRASHED") ? "#7f1d1d" : "#1e3a8a", padding: 10, borderRadius: 8, marginTop: 10, textAlign: "center", fontWeight: "bold", fontSize: 13 }}>{message}</div>}

      {/* 2 BET PANELS SIDE BY SIDE */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {renderBetPanel(1)}
        {renderBetPanel(2)}
      </div>

      <div style={{ background: "#111", padding: 10, borderRadius: 8, marginTop: 10, fontSize: 12, color: "#aaa", textAlign: "center" }}>
        💡 <b style={{ color: "#fff" }}>Pro Strategy:</b> Bet 1 = Safe - Auto Cashout 1.50x • Bet 2 = Big - Auto Cashout 10.00x<br />Bet 1 covers your loss, Bet 2 goes for jackpot!
      </div>

      <button onClick={() => setShowFair(!showFair)} style={{ width: "100%", padding: 8, background: "transparent", color: "#ffcc00", border: "1px solid #333", borderRadius: 6, marginTop: 10, cursor: "pointer", fontSize: 12 }}>{showFair ? "Hide Fairness ▲" : "Provably Fair - How it works ▼"}</button>
      {showFair && <div style={{ background: "#111", padding: 10, borderRadius: 8, fontSize: 12, color: "#aaa", marginTop: 6 }}>Crash point is generated BEFORE the round starts. Round #{roundId} Hash: {makeHash(String(roundId) + crashPoint)} - House edge 3% - same as real Aviator.</div>}

      <h3 style={{ marginTop: 16 }}>👥 Live Bets - This Round</h3>
      {liveBets.map(b => (
        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", background: "#1c1c1c", padding: "8px 10px", borderRadius: 6, marginBottom: 5, fontSize: 13 }}>
          <span>{b.name}</span><span>GHS {b.amount}</span><span style={{ color: b.cashed ? "#22c55e" : "#aaa", fontWeight: "bold" }}>{b.cashed ? `Cashed @ ${b.cashed}x` : "Waiting..."}</span>
        </div>
      ))}
      {bet1 && <div style={{ display: "flex", justifyContent: "space-between", background: "#14532d", padding: "8px 10px", borderRadius: 6, fontSize: 13, fontWeight: "bold" }}><span>YOU - BET 1</span><span>GHS {bet1.amount}</span><span>{bet1.cashedAt ? `Cashed @ ${bet1.cashedAt.toFixed(2)}x` : phase === "crashed" ? "Lost 💥" : "Flying..."}</span></div>}
      {bet2 && <div style={{ display: "flex", justifyContent: "space-between", background: "#4c1d95", padding: "8px 10px", borderRadius: 6, fontSize: 13, fontWeight: "bold", marginTop: 5 }}><span>YOU - BET 2</span><span>GHS {bet2.amount}</span><span>{bet2.cashedAt ? `Cashed @ ${bet2.cashedAt.toFixed(2)}x` : phase === "crashed" ? "Lost 💥" : "Flying..."}</span></div>}
    </div>
  );
}