import { useState } from "react";
export default function Wallet({ balance, setBalance }) {
  const [show, setShow] = useState(false);
  const [amount, setAmount] = useState("");
  const [momo, setMomo] = useState("");
  const deposit = () => {
    if (!amount || !momo) return alert("Enter amount and MoMo number");
    const newBal = balance + parseFloat(amount);
    setBalance(newBal);
    localStorage.setItem("233bet_balance", newBal.toString());
    setShow(false);
    alert(`✅ Deposited GHS ${amount} via MoMo ${momo}! New balance GHS ${newBal}`);
    setAmount(""); setMomo("");
  };
  return (
    <div style={{maxWidth: "600px", margin: "0 auto", padding: "16px", paddingBottom: "80px"}}>
      <div style={{background: "linear-gradient(135deg, #00b050, #008a3e)", padding: "20px", borderRadius: "12px", color: "white"}}>
        <div style={{fontSize: "12px", opacity: 0.8}}>Available Balance</div>
        <div style={{fontSize: "28px", fontWeight: "bold", margin: "4px 0"}}>GHS {balance.toFixed(2)}</div>
        <button onClick={() => setShow(true)} style={{background: "#ffcc00", color: "#000", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", marginTop: "10px", width: "100%"}}>+ Deposit via MTN MoMo</button>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "16px"}}>
        <div style={{background: "#181818", padding: "14px", borderRadius: "8px", textAlign: "center"}}><div style={{fontSize: "20px"}}>📱</div><div style={{fontSize: "11px", fontWeight: "bold", marginTop: "4px"}}>MTN MoMo</div><div style={{fontSize: "9px", color: "#888"}}>Instant</div></div>
        <div style={{background: "#181818", padding: "14px", borderRadius: "8px", textAlign: "center"}}><div style={{fontSize: "20px"}}>💳</div><div style={{fontSize: "11px", fontWeight: "bold", marginTop: "4px"}}>Vodafone Cash</div><div style={{fontSize: "9px", color: "#888"}}>Instant</div></div>
      </div>

      {show && (
        <div style={{position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px"}}>
          <div style={{background: "#1e1e1e", padding: "20px", borderRadius: "12px", width: "100%", maxWidth: "350px"}}>
            <div style={{fontWeight: "bold", marginBottom: "12px"}}>Deposit via MoMo</div>
            <input value={momo} onChange={e=>setMomo(e.target.value)} placeholder="MoMo Number e.g. 024XXXXXXX" style={{width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #333", background: "#2a2a2a", color: "white", marginBottom: "10px"}} />
            <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="Amount GHS" style={{width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #333", background: "#2a2a2a", color: "white", marginBottom: "12px"}} />
            <div style={{display: "flex", gap: "8px"}}>
              <button onClick={() => setShow(false)} style={{flex: 1, background: "#333", color: "white", border: "none", padding: "12px", borderRadius: "6px"}}>Cancel</button>
              <button onClick={deposit} style={{flex: 1, background: "#ffcc00", color: "#000", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold"}}>Deposit</button>
            </div>
            <div style={{fontSize: "9px", color: "#666", marginTop: "10px", textAlign: "center"}}>Demo: No real money charged. For real MoMo, integrate Paystack / Hubtel API</div>
          </div>
        </div>
      )}
    </div>
  );
}