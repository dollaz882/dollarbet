import { useState } from "react";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🔔", "⭐", "💎", "7️⃣"];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function cardValue(cards) {
  let total = 0; let aces = 0;
  cards.forEach(c => { if (c === "A") { total += 11; aces++; } else if (["K", "Q", "J"].includes(c)) total += 10; else total += Number(c); });
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}
function drawCard() {
  const deck = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  return deck[Math.floor(Math.random() * deck.length)];
}

export default function Casino({ balance, setBalance }) {
  const [game, setGame] = useState("slots");
  const [stake, setStake] = useState("10");
  const [message, setMessage] = useState("Welcome to DollarBet Casino! Good luck 🍀");

  // SLOTS
  const [reels, setReels] = useState(["🍒", "🍒", "🍒"]);
  const [spinning, setSpinning] = useState(false);

  // ROULETTE
  const [rouletteNum, setRouletteNum] = useState(null);
  const [rouletteBet, setRouletteBet] = useState("Red");
  const [rouletteSpinning, setRouletteSpinning] = useState(false);

  // BLACKJACK
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [bjPhase, setBjPhase] = useState("idle"); // idle | playing | done
  const [bjBet, setBjBet] = useState(0);

  // DICE
  const [dice, setDice] = useState([1, 1]);
  const [diceBet, setDiceBet] = useState("Over 7");

  const bet = (amount) => {
    const amt = Number(amount || stake);
    if (!amt || amt <= 0) { setMessage("Enter stake first!"); return 0; }
    if (amt > balance) { setMessage("❌ Not enough balance! Deposit MoMo."); return 0; }
    setBalance(balance - amt);
    return amt;
  };

  const spinSlots = () => {
    const amt = bet(); if (!amt) return;
    setSpinning(true); setMessage("Spinning... 🎰");
    let ticks = 0;
    const interval = setInterval(() => {
      setReels([SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]]);
      ticks++;
      if (ticks > 12) {
        clearInterval(interval);
        const final = [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]];
        setReels(final); setSpinning(false);
        let win = 0; let msg = "";
        if (final[0] === final[1] && final[1] === final[2]) {
          if (final[0] === "7️⃣") { win = amt * 50; msg = `🎉 JACKPOT! 777! You won GHS ${win}!`; }
          else if (final[0] === "💎") { win = amt * 20; msg = `💎 DIAMOND JACKPOT! You won GHS ${win}!`; }
          else if (final[0] === "⭐") { win = amt * 10; msg = `⭐ TRIPLE STAR! You won GHS ${win}!`; }
          else { win = amt * 5; msg = `🎉 TRIPLE ${final[0]}! You won GHS ${win}!`; }
        } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) { win = amt * 2; msg = `✅ Pair! You won GHS ${win}!`; }
        else { msg = `❌ No win. Try again!`; }
        if (win > 0) setBalance(prev => prev + win);
        setMessage(msg);
      }
    }, 80);
  };

  const spinRoulette = () => {
    const amt = bet(); if (!amt) return;
    setRouletteSpinning(true); setMessage("Roulette spinning... 🎡");
    let ticks = 0;
    const interval = setInterval(() => {
      setRouletteNum(Math.floor(Math.random() * 37)); ticks++;
      if (ticks > 15) {
        clearInterval(interval);
        const num = Math.floor(Math.random() * 37);
        setRouletteNum(num); setRouletteSpinning(false);
        const isRed = RED_NUMBERS.includes(num);
        const color = num === 0 ? "Green" : isRed ? "Red" : "Black";
        let win = 0; let won = false;
        if (rouletteBet === color) { win = amt * 2; won = true; }
        else if (rouletteBet === "Even" && num !== 0 && num % 2 === 0) { win = amt * 2; won = true; }
        else if (rouletteBet === "Odd" && num % 2 === 1) { win = amt * 2; won = true; }
        else if (rouletteBet === "1-18" && num >= 1 && num <= 18) { win = amt * 2; won = true; }
        else if (rouletteBet === "19-36" && num >= 19) { win = amt * 2; won = true; }
        else if (rouletteBet === `Number ${num}`) { win = amt * 36; won = true; }
        if (win > 0) setBalance(prev => prev + win);
        setMessage(won ? `🎉 Roulette: ${num} ${color}! You bet ${rouletteBet} - You won GHS ${win}!` : `❌ Roulette: ${num} ${color}. You bet ${rouletteBet} - Lost GHS ${amt}.`);
      }
    }, 80);
  };

  const startBlackjack = () => {
    const amt = bet(); if (!amt) return;
    setBjBet(amt);
    const p = [drawCard(), drawCard()];
    const d = [drawCard(), drawCard()];
    setPlayerCards(p); setDealerCards(d); setBjPhase("playing");
    const pv = cardValue(p);
    if (pv === 21) {
      const win = amt * 2.5;
      setBalance(prev => prev + win); setBjPhase("done"); setMessage(`🎉 BLACKJACK! 21! You won GHS ${win}!`);
    } else setMessage(`Blackjack: You have ${pv}. Hit or Stand?`);
  };
  const hit = () => {
    const p = [...playerCards, drawCard()];
    setPlayerCards(p);
    const pv = cardValue(p);
    if (pv > 21) { setBjPhase("done"); setMessage(`💥 BUST! You have ${pv}. Lost GHS ${bjBet}.`); }
    else if (pv === 21) { stand(p); }
    else setMessage(`You have ${pv}. Hit or Stand?`);
  };
  const stand = (pCards = playerCards) => {
    let d = [...dealerCards];
    while (cardValue(d) < 17) d.push(drawCard());
    setDealerCards(d);
    const pv = cardValue(pCards); const dv = cardValue(d);
    setBjPhase("done");
    if (dv > 21) { const win = bjBet * 2; setBalance(prev => prev + win); setMessage(`🎉 Dealer busts with ${dv}! You (${pv}) win GHS ${win}!`); }
    else if (pv > dv) { const win = bjBet * 2; setBalance(prev => prev + win); setMessage(`🎉 You win! ${pv} vs Dealer ${dv} - Won GHS ${win}!`); }
    else if (pv === dv) { setBalance(prev => prev + bjBet); setMessage(`🤝 Push! ${pv} vs ${dv} - Stake refunded.`); }
    else setMessage(`❌ Dealer wins! ${dv} vs You ${pv} - Lost GHS ${bjBet}.`);
  };

  const rollDice = () => {
    const amt = bet(); if (!amt) return;
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    setDice([d1, d2]);
    const total = d1 + d2;
    let win = 0; let won = false;
    if (diceBet === "Over 7" && total > 7) { win = amt * 2; won = true; }
    if (diceBet === "Under 7" && total < 7) { win = amt * 2; won = true; }
    if (diceBet === "Exactly 7" && total === 7) { win = amt * 5; won = true; }
    if (diceBet === "Double" && d1 === d2) { win = amt * 6; won = true; }
    if (win > 0) setBalance(prev => prev + win);
    setMessage(won ? `🎲 Dice: ${d1} + ${d2} = ${total} - ${diceBet} WON! You won GHS ${win}!` : `🎲 Dice: ${d1} + ${d2} = ${total} - ${diceBet} Lost GHS ${amt}.`);
  };

  return (
    <div style={{ padding: 12, color: "#fff", paddingBottom: 120 }}>
      <h2 style={{ textAlign: "center" }}>🎰 CASINO - REAL GAMES</h2>
      <p style={{ textAlign: "center", fontSize: 12, color: "#22c55e" }}>● Balance: GHS {balance.toFixed(2)} • Wins pay instantly • Real random</p>
      <div style={{ background: message.includes("won") || message.includes("🎉") ? "#14532d" : message.includes("Lost") || message.includes("❌") || message.includes("BUST") ? "#7f1d1d" : "#1e3a8a", padding: 12, borderRadius: 8, textAlign: "center", fontWeight: "bold", fontSize: 13, margin: "10px 0" }}>{message}</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[{ id: "slots", label: "🎰 Slots" }, { id: "roulette", label: "🎡 Roulette" }, { id: "blackjack", label: "🃏 Blackjack" }, { id: "dice", label: "🎲 Dice" }].map(g => (
          <button key={g.id} onClick={() => setGame(g.id)} style={{ flex: 1, padding: 10, background: game === g.id ? "#008542" : "#222", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>{g.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: "bold" }}>Stake:</span>
        {["10", "20", "50", "100"].map(v => <button key={v} onClick={() => setStake(v)} style={{ flex: 1, padding: 10, background: stake === v ? "#ffcc00" : "#333", color: stake === v ? "#000" : "#fff", border: "none", borderRadius: 6, fontWeight: "bold", cursor: "pointer" }}>GHS {v}</button>)}
        <input value={stake} onChange={e => setStake(e.target.value)} type="number" style={{ width: 70, padding: 10, borderRadius: 6, border: "2px solid #008542", fontWeight: "bold", textAlign: "center" }} />
      </div>

      {game === "slots" && (
        <div style={{ background: "#1c1c1c", padding: 16, borderRadius: 12, textAlign: "center" }}>
          <h3>🎰 SLOT MACHINE</h3>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "16px 0" }}>
            {reels.map((r, i) => <div key={i} style={{ width: 70, height: 70, background: "#fff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, border: "3px solid #ffcc00" }}>{r}</div>)}
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>Payouts: Pair x2 • Triple x5 • ⭐ x10 • 💎 x20 • 7️⃣7️⃣7️⃣ x50 JACKPOT</div>
          <button onClick={spinSlots} disabled={spinning} style={{ width: "100%", padding: 14, background: spinning ? "#555" : "#ffcc00", color: "#000", border: "none", borderRadius: 8, fontWeight: "900", fontSize: 16, cursor: "pointer" }}>{spinning ? "SPINNING..." : `SPIN - GHS ${stake} 🎰`}</button>
        </div>
      )}

      {game === "roulette" && (
        <div style={{ background: "#1c1c1c", padding: 16, borderRadius: 12, textAlign: "center" }}>
          <h3>🎡 ROULETTE</h3>
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: rouletteNum === null ? "#333" : rouletteNum === 0 ? "#22c55e" : RED_NUMBERS.includes(rouletteNum) ? "#ef4444" : "#111", border: "4px solid #ffcc00", margin: "16px auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: "900" }}>{rouletteNum === null ? "?" : rouletteNum}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
            {["Red", "Black", "Even", "Odd", "1-18", "19-36"].map(b => <button key={b} onClick={() => setRouletteBet(b)} style={{ padding: "8px 12px", background: rouletteBet === b ? "#008542" : "#333", color: "#fff", border: rouletteBet === b ? "2px solid #ffcc00" : "1px solid #555", borderRadius: 20, fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>{b} {rouletteBet === b ? "✓" : ""}</button>)}
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>Red / Black / Even / Odd pays x2 • Win = Double your stake</div>
          <button onClick={spinRoulette} disabled={rouletteSpinning} style={{ width: "100%", padding: 14, background: rouletteSpinning ? "#555" : "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: "900", fontSize: 16, cursor: "pointer" }}>{rouletteSpinning ? "SPINNING..." : `SPIN ROULETTE - GHS ${stake} on ${rouletteBet}`}</button>
        </div>
      )}

      {game === "blackjack" && (
        <div style={{ background: "#1c1c1c", padding: 16, borderRadius: 12, textAlign: "center" }}>
          <h3>🃏 BLACKJACK - Get 21</h3>
          <div style={{ margin: "12px 0" }}>
            <div style={{ fontSize: 12, color: "#aaa" }}>DEALER {dealerCards.length > 0 ? `(${cardValue(dealerCards)})` : ""}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 6 }}>{dealerCards.map((c, i) => <div key={i} style={{ width: 50, height: 70, background: "#fff", color: "#000", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: 18, border: "2px solid #333" }}>{c}</div>)}{dealerCards.length === 0 && <div style={{ color: "#666" }}>No cards yet</div>}</div>
          </div>
          <div style={{ margin: "12px 0" }}>
            <div style={{ fontSize: 12, color: "#aaa" }}>YOU {playerCards.length > 0 ? `(${cardValue(playerCards)})` : ""}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 6 }}>{playerCards.map((c, i) => <div key={i} style={{ width: 50, height: 70, background: "#ffcc00", color: "#000", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: 18, border: "2px solid #fff" }}>{c}</div>)}{playerCards.length === 0 && <div style={{ color: "#666" }}>No cards yet</div>}</div>
          </div>
          {bjPhase === "idle" || bjPhase === "done" ? <button onClick={startBlackjack} style={{ width: "100%", padding: 14, background: "#008542", color: "#fff", border: "none", borderRadius: 8, fontWeight: "900", fontSize: 16, cursor: "pointer" }}>{bjPhase === "done" ? "PLAY AGAIN" : `DEAL - GHS ${stake} 🃏`}</button> : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={hit} style={{ flex: 1, padding: 14, background: "#ffcc00", color: "#000", border: "none", borderRadius: 8, fontWeight: "900", cursor: "pointer" }}>HIT +1 Card</button>
              <button onClick={() => stand()} style={{ flex: 1, padding: 14, background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: "900", cursor: "pointer" }}>STAND ✋</button>
            </div>
          )}
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 10 }}>Blackjack pays x2.5 • Win pays x2 • Dealer must hit until 17</div>
        </div>
      )}

      {game === "dice" && (
        <div style={{ background: "#1c1c1c", padding: 16, borderRadius: 12, textAlign: "center" }}>
          <h3>🎲 DICE - Over / Under 7</h3>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "16px 0" }}>
            {dice.map((d, i) => <div key={i} style={{ width: 70, height: 70, background: "#fff", color: "#000", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: "900" }}>{d}</div>)}
          </div>
          <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 12 }}>Total: {dice[0] + dice[1]}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
            {["Over 7", "Under 7", "Exactly 7", "Double"].map(b => <button key={b} onClick={() => setDiceBet(b)} style={{ padding: "8px 12px", background: diceBet === b ? "#008542" : "#333", color: "#fff", border: diceBet === b ? "2px solid #ffcc00" : "1px solid #555", borderRadius: 20, fontWeight: "bold", cursor: "pointer", fontSize: 12 }}>{b} {diceBet === b ? "✓" : ""}</button>)}
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>Over / Under pays x2 • Exactly 7 pays x5 • Double pays x6</div>
          <button onClick={rollDice} style={{ width: "100%", padding: 14, background: "#008542", color: "#fff", border: "none", borderRadius: 8, fontWeight: "900", fontSize: 16, cursor: "pointer" }}>ROLL DICE - GHS {stake} 🎲</button>
        </div>
      )}
    </div>
  );
}