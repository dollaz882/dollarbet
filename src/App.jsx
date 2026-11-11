import { useState } from "react";
import RealMatches from "./RealMatches";
import Aviator from "./Aviator";
import Casino from "./Casino";
import OtherSports from "./OtherSports";
import Wallet from "./Wallet";
import MyBets from "./MyBets";

export default function App() {
  const [balance, setBalance] = useState(() => parseFloat(localStorage.getItem("dollarbet-balance") || "90"));
  const [tab, setTab] = useState("football");
  const sports = [
    { id: "football", icon: "⚽", label: "Football" },
    { id: "aviator", icon: "✈️", label: "Aviator" },
    { id: "casino", icon: "🎰", label: "Casino" },
    { id: "NBA", icon: "🏀", label: "NBA" },
    { id: "NFL", icon: "🏈", label: "NFL" },
    { id: "Hockey", icon: "🏒", label: "Hockey" },
    { id: "Rugby", icon: "🏉", label: "Rugby" },
    { id: "Volleyball", icon: "🏐", label: "Volleyball" },
    { id: "Handball", icon: "🤾", label: "Handball" },
    { id: "MMA", icon: "🥊", label: "MMA" },
    { id: "Formula-1", icon: "🏎️", label: "Formula 1" },
    { id: "Baseball", icon: "⚾", label: "Baseball" },
    { id: "AFL", icon: "🏉", label: "AFL" },
    { id: "Basketball", icon: "🏀", label: "Basketball" },
    { id: "Tennis", icon: "🎾", label: "Tennis" },
  ];
  return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 720, background: "#000000", minHeight: "100vh", color: "white", paddingBottom: 70, position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.8)", borderLeft: "1px solid #222", borderRight: "1px solid #222" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 12px", background: "#111", position: "sticky", top: 0, zIndex: 40, whiteSpace: "nowrap" }}>
          {sports.map((s) => (
            <button key={s.id} onClick={() => setTab(s.id)} style={{ padding: "8px 14px", borderRadius: 20, border: "none", background: tab === s.id ? "#008542" : "#222", color: tab === s.id ? "#fff" : "#ccc", fontWeight: "bold", fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
              {s.icon} {s.label}
            </button>
          ))}
          <div style={{ marginLeft: "auto", background: "#ffcc00", color: "#000", padding: "8px 12px", borderRadius: 20, fontWeight: "900", fontSize: 13, flexShrink: 0 }}>GHS {balance.toFixed(2)}</div>
        </div>
        {tab === "football" && <RealMatches balance={balance} setBalance={setBalance} />}
        {tab === "aviator" && <Aviator balance={balance} setBalance={setBalance} />}
        {tab === "casino" && <Casino balance={balance} setBalance={setBalance} />}
        {tab === "NBA" && <OtherSports sport="NBA" balance={balance} setBalance={setBalance} />}
        {tab === "NFL" && <OtherSports sport="NFL" balance={balance} setBalance={setBalance} />}
        {tab === "Hockey" && <OtherSports sport="Hockey" balance={balance} setBalance={setBalance} />}
        {tab === "Rugby" && <OtherSports sport="Rugby" balance={balance} setBalance={setBalance} />}
        {tab === "Volleyball" && <OtherSports sport="Volleyball" balance={balance} setBalance={setBalance} />}
        {tab === "Handball" && <OtherSports sport="Handball" balance={balance} setBalance={setBalance} />}
        {tab === "MMA" && <OtherSports sport="MMA" balance={balance} setBalance={setBalance} />}
        {tab === "Formula-1" && <OtherSports sport="Formula-1" balance={balance} setBalance={setBalance} />}
        {tab === "Baseball" && <OtherSports sport="Baseball" balance={balance} setBalance={setBalance} />}
        {tab === "AFL" && <OtherSports sport="AFL" balance={balance} setBalance={setBalance} />}
        {tab === "Basketball" && <OtherSports sport="Basketball" balance={balance} setBalance={setBalance} />}
        {tab === "Tennis" && <OtherSports sport="Tennis" balance={balance} setBalance={setBalance} />}
        {tab === "wallet" && <Wallet balance={balance} setBalance={setBalance} />}
        {tab === "bets" && <MyBets balance={balance} setBalance={setBalance} />}
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 720, background: "#111111", borderTop: "1px solid #222", display: "flex", zIndex: 50, height: 62, borderLeft: "1px solid #222", borderRight: "1px solid #222" }}>
          {[
            { id: "football", icon: "⚽", label: "Sports" },
            { id: "aviator", icon: "✈️", label: "Aviator" },
            { id: "casino", icon: "🎰", label: "Casino" },
            { id: "wallet", icon: "💰", label: "Wallet" },
            { id: "bets", icon: "🎫", label: "My Bets" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "transparent", border: "none", color: tab === t.id ? "#ffcc00" : "white", padding: "10px 0", cursor: "pointer" }}>
              <div style={{ fontSize: "18px" }}>{t.icon}</div>
              <div style={{ fontSize: "10px" }}>{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}