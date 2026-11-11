import { useEffect, useState } from "react";
const KEY = import.meta.env.VITE_API_FOOTBALL_KEY;
const CONFIG = {
  NBA: { host: "v2.nba.api-sports.io", url: "https://v2.nba.api-sports.io/games?date=" },
  NFL: { host: "v1.american-football.api-sports.io", url: "https://v1.american-football.api-sports.io/games?date=" },
  Hockey: { host: "v1.hockey.api-sports.io", url: "https://v1.hockey.api-sports.io/games?date=" },
  Rugby: { host: "v1.rugby.api-sports.io", url: "https://v1.rugby.api-sports.io/games?date=" },
  Volleyball: { host: "v1.volleyball.api-sports.io", url: "https://v1.volleyball.api-sports.io/games?date=" },
  Handball: { host: "v1.handball.api-sports.io", url: "https://v1.handball.api-sports.io/games?date=" },
  MMA: { host: "v1.mma.api-sports.io", url: "https://v1.mma.api-sports.io/fights?date=" },
  "Formula-1": { host: "v1.formula-1.api-sports.io", url: "https://v1.formula-1.api-sports.io/races?season=2025" },
  Basketball: { host: "v1.basketball.api-sports.io", url: "https://v1.basketball.api-sports.io/games?date=" },
  Baseball: { host: "v1.baseball.api-sports.io", url: "https://v1.baseball.api-sports.io/games?date=" },
  AFL: { host: "v1.afl.api-sports.io", url: "https://v1.afl.api-sports.io/games?date=" },
  Tennis: { host: "v1.tennis.api-sports.io", url: "https://v1.tennis.api-sports.io/games?date=" },
  Cricket: { host: "v1.cricket.api-sports.io", url: "https://v1.cricket.api-sports.io/games?date=" },
};
function getDate(offset) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }
function hash(id) { const s = String(id); let h = 0; for (let c of s) h = (h * 31 + c.charCodeAt(0)) % 1000; return h; }
export default function OtherSports({ sport, balance, setBalance }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stake, setStake] = useState("10");
  const [picked, setPicked] = useState(null);
  const [day, setDay] = useState(0);
  const [slipOpen, setSlipOpen] = useState(false);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const cfg = CONFIG[sport];
      if (!cfg) { setGames([]); setLoading(false); return; }
      const dateStr = getDate(day);
      const cacheKey = `${sport}-${dateStr}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setGames(JSON.parse(cached)); setLoading(false); return; }
      try {
        const url = sport === "Formula-1" ? cfg.url : cfg.url + dateStr;
        const res = await fetch(url, { headers: { "x-rapidapi-key": KEY, "x-rapidapi-host": cfg.host } });
        const data = await res.json();
        const list = data.response || [];
        localStorage.setItem(cacheKey, JSON.stringify(list));
        setGames(list);
      } catch (e) { console.log(e); setGames([]); }
      setLoading(false);
    };
    load();
  }, [sport, day]);
  const getTeams = (g) => {
    if (g.teams) return [g.teams.home?.name || "Home", g.teams.away?.name || "Away"];
    if (g.fighters) return [g.fighters[0]?.name || "Fighter 1", g.fighters[1]?.name || "Fighter 2"];
    if (g.home) return [g.home, g.away];
    return ["Home", "Away"];
  };
  const getTime = (g) => g.date ? new Date(g.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : g.time || "";
  const getLeague = (g) => g.league?.name || g.competition || g.circuit?.name || sport;
  const isActive = (match, team) => picked?.match === match && picked?.team === team;
  const handlePick = (match, team, odd) => {
    if (isActive(match, team)) { setPicked(null); return; }
    setPicked({ match, team, odd });
  };
  const place = () => {
    if (!picked) return alert("Pick a team first!");
    const amt = Number(stake);
    if (amt > balance) return alert("Not enough balance!");
    setBalance(balance - amt);
    alert(`${sport} Bet Placed: ${picked.match} - ${picked.team} @ ${picked.odd} - To Win GHS ${(amt * Number(picked.odd)).toFixed(2)}`);
    setPicked(null); setSlipOpen(false);
  };
  if (loading) return <p style={{ padding: 20, color: "#fff" }}>Loading real {sport}...</p>;
  return (
    <div style={{ padding: 12, color: "#fff", paddingBottom: 130 }}>
      <h2 style={{ textAlign: "center" }}>{sport} - REAL</h2>
      <p style={{ textAlign: "center", fontSize: 12, color: "#22c55e" }}>● Live from API-Sports • {games.length} games • Tap a team - it turns GREEN</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setDay(0)} style={{ flex: 1, padding: 10, background: day === 0 ? "#008542" : "#222", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold" }}>Today</button>
        <button onClick={() => setDay(1)} style={{ flex: 1, padding: 10, background: day === 1 ? "#008542" : "#222", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold" }}>Tomorrow</button>
      </div>
      {games.length === 0 && <p style={{ textAlign: "center", color: "#aaa", padding: 20 }}>No {sport} games today.<br />Try Tomorrow, or this sport is off-season.</p>}
      {games.map((g, i) => {
        const [home, away] = getTeams(g);
        const matchName = `${home} vs ${away}`;
        const h = hash(g.id || i);
        const oddHome = (1.50 + (h % 70) / 100).toFixed(2);
        const oddAway = (1.60 + ((h + 30) % 80) / 100).toFixed(2);
        const oddOver = (1.85 + (h % 20) / 100).toFixed(2);
        const oddUnder = (1.90 + (h % 20) / 100).toFixed(2);
        const activeHome = isActive(matchName, home);
        const activeAway = isActive(matchName, away);
        const activeOver = isActive(matchName, "Over");
        const activeUnder = isActive(matchName, "Under");
        const hasPick = picked?.match === matchName;
        return (
          <div key={g.id || i} style={{ background: "#1c1c1c", padding: 12, borderRadius: 8, marginBottom: 8, border: hasPick ? "2px solid #ffcc00" : "none" }}>
            <div style={{ fontSize: 11, color: "#aaa" }}>{getLeague(g)}</div>
            <div style={{ fontWeight: "bold", margin: "4px 0" }}>{home} vs {away}</div>
            <div style={{ fontSize: 12, color: "#ccc", marginBottom: 8 }}>{getTime(g)} • {g.status?.long || g.status || "Not Started"}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => handlePick(matchName, home, oddHome)} style={{ flex: 1, padding: 12, background: activeHome ? "#008542" : "#2a2a2a", color: "#fff", border: activeHome ? "2px solid #ffcc00" : "1px solid #333", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>{home} @ {oddHome} {activeHome ? "✓" : ""}</button>
              <button onClick={() => handlePick(matchName, away, oddAway)} style={{ flex: 1, padding: 12, background: activeAway ? "#008542" : "#2a2a2a", color: "#fff", border: activeAway ? "2px solid #ffcc00" : "1px solid #333", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>{away} @ {oddAway} {activeAway ? "✓" : ""}</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button onClick={() => handlePick(matchName, "Over", oddOver)} style={{ flex: 1, padding: 10, background: activeOver ? "#008542" : "#222", color: activeOver ? "#fff" : "#ffcc00", border: activeOver ? "2px solid #ffcc00" : "1px solid #333", borderRadius: 6, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>Over @ {oddOver} {activeOver ? "✓" : ""}</button>
              <button onClick={() => handlePick(matchName, "Under", oddUnder)} style={{ flex: 1, padding: 10, background: activeUnder ? "#008542" : "#222", color: activeUnder ? "#fff" : "#ffcc00", border: activeUnder ? "2px solid #ffcc00" : "1px solid #333", borderRadius: 6, fontSize: 12, fontWeight: "bold", cursor: "pointer" }}>Under @ {oddUnder} {activeUnder ? "✓" : ""}</button>
            </div>
          </div>
        );
      })}
      {/* ===== FIXED: SLIP NOW MATCHES 720px FRAME - CENTERED ===== */}
      {picked && (
        <div style={{ position: "fixed", bottom: 62, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 720, background: "#fff", color: "#000", zIndex: 60, borderTop: "3px solid #ffcc00", borderLeft: "1px solid #222", borderRight: "1px solid #222" }}>
          <button onClick={() => setSlipOpen(!slipOpen)} style={{ width: "100%", background: slipOpen ? "#008542" : "#ffcc00", color: slipOpen ? "#fff" : "#000", border: "none", padding: "12px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "900" }}>
            <span>🎫 BET SLIP - {picked.match} - {picked.team} @ {picked.odd}</span>
            <span>{slipOpen ? "▼ HIDE" : "▲ CHECK SLIP"}</span>
          </button>
          {slipOpen && (
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: "900", color: "#008542" }}>BET SLIP - REAL {sport}</div>
              <div style={{ fontSize: 13, fontWeight: "bold", marginTop: 4 }}>{picked.match} - {picked.team} @ {picked.odd}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input value={stake} onChange={e => setStake(e.target.value)} type="number" style={{ flex: 1, padding: 10, borderRadius: 6, border: "2px solid #008542", fontWeight: "bold" }} />
                <div style={{ padding: 10, background: "#eee", borderRadius: 6, fontWeight: "bold" }}>To Win: GHS {(Number(stake || 0) * Number(picked.odd)).toFixed(2)}</div>
                <button onClick={place} style={{ padding: "10px 16px", background: "#008542", color: "#fff", border: "none", borderRadius: 6, fontWeight: "bold" }}>PLACE BET</button>
              </div>
              <button onClick={() => setSlipOpen(false)} style={{ width: "100%", marginTop: 8, padding: 8, background: "#eee", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>Hide Slip ▼</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}