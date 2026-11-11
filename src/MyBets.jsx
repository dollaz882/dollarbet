export default function MyBets() {
  const allBets = JSON.parse(localStorage.getItem("233bet_bets") || "[]");

  if (allBets.length === 0) {
    return (
      <div style={{padding: "40px", textAlign: "center", color: "#888"}}>
        <div style={{fontSize: "50px"}}>🎫</div>
        <div>No bets yet</div>
        <div style={{fontSize: "12px", marginTop: "5px"}}>Go to LIVE and place a bet!</div>
      </div>
    );
  }

  return (
    <div style={{padding: "10px"}}>
      <h3 style={{margin: "10px 0"}}>My Bets ({allBets.length})</h3>
      {[...allBets].reverse().map((b, i) => (
        <div key={i} style={{background: "#1e1e1e", border: "1px solid #333", borderRadius: "8px", padding: "12px", marginBottom: "10px"}}>
          <div style={{display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888"}}>
            <span>{new Date(b.timestamp).toLocaleString()}</span>
            <span style={{background: "#ffcc00", color: "#000", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold"}}>OPEN</span>
          </div>
          <div style={{marginTop: "8px"}}>
            {b.bets.map((s, j) => (
              <div key={j} style={{display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0", borderBottom: "1px solid #222"}}>
                <span>{s.teams} <b style={{color: "#00b050"}}>{s.type}</b></span>
                <span>{s.odd}</span>
              </div>
            ))}
          </div>
          <div style={{display: "flex", justifyContent: "space-between", marginTop: "10px", fontWeight: "bold"}}>
            <span>Stake: GHS {b.stake}</span>
            <span style={{color: "#ffcc00"}}>{b.totalOdds} Odds</span>
            <span style={{color: "#00b050"}}>Win: GHS {b.potentialWin}</span>
          </div>
        </div>
      ))}
      <button onClick={() => { if(confirm("Clear all bets?")) { localStorage.removeItem("233bet_bets"); window.location.reload(); } }} 
        style={{width: "100%", marginTop: "20px", background: "#333", color: "white", border: "none", padding: "10px", borderRadius: "6px"}}>
        Clear History
      </button>
    </div>
  );
}