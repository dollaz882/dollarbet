import { useEffect, useRef, useState } from "react";

const NAMES = ["Akwasi", "Adwoa", "Kojo", "Adwoa", "Kweku", "Fiifi", "Ama", "Esi", "Yaw", "Kwame", "Efua", "Kofi", "Abena", "Yaa", "Kwesi"];
const HISTORY = ["1.27x", "15.34x", "2.34x", "1.12x", "5.67x", "1.05x", "3.45x", "8.90x"];

export default function Aviator({ balance, setBalance }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720);
  const [multiplier, setMultiplier] = useState(1.0);
  const [phase, setPhase] = useState("flying"); // flying | crashed | waiting
  const [round, setRound] = useState(56447);
  const [hash, setHash] = useState("02582778");
  const [bet1, setBet1] = useState({ amount: "10", auto: "2.00", placed: false, cashed: false, cashAt: null });
  const [bet2, setBet2] = useState({ amount: "10", auto: "5.00", placed: false, cashed: false, cashAt: null });
  const [liveBets, setLiveBets] = useState([]);
  const [msg, setMsg] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 720);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fake live bets
  useEffect(() => {
    const gen = () => NAMES.slice(0, 12).map((n, i) => ({
      name: `${n} ${Math.floor(Math.random() * 90) + 10}`,
      amount: [10, 20, 50, 100][Math.floor(Math.random() * 4)],
      cash: (1.2 + Math.random() * 0.5).toFixed(2),
    }));
    setLiveBets(gen());
    const t = setInterval(() => setLiveBets(gen()), 8000);
    return () => clearInterval(t);
  }, []);

  // Game loop
  useEffect(() => {
    if (phase !== "flying") return;
    const crashAt = 1.5 + Math.random() * 6; // random crash
    intervalRef.current = setInterval(() => {
      setMultiplier((m) => {
        const next = m + 0.02 + m * 0.015;
        if (next >= crashAt) {
          clearInterval(intervalRef.current);
          setPhase("crashed");
          setTimeout(() => {
            setRound((r) => r + 1);
            setHash(Math.random().toString(16).slice(2, 10).toUpperCase());
            setMultiplier(1.0);
            setBet1((b) => ({ ...b, placed: false, cashed: false, cashAt: null }));
            setBet2((b) => ({ ...b, placed: false, cashed: false, cashAt: null }));
            setPhase("waiting");
            setTimeout(() => setPhase("flying"), 3000);
          }, 2500);
          return crashAt;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [phase, round]);

  // Auto cashout check
  useEffect(() => {
    if (phase !== "flying") return;
    if (bet1.placed && !bet1.cashed && multiplier >= parseFloat(bet1.auto || "999")) {
      const win = (parseFloat(bet1.amount || 0) * multiplier).toFixed(2);
      setBalance((b) => b + parseFloat(win));
      setBet1((b) => ({ ...b, cashed: true, cashAt: multiplier.toFixed(2) }));
      setMsg(`Bet 1 Auto Cashed @ ${multiplier.toFixed(2)}x - Won GHS ${win} ✅`);
    }
    if (bet2.placed && !bet2.cashed && multiplier >= parseFloat(bet2.auto || "999")) {
      const win = (parseFloat(bet2.amount || 0) * multiplier).toFixed(2);
      setBalance((b) => b + parseFloat(win));
      setBet2((b) => ({ ...b, cashed: true, cashAt: multiplier.toFixed(2) }));
      setMsg(`Bet 2 Auto Cashed @ ${multiplier.toFixed(2)}x - Won GHS ${win} ✅`);
    }
  }, [multiplier, phase, bet1, bet2, setBalance]);

  const placeBet = (which) => {
    const bet = which === 1 ? bet1 : bet2;
    const setBet = which === 1 ? setBet1 : setBet2;
    const amt = parseFloat(bet.amount || 0);
    if (phase !== "flying" && phase !== "waiting") return;
    if (!amt || amt <= 0) return alert("Enter amount");
    if (amt > balance) return alert("Not enough balance!");
    setBalance((b) => b - amt);
    setBet({ ...bet, placed: true, cashed: false, cashAt: null });
    setMsg(`Bet ${which} placed: GHS ${amt} - Auto @ ${bet.auto}x`);
  };

  const cashOut = (which) => {
    const bet = which === 1 ? bet1 : bet2;
    const setBet = which === 1 ? setBet1 : setBet2;
    if (!bet.placed || bet.cashed || phase !== "flying") return;
    const win = (parseFloat(bet.amount || 0) * multiplier).toFixed(2);
    setBalance((b) => b + parseFloat(win));
    setBet({ ...bet, cashed: true, cashAt: multiplier.toFixed(2) });
    setMsg(`Bet ${which} Cashed @ ${multiplier.toFixed(2)}x - Won GHS ${win} ✅`);
  };

  const renderBetBox = (which, bet, setBet, color, title) => (
    <div style={{ flex: isMobile ? "1 1 100%" : "1 1 0", minWidth: 0, background: "#1a1a1a", borderRadius: 10, padding: 12, border: `1px solid ${color}33`, boxSizing: "border-box" }}>
      <div style={{ color, fontWeight: "900", fontSize: 13, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 10, color: "#aaa", textAlign: "center", marginBottom: 4 }}>AMOUNT (GHS)</div>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => setBet({ ...bet, amount: String(Math.max(1, parseFloat(bet.amount || 0) - 10)) })} style={{ width: 36, background: "#222", color: "#fff", border: "1px solid #333", borderRadius: 6, fontSize: 18, cursor: "pointer" }}>-</button>
        <input value={bet.amount} onChange={(e) => setBet({ ...bet, amount: e.target.value })} type="number" style={{ flex: 1, minWidth: 0, padding: 10, borderRadius: 6, border: "2px solid #008542", background: "#fff", fontWeight: "900", fontSize: 16, textAlign: "center", boxSizing: "border-box" }} />
        <button onClick={() => setBet({ ...bet, amount: String(parseFloat(bet.amount || 0) + 10) })} style={{ width: 36, background: "#222", color: "#fff", border: "1px solid #333", borderRadius: 6, fontSize: 18, cursor: "pointer" }}>+</button>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
        {["10", "20", "50", "100"].map((v) => (
          <button key={v} onClick={() => setBet({ ...bet, amount: v })} style={{ flex: 1, padding: 8, background: bet.amount === v ? "#ffcc00" : "#2a2a2a", color: bet.amount === v ? "#000" : "#fff", border: "none", borderRadius: 6, fontWeight: "bold", fontSize: 12, cursor: "pointer" }}>{v}</button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "#aaa", textAlign: "center", margin: "10px 0 4px" }}>AUTO CASHOUT @</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {["2.00", "1.50x", "2.00x", "5.00x", "10.00x"].map((v) => {
          const clean = v.replace("x", "");
          const active = bet.auto === clean;
          return <button key={v} onClick={() => setBet({ ...bet, auto: clean })} style={{ flex: "1 1 0", minWidth: 48, padding: "8px 2px", background: active ? "#ffcc00" : "#2a2a2a", color: active ? "#000" : "#fff", border: "none", borderRadius: 6, fontWeight: "bold", fontSize: 11, cursor: "pointer" }}>{v}</button>;
        })}
      </div>
      <input value={bet.auto} onChange={(e) => setBet({ ...bet, auto: e.target.value })} type="number" step="0.1" placeholder="Custom e.g. 5.00" style={{ width: "100%", marginTop: 6, padding: 8, borderRadius: 6, border: "1px solid #333", background: "#222", color: "#fff", textAlign: "center", boxSizing: "border-box" }} />
      {!bet.placed ? (
        <button onClick={() => placeBet(which)} disabled={phase === "crashed"} style={{ width: "100%", marginTop: 10, padding: 12, background: phase === "crashed" ? "#555" : "#008542", color: "#fff", border: "none", borderRadius: 8, fontWeight: "900", cursor: "pointer" }}>
          {phase === "crashed" ? "WAIT FOR NEXT ROUND" : `PLACE BET - GHS ${bet.amount || 0}`}
        </button>
      ) : bet.cashed ? (
        <div style={{ marginTop: 10, padding: 12, background: "#008542", borderRadius: 8, textAlign: "center", fontWeight: "900" }}>✅ Cashed @ {bet.cashAt}x</div>
      ) : (
        <button onClick={() => cashOut(which)} style={{ width: "100%", marginTop: 10, padding: 12, background: "#ffcc00", color: "#000", border: "none", borderRadius: 8, fontWeight: "900", cursor: "pointer" }}>
          CASH OUT @ {multiplier.toFixed(2)}x = GHS {(parseFloat(bet.amount || 0) * multiplier).toFixed(2)}
        </button>
      )}
      <div style={{ textAlign: "center", fontSize: 11, color: "#888", marginTop: 6 }}>{bet.placed && !bet.cashed ? `Bet ${which} is LIVE` : `No Bet ${which} this round`}</div>
    </div>
  );

  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#fff", padding: 10, paddingBottom: 100, boxSizing: "border-box", overflowX: "hidden" }}>
      <div style={{ textAlign: "center", fontWeight: "900", fontSize: 16 }}>✈️ AVIATOR - 2 BETS</div>
      <div style={{ textAlign: "center", fontSize: 11, color: "#22c55e", marginTop: 2 }}>● LIVE - Round #{round} • Balance: GHS {balance.toFixed(2)} • 13 players online</div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", margin: "10px 0" }}>
        {HISTORY.map((h, i) => (
          <span key={i} style={{ padding: "4px 8px", borderRadius: 20, fontSize: 11, fontWeight: "bold", background: parseFloat(h) > 5 ? "#7c3aed" : parseFloat(h) > 2 ? "#008542" : "#e53935", color: "#fff" }}>{h}</span>
        ))}
      </div>

      <div style={{ background: "#0a0a2a", borderRadius: 12, padding: 20, textAlign: "center", position: "relative", overflow: "hidden", minHeight: 130, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 48, fontWeight: "900", color: phase === "crashed" ? "#ff4444" : "#ffcc00", lineHeight: 1 }}>{multiplier.toFixed(2)}x</div>
        <div style={{ fontSize: 32 }}>{phase === "crashed" ? "💥" : "✈️"}</div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{phase === "crashed" ? "CRASHED! Wait for next round" : phase === "waiting" ? "Next round starting..." : "FLYING..."}</div>
        <div style={{ fontSize: 10, color: "#666", marginTop: 6 }}>Round #{round} • Hash: {hash}</div>
      </div>

      {msg && <div style={{ background: "#1e3a1e", border: "1px solid #008542", padding: 8, borderRadius: 8, fontSize: 12, textAlign: "center", marginTop: 8 }}>{msg}</div>}

      {/* FIXED: Stack on phone, side-by-side on laptop */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, marginTop: 10 }}>
        {renderBetBox(1, bet1, setBet1, "#22c55e", "BET 1")}
        {renderBetBox(2, bet2, setBet2, "#a855f7", "BET 2")}
      </div>

      <div style={{ background: "#1a1a1a", borderRadius: 10, padding: 10, marginTop: 10, fontSize: 11, textAlign: "center", color: "#ccc" }}>
        <b>💡 Pro Strategy:</b> Bet 1 = Safe - Auto Cashout 1.50x • Bet 2 = Big - Auto Cashout 10.00x<br />Bet 1 covers your loss, Bet 2 goes for jackpot!
      </div>

      <div style={{ background: "#1a1a1a", borderRadius: 10, padding: 10, marginTop: 10 }}>
        <div style={{ textAlign: "center", fontWeight: "900", fontSize: 13, marginBottom: 8 }}>👥 Live Bets - This Round</div>
        {liveBets.map((b, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #222", fontSize: 12 }}>
            <span>{b.name}</span><span>GHS {b.amount}</span><span style={{ color: "#22c55e" }}>Cashed @ {b.cash}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}