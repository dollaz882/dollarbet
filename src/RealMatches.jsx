import { useEffect, useState, useCallback } from "react";

function hash(id) { const s = String(id); let h = 0; for (let c of s) h = (h * 31 + c.charCodeAt(0)) % 1000; return h; }
function getOdds(id) {
  const h = hash(id);
  return { home: (1.6 + (h % 60) / 100).toFixed(2), draw: (3.0 + (h % 40) / 100).toFixed(2), away: (2.2 + (h % 80) / 100).toFixed(2) };
}
function getMarkets(id, home, away) {
  const h = hash(id);
  const r = (base, spread) => (base + ((h * 7 + spread) % 60) / 100).toFixed(2);
  return {
    double: [
      { label: "1X", desc: `${home} or Draw`, odd: r(1.25, 1) },
      { label: "12", desc: `${home} or ${away}`, odd: r(1.30, 2) },
      { label: "X2", desc: `Draw or ${away}`, odd: r(1.45, 3) },
    ],
    half: [
      { label: "1 - 1st Half", desc: `${home} HT`, odd: r(2.10, 4) },
      { label: "X - 1st Half", desc: `Draw HT`, odd: r(2.05, 5) },
      { label: "2 - 1st Half", desc: `${away} HT`, odd: r(2.80, 6) },
    ],
    overUnder: [
      { label: "Over 1.5", desc: "Total Goals", odd: r(1.35, 7) },
      { label: "Under 1.5", desc: "Total Goals", odd: r(3.10, 8) },
      { label: "Over 2.5", desc: "Total Goals", odd: r(1.95, 9) },
      { label: "Under 2.5", desc: "Total Goals", odd: r(1.85, 10) },
      { label: "Over 3.5", desc: "Total Goals", odd: r(2.90, 11) },
      { label: "Under 3.5", desc: "Total Goals", odd: r(1.40, 12) },
    ],
    correct: [
      { label: "1-0", desc: "Correct Score", odd: r(6.50, 13) },
      { label: "2-0", desc: "Correct Score", odd: r(8.00, 14) },
      { label: "2-1", desc: "Correct Score", odd: r(8.50, 15) },
      { label: "1-1", desc: "Correct Score", odd: r(6.00, 16) },
      { label: "0-0", desc: "Correct Score", odd: r(9.00, 17) },
      { label: "0-1", desc: "Correct Score", odd: r(9.50, 18) },
      { label: "1-2", desc: "Correct Score", odd: r(11.00, 19) },
      { label: "0-2", desc: "Correct Score", odd: r(13.00, 20) },
    ],
    handicap: [
      { label: `${home} -1`, desc: "Handicap", odd: r(2.40, 21) },
      { label: `${home} +1`, desc: "Handicap", odd: r(1.35, 22) },
      { label: `${away} -1`, desc: "Handicap", odd: r(3.80, 23) },
      { label: `${away} +1`, desc: "Handicap", odd: r(1.25, 24) },
    ],
    corners: [
      { label: "Over 8.5 Corners", desc: "Corners", odd: r(1.85, 25) },
      { label: "Under 8.5 Corners", desc: "Corners", odd: r(1.95, 26) },
      { label: "Over 10.5 Corners", desc: "Corners", odd: r(2.50, 27) },
      { label: "Under 10.5 Corners", desc: "Corners", odd: r(1.55, 28) },
    ],
    scorer: [
      { label: `${home} Striker`, desc: "Anytime Scorer", odd: r(2.30, 29) },
      { label: `${away} Striker`, desc: "Anytime Scorer", odd: r(2.70, 30) },
      { label: `${home} Midfielder`, desc: "Anytime Scorer", odd: r(4.50, 31) },
      { label: `${away} Midfielder`, desc: "Anytime Scorer", odd: r(5.00, 32) },
    ],
  };
}
function getDate(offset) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }

export default function RealMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [day, setDay] = useState(0);
  const [selections, setSelections] = useState([]);
  const [stake, setStake] = useState("10");
  const [expanded, setExpanded] = useState(null);
  const [marketTab, setMarketTab] = useState("main");
  const [slipOpen, setSlipOpen] = useState(false);

  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("dollarbet-user") || "null"); } catch { return null; } });
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [loginMsg, setLoginMsg] = useState("");

  const [showMoMo, setShowMoMo] = useState(false);
  const [momoAmount, setMomoAmount] = useState("50");
  const [momoNetwork, setMomoNetwork] = useState("MTN MoMo");
  const [momoPhone, setMomoPhone] = useState("");

  const [balance, setBalance] = useState(() => { try { const u = JSON.parse(localStorage.getItem("dollarbet-user") || "null"); if (u) return Number(localStorage.getItem(`dollarbet-balance-${u.phone}`) || 0); return 0; } catch { return 0; } });
  const [myBets, setMyBets] = useState(() => { try { const u = JSON.parse(localStorage.getItem("dollarbet-user") || "null"); if (u) return JSON.parse(localStorage.getItem(`dollarbet-bets-${u.phone}`) || "[]"); return []; } catch { return []; } });
  const [showBets, setShowBets] = useState(false);
  const [betsFilter, setBetsFilter] = useState("All");
  const [lastUpdated, setLastUpdated] = useState("");
  const [copied, setCopied] = useState(false);

  const totalOdds = selections.length > 0 ? selections.reduce((acc, s) => acc * Number(s.odd), 1) : 0;

  useEffect(() => { if (user) { localStorage.setItem(`dollarbet-balance-${user.phone}`, String(balance)); localStorage.setItem(`dollarbet-bets-${user.phone}`, JSON.stringify(myBets)); } }, [balance, myBets, user]);

  const loadMatches = useCallback(async (force = false, dayOffset = 0) => {
    const dateStr = getDate(dayOffset);
    const cacheKey = `matches-${dateStr}`;
    if (!force) { const saved = localStorage.getItem(cacheKey); if (saved) { setMatches(JSON.parse(saved)); setLoading(false); setLastUpdated(new Date().toLocaleTimeString()); return; } }
    try {
      setLoading(true);
      const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${dateStr}`, { headers: { "x-rapidapi-key": import.meta.env.VITE_API_FOOTBALL_KEY, "x-rapidapi-host": "v3.football.api-sports.io" } });
      const data = await res.json();
      if (data.errors && Object.keys(data.errors).length > 0) { setError("API limit or key error."); setLoading(false); return; }
      const list = data.response || [];
      localStorage.setItem(cacheKey, JSON.stringify(list));
      setMatches(list); setLastUpdated(new Date().toLocaleTimeString()); setLoading(false);
    } catch (e) { setError("Failed to load. Check internet."); setLoading(false); }
  }, []);

  useEffect(() => { setFilter("ALL"); setSelections([]); loadMatches(false, day); }, [day, loadMatches]);
  const leagues = ["ALL", ...new Set(matches.map((m) => `${m.league.name} - ${m.league.country}`))];
  const shown = filter === "ALL" ? matches : matches.filter((m) => `${m.league.name} - ${m.league.country}` === filter);

  const doSignup = () => {
    if (!authName.trim()) { setLoginMsg("Please enter your name"); return; }
    if (!authPhone.trim()) { setLoginMsg("Please enter your phone"); return; }
    if (!authPass.trim() || authPass.length < 4) { setLoginMsg("Password must be at least 4 characters"); return; }
    const users = JSON.parse(localStorage.getItem("dollarbet-users") || "[]");
    if (users.find((u) => u.phone === authPhone.trim())) { setLoginMsg("This phone already has an account. Please Login."); setAuthMode("login"); return; }
    const newUser = { name: authName.trim(), phone: authPhone.trim(), pass: authPass.trim() };
    users.push(newUser);
    localStorage.setItem("dollarbet-users", JSON.stringify(users));
    localStorage.setItem("dollarbet-user", JSON.stringify(newUser));
    localStorage.setItem(`dollarbet-balance-${newUser.phone}`, "0");
    localStorage.setItem(`dollarbet-bets-${newUser.phone}`, "[]");
    setUser(newUser); setBalance(0); setMyBets([]); setShowAuth(false); setLoginMsg(""); setAuthName(""); setAuthPhone(""); setAuthPass("");
    alert(`Welcome ${newUser.name}! Account created.`);
  };
  const doLogin = () => {
    if (!authPhone.trim() || !authPass.trim()) { setLoginMsg("Enter phone + password"); return; }
    const users = JSON.parse(localStorage.getItem("dollarbet-users") || "[]");
    const found = users.find((u) => u.phone === authPhone.trim() && u.pass === authPass.trim());
    if (!found) { setLoginMsg("No account found or wrong password. Please Sign Up first."); return; }
    localStorage.setItem("dollarbet-user", JSON.stringify(found));
    setUser(found); setBalance(Number(localStorage.getItem(`dollarbet-balance-${found.phone}`) || 0)); setMyBets(JSON.parse(localStorage.getItem(`dollarbet-bets-${found.phone}`) || "[]"));
    setShowAuth(false); setLoginMsg(""); setAuthName(""); setAuthPhone(""); setAuthPass("");
  };
  const doLogout = () => { setUser(null); setBalance(0); setMyBets([]); localStorage.removeItem("dollarbet-user"); };

  const placeBet = () => {
    if (!user) { setShowAuth(true); setAuthMode("login"); return alert("Login first to place bet!"); }
    const amount = Number(stake);
    if (selections.length === 0) return alert("Pick at least 1 team first!");
    if (!amount || amount <= 0) return alert("Enter amount");
    if (amount > balance) return alert("Not enough balance! Deposit with MoMo.");
    const win = (amount * totalOdds).toFixed(2);
    const nb = balance - amount;
    const bet = {
      match: selections.map(s => `${s.match} (${s.market}: ${s.pick} @ ${s.odd})`).join(" | "),
      pick: selections.length > 1 ? `Accumulator x${selections.length}` : selections[0].pick,
      odd: totalOdds.toFixed(2), market: selections.length > 1 ? "Accumulator" : selections[0].market,
      stake: amount, win, time: new Date().toLocaleString(), id: Date.now(),
      selections: [...selections], status: "Pending",
      betId: "DB" + String(Date.now()).slice(-8)
    };
    setBalance(nb); setMyBets([bet, ...myBets]); setSelections([]); setSlipOpen(false);
    alert(`Bet placed! ${selections.length} selections @ ${totalOdds.toFixed(2)} - Potential win: GHS ${win}`);
  };

  const doMoMoDeposit = () => {
    if (!user) { setShowMoMo(false); setShowAuth(true); return alert("Login first!"); }
    const amt = Number(momoAmount);
    if (!amt || amt < 1) return alert("Enter amount");
    if (!momoPhone.trim()) return alert("Enter MoMo number");
    const nb = balance + amt; setBalance(nb); setShowMoMo(false);
    alert(`Deposit: GHS ${amt} from ${momoNetwork} added! Balance now GHS ${nb.toFixed(2)}`);
  };

  const shareLink = async () => {
    const link = window.location.href;
    try { await navigator.clipboard.writeText(`Join me on DollarBet! Bet on real matches: ${link}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { prompt("Copy this link to share:", link); }
  };

  const shareBet = async (bet) => {
    const text = `My DollarBet Slip ${bet.betId}: ${bet.selections ? bet.selections.map(s => `${s.match} - ${s.pick} @${s.odd}`).join(" | ") : bet.match} - Stake GHS ${bet.stake} - To Win GHS ${bet.win}`;
    try { await navigator.clipboard.writeText(text); alert("Bet slip copied!"); } catch { prompt("Copy slip:", text); }
  };

  const pickBet = (m, market, pickLabel, odd, pickDesc) => {
    const fullPick = `${pickLabel} ${pickDesc ? `- ${pickDesc}` : ""}`.trim();
    const key = `${m.fixture.id}-${market}-${fullPick}`;
    const newSel = { matchId: m.fixture.id, match: `${m.teams.home.name} vs ${m.teams.away.name}`, market, pick: fullPick, odd, type: key, key };
    setSelections(prev => {
      if (prev.find(s => s.key === key)) return prev.filter(s => s.key !== key);
      if (prev.find(s => s.matchId === newSel.matchId)) return prev.map(s => s.matchId === newSel.matchId ? newSel : s);
      return [...prev, newSel];
    });
  };
  const isSelected = (matchId, market, pickLabel, pickDesc) => {
    const fullPick = `${pickLabel} ${pickDesc ? `- ${pickDesc}` : ""}`.trim();
    const key = `${matchId}-${market}-${fullPick}`;
    return selections.some(s => s.key === key);
  };

  const filteredBets = betsFilter === "All" ? myBets : myBets.filter(b => (b.status || "Pending") === betsFilter);
  const pendingCount = myBets.filter(b => (b.status || "Pending") === "Pending").length;

  if (loading) return <p style={{ padding: 20, color: "#fff", background: "#111", minHeight: "100vh" }}>Loading...</p>;
  if (error) return <p style={{ padding: 20 }}>{error}</p>;

  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#fff", fontFamily: "Arial", paddingBottom: 130 }}>
      <div style={{ background: "#008542", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontWeight: "900", fontSize: 22 }}>Dollar<span style={{ color: "#ffcc00" }}>Bet</span></div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={shareLink} style={{ background: "#fff", border: "none", padding: "6px 10px", borderRadius: 20, fontWeight: "bold", cursor: "pointer" }}>{copied ? "Copied! ✅" : "Share 🔗"}</button>
          <button onClick={() => setShowBets(!showBets)} style={{ background: "#fff", border: "none", padding: "6px 10px", borderRadius: 20, fontWeight: "bold", cursor: "pointer" }}>My Bets ({myBets.length})</button>
          {user ? <span style={{ fontWeight: "bold", fontSize: 13 }}>Hi, {user.name} • GHS {balance.toFixed(2)}</span> : <button onClick={() => { setShowAuth(true); setAuthMode("login"); }} style={{ background: "#ffcc00", border: "none", padding: "6px 12px", borderRadius: 20, fontWeight: "bold", cursor: "pointer" }}>Login</button>}
          <button onClick={() => setShowMoMo(true)} style={{ background: "#ffcc00", border: "none", padding: "6px 12px", borderRadius: 20, fontWeight: "bold", cursor: "pointer" }}>Deposit MoMo</button>
          {user && <button onClick={doLogout} style={{ background: "transparent", color: "#fff", border: "1px solid #fff", padding: "5px 8px", borderRadius: 20, cursor: "pointer", fontSize: 12 }}>Logout</button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: 12 }}>
        <button onClick={() => setDay(0)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: day === 0 ? "#008542" : "#222", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Today</button>
        <button onClick={() => setDay(1)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: day === 1 ? "#008542" : "#222", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Tomorrow</button>
        <button onClick={() => loadMatches(true, day)} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#ffcc00", fontWeight: "bold", cursor: "pointer" }}>Refresh 🔄</button>
      </div>

      <div style={{ padding: "0 12px", fontSize: 12, color: "#aaa" }}>Last updated: {lastUpdated} • {shown.length} matches {selections.length > 0 && <span style={{ color: "#ffcc00", fontWeight: "bold" }}>• Slip: {selections.length} selections @ {totalOdds.toFixed(2)}</span>}</div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ margin: 12, width: "calc(100% - 24px)", padding: 10, borderRadius: 6, background: "#222", color: "#fff", border: "1px solid #333" }}>
        {leagues.map((l) => <option key={l} value={l}>{l === "ALL" ? "All Leagues" : l}</option>)}
      </select>

      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#1c1c1c", padding: 20, borderRadius: 12, width: "100%", maxWidth: 350 }}>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>{authMode === "login" ? "Login" : "Sign Up"}</h3>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button onClick={() => { setAuthMode("login"); setLoginMsg(""); }} style={{ flex: 1, padding: 10, background: authMode === "login" ? "#008542" : "#333", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold" }}>Login</button>
              <button onClick={() => { setAuthMode("signup"); setLoginMsg(""); }} style={{ flex: 1, padding: 10, background: authMode === "signup" ? "#ffcc00" : "#333", color: authMode === "signup" ? "#000" : "#fff", border: "none", borderRadius: 6, fontWeight: "bold" }}>Sign Up</button>
            </div>
            {authMode === "signup" && <input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Your Name" style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #333", background: "#222", color: "#fff", boxSizing: "border-box" }} />}
            <input value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="Phone e.g. 0551234567" style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #333", background: "#222", color: "#fff", boxSizing: "border-box" }} />
            <input value={authPass} onChange={(e) => setAuthPass(e.target.value)} type="password" placeholder="Password" style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #333", background: "#222", color: "#fff", boxSizing: "border-box" }} />
            {loginMsg && <p style={{ color: "#ffcc00", fontSize: 13, textAlign: "center" }}>{loginMsg}</p>}
            <button onClick={authMode === "login" ? doLogin : doSignup} style={{ width: "100%", padding: 12, background: "#008542", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>{authMode === "login" ? "Login" : "Create Account"}</button>
            <button onClick={() => setShowAuth(false)} style={{ width: "100%", padding: 10, background: "transparent", color: "#aaa", border: "none", cursor: "pointer", marginTop: 6 }}>Cancel</button>
          </div>
        </div>
      )}

      {showMoMo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#1c1c1c", padding: 20, borderRadius: 12, width: "100%", maxWidth: 350 }}>
            <h3 style={{ marginTop: 0 }}>Deposit - MoMo</h3>
            <select value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, background: "#222", color: "#fff", border: "1px solid #333" }}><option>MTN MoMo</option><option>Telecel Cash</option><option>AirtelTigo Money</option></select>
            <input value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} placeholder="MoMo Number" style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #333", background: "#222", color: "#fff", boxSizing: "border-box" }} />
            <input value={momoAmount} onChange={(e) => setMomoAmount(e.target.value)} type="number" placeholder="Amount GHS" style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #333", background: "#222", color: "#fff", boxSizing: "border-box" }} />
            <button onClick={doMoMoDeposit} style={{ width: "100%", padding: 12, background: "#ffcc00", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>Deposit GHS {momoAmount || 0}</button>
            <button onClick={() => setShowMoMo(false)} style={{ width: "100%", padding: 10, background: "transparent", color: "#aaa", border: "none", cursor: "pointer", marginTop: 6 }}>Cancel</button>
          </div>
        </div>
      )}

      {showBets && (
        <div style={{ position: "fixed", inset: 0, background: "#f2f2f2", zIndex: 90, overflowY: "auto", paddingBottom: 80, color: "#000" }}>
          <div style={{ background: "#008542", color: "#fff", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 5 }}>
            <div style={{ fontWeight: "900", fontSize: 18 }}>My Bets <span style={{ fontSize: 12, fontWeight: "400", opacity: 0.9 }}>({myBets.length})</span></div>
            <button onClick={() => setShowBets(false)} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: "50%", width: 30, height: 30, fontWeight: "bold", cursor: "pointer", fontSize: 16 }}>X</button>
          </div>
          <div style={{ display: "flex", gap: 0, background: "#fff", borderBottom: "1px solid #ddd", position: "sticky", top: 50, zIndex: 4 }}>
            {["All", "Pending", "Won", "Lost"].map((t) => (
              <button key={t} onClick={() => setBetsFilter(t)} style={{ flex: 1, padding: "12px 0", background: "#fff", border: "none", borderBottom: betsFilter === t ? "3px solid #008542" : "3px solid transparent", color: betsFilter === t ? "#008542" : "#777", fontWeight: betsFilter === t ? "900" : "600", fontSize: 13, cursor: "pointer" }}>{t} {t === "Pending" && pendingCount > 0 ? `(${pendingCount})` : ""}</button>
            ))}
          </div>
          <div style={{ padding: 12 }}>
            {!user && <div style={{ background: "#fff", padding: 20, borderRadius: 8, textAlign: "center", color: "#666" }}>Login to see your bets<br /><button onClick={() => { setShowBets(false); setShowAuth(true); }} style={{ marginTop: 10, padding: "10px 20px", background: "#008542", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold" }}>Login</button></div>}
            {user && filteredBets.length === 0 && <div style={{ background: "#fff", padding: 30, borderRadius: 8, textAlign: "center", color: "#888" }}><div style={{ fontSize: 32 }}>🎫</div><div style={{ marginTop: 8, fontWeight: "bold", color: "#333" }}>No {betsFilter === "All" ? "" : betsFilter} bets yet</div></div>}
            {user && filteredBets.map((b) => {
              const status = b.status || "Pending";
              const statusColor = status === "Pending" ? "#ff9800" : status === "Won" ? "#008542" : "#e53935";
              const statusBg = status === "Pending" ? "#fff3e0" : status === "Won" ? "#e8f5e9" : "#ffebee";
              const sels = b.selections || [{ match: b.match, market: b.market, pick: b.pick, odd: b.odd }];
              return (
                <div key={b.id} style={{ background: "#fff", borderRadius: 10, marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#fafafa", borderBottom: "1px solid #eee" }}>
                    <div><div style={{ fontSize: 11, color: "#888" }}>Bet ID: <b style={{ color: "#333" }}>{b.betId || "DB" + String(b.id).slice(-8)}</b> • {b.market === "Accumulator" ? `Accumulator • ${sels.length} Folds` : "Single"}</div><div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{b.time}</div></div>
                    <span style={{ background: statusBg, color: statusColor, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: "900" }}>{status === "Pending" ? "● Pending" : status === "Won" ? "✓ Won" : "✕ Lost"}</span>
                  </div>
                  {sels.map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: i < sels.length - 1 ? "1px dashed #eee" : "none" }}>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: "700", fontSize: 13, color: "#111" }}>{s.match}</div><div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{s.market}: <b style={{ color: "#008542" }}>{s.pick}</b></div></div>
                      <div style={{ textAlign: "right", marginLeft: 8 }}><div style={{ fontWeight: "900", fontSize: 13 }}>@ {s.odd}</div><div style={{ fontSize: 10, color: "#ff9800", fontWeight: "700" }}>Pending</div></div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f9f9f9", borderTop: "1px solid #eee", fontSize: 12 }}>
                    <div>Stake<br /><b style={{ fontSize: 14 }}>GHS {Number(b.stake).toFixed(2)}</b></div>
                    <div style={{ textAlign: "center" }}>Total Odds<br /><b style={{ fontSize: 14, color: "#008542" }}>{Number(b.odd).toFixed(2)}</b></div>
                    <div style={{ textAlign: "right" }}>Potential Win<br /><b style={{ fontSize: 14, color: "#ff8f00" }}>GHS {Number(b.win).toFixed(2)}</b></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, padding: "0 12px 12px", background: "#f9f9f9" }}>
                    <button onClick={() => shareBet(b)} style={{ flex: 1, padding: 8, background: "#fff", border: "1px solid #ddd", borderRadius: 6, fontWeight: "bold", fontSize: 12, cursor: "pointer" }}>Share Slip 🔗</button>
                    <button onClick={() => { if (confirm("Cash out this bet?")) { setMyBets(prev => prev.map(x => x.id === b.id ? { ...x, status: "Lost" } : x)); } }} style={{ flex: 1, padding: 8, background: "#fff", border: "1px solid #ddd", borderRadius: 6, fontWeight: "bold", fontSize: 12, cursor: "pointer", color: "#e53935" }}>Cash Out</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding: "0 12px" }}>
        {shown.map((m) => {
          const odds = getOdds(m.fixture.id);
          const markets = getMarkets(m.fixture.id, m.teams.home.name, m.teams.away.name);
          const isLive = ["1H", "2H", "HT", "ET", "P"].includes(m.fixture.status.short);
          const isOpen = expanded === m.fixture.id;
          const renderRow = (title, items, marketName) => (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: "bold", color: "#ffcc00", marginBottom: 6 }}>{title}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {items.map((it, idx) => {
                  const active = isSelected(m.fixture.id, marketName, it.label, it.desc);
                  return <button key={idx} onClick={() => pickBet(m, marketName, it.label, it.odd, it.desc)} style={{ padding: "8px 10px", borderRadius: 6, border: active ? "2px solid #ffcc00" : "1px solid #444", background: active ? "#008542" : "#2a2a2a", color: "#fff", cursor: "pointer", fontSize: 12, textAlign: "left" }}><div style={{ fontWeight: "bold" }}>{it.label} {active ? "✓" : ""}</div><div style={{ fontSize: 10, color: "#aaa" }}>{it.desc}</div><div style={{ fontWeight: "bold", color: "#ffcc00" }}>{it.odd}</div></button>;
                })}
              </div>
            </div>
          );
          const hasPick = selections.some(s => s.matchId === m.fixture.id);
          return (
            <div key={m.fixture.id} style={{ background: "#1c1c1c", padding: 12, marginBottom: 8, borderRadius: 8, border: hasPick ? "2px solid #ffcc00" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{m.league.name} • {m.league.country} {isLive && <span style={{ color: "#22c55e", fontWeight: "bold" }}>● LIVE {m.fixture.status.elapsed}'</span>}</div>
                  <div style={{ fontWeight: "bold", marginTop: 4, fontSize: 14 }}>{m.teams.home.name} vs {m.teams.away.name}</div>
                  <div style={{ fontSize: 12, color: "#ccc" }}>{new Date(m.fixture.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {m.fixture.status.long} • {m.goals.home ?? "-"} - {m.goals.away ?? "-"}</div>
                </div>
                <div style={{ width: 150, display: "flex", gap: 5 }}>
                  {[{ label: odds.home, team: m.teams.home.name, type: "1" }, { label: odds.draw, team: "Draw", type: "X" }, { label: odds.away, team: m.teams.away.name, type: "2" }].map((o) => {
                    const pickLabel = o.type + " - " + o.team;
                    const active = isSelected(m.fixture.id, "1X2", pickLabel, "");
                    return <button key={o.type} onClick={() => pickBet(m, "1X2", pickLabel, o.label, "")} style={{ flex: 1, padding: "10px 0", borderRadius: 6, border: active ? "2px solid #ffcc00" : "1px solid #333", background: active ? "#008542" : "#2a2a2a", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>{o.label} {active ? "✓" : ""}</button>;
                  })}
                </div>
              </div>
              <button onClick={() => { setExpanded(isOpen ? null : m.fixture.id); setMarketTab("main"); }} style={{ width: "100%", marginTop: 8, padding: 7, background: "#222", color: "#ffcc00", border: "1px solid #333", borderRadius: 6, cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>{isOpen ? "Hide Markets ▲" : "More Markets: Double Chance • Over/Under • Correct Score • Handicap • Corners • Scorer ▼"}</button>
              {isOpen && (
                <div style={{ marginTop: 12, borderTop: "1px solid #333", paddingTop: 10 }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                    {["main", "goals", "score", "other"].map((t) => (
                      <button key={t} onClick={() => setMarketTab(t)} style={{ padding: "6px 10px", borderRadius: 20, border: "none", background: marketTab === t ? "#ffcc00" : "#333", color: marketTab === t ? "#000" : "#fff", fontWeight: "bold", fontSize: 11, cursor: "pointer" }}>{t === "main" ? "Main" : t === "goals" ? "Goals / Half" : t === "score" ? "Correct Score" : "Handicap / Corners / Scorer"}</button>
                    ))}
                  </div>
                  {marketTab === "main" && <>{renderRow("DOUBLE CHANCE", markets.double, "Double Chance")}{renderRow("HANDICAP", markets.handicap, "Handicap")}</>}
                  {marketTab === "goals" && <>{renderRow("1ST HALF", markets.half, "1st Half")}{renderRow("OVER / UNDER", markets.overUnder, "Over/Under")}</>}
                  {marketTab === "score" && <>{renderRow("CORRECT SCORE", markets.correct, "Correct Score")}</>}
                  {marketTab === "other" && <>{renderRow("CORNERS", markets.corners, "Corners")}{renderRow("PLAYER TO SCORE", markets.scorer, "Player To Score")}</>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== FIXED: SLIP NOW MATCHES 720px FRAME - CENTERED ===== */}
      {selections.length > 0 && (
        <div style={{ position: "fixed", bottom: 62, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 720, background: "#fff", color: "#000", zIndex: 60, boxShadow: "0 -4px 20px rgba(0,0,0,0.5)", borderTop: "3px solid #ffcc00", borderLeft: "1px solid #222", borderRight: "1px solid #222" }}>
          <button onClick={() => setSlipOpen(!slipOpen)} style={{ width: "100%", background: slipOpen ? "#008542" : "#ffcc00", color: slipOpen ? "#fff" : "#000", border: "none", padding: "12px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "900" }}>
            <span>🎫 BET SLIP - {selections.length} Selection{selections.length > 1 ? "s" : ""} @ {totalOdds.toFixed(2)}</span>
            <span>To Win: GHS {(Number(stake || 0) * totalOdds).toFixed(2)} &nbsp; {slipOpen ? "▼ HIDE" : "▲ CHECK SLIP"}</span>
          </button>
          {slipOpen && (
            <div style={{ padding: 12, maxHeight: "45vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: "900", fontSize: 13, color: "#008542" }}>{selections.length > 1 ? "ACCUMULATOR" : "SINGLE"}</div>
                <button onClick={() => setSelections([])} style={{ background: "#eee", border: "none", borderRadius: 12, padding: "4px 10px", cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>Clear All X</button>
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Total Odds: <b style={{ color: "#000", fontSize: 14 }}>{totalOdds.toFixed(2)}</b> • Balance: GHS {balance.toFixed(2)}</div>
              {selections.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f7f7f7", padding: "8px 10px", borderRadius: 6, marginTop: 6, fontSize: 13 }}>
                  <div><b>{s.match}</b><div style={{ fontSize: 12, color: "#555" }}>{s.market}: {s.pick}</div></div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}><b style={{ color: "#008542" }}>@ {s.odd}</b><button onClick={() => setSelections(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "#ffdddd", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontWeight: "bold" }}>X</button></div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input value={stake} onChange={(e) => setStake(e.target.value)} type="number" placeholder="Amount GHS" style={{ flex: 1, padding: 12, borderRadius: 6, border: "2px solid #008542", fontSize: 16, fontWeight: "bold" }} />
                <div style={{ padding: 12, background: "#f0f0f0", borderRadius: 6, fontWeight: "bold", fontSize: 13, whiteSpace: "nowrap" }}>To Win: GHS {(Number(stake || 0) * totalOdds).toFixed(2)}</div>
                <button onClick={placeBet} style={{ background: "#008542", color: "#fff", border: "none", padding: "12px 18px", borderRadius: 6, fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>PLACE BET</button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {["10", "20", "50", "100"].map((v) => (<button key={v} onClick={() => setStake(v)} style={{ flex: 1, padding: 6, background: stake === v ? "#ffcc00" : "#eee", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>GHS {v}</button>))}
              </div>
              <button onClick={() => setSlipOpen(false)} style={{ width: "100%", marginTop: 8, padding: 8, background: "#eee", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>Hide Slip ▼</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}