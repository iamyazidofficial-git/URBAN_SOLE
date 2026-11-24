import React, { useState, useEffect } from 'react';
import './wallet.css';
import Navbar from '../../../partials/navbar/navbar';
import axiosInstance from '../../../utils/axiosInstance';
import UserFooter from '../../../partials/UserFooter/UserFooter'
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from '../../../partials/Loader/Loader';
import { loadRazorpayScript } from '../../../utils/loadRazorpay';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const getWallet = async () => {
    try {
      const response = await axiosInstance.get("/user/wallet/getWallet");
      if (response?.data?.success) {
        setBalance(response?.data?.balance);
      }

      const txResponse = await axiosInstance.get("/user/wallet/getTransactions");
      if (txResponse.data?.success) {
        // ഇവിടെ txResponse.data.result.transactions എന്ന് മാറ്റുക
        setTransactions(txResponse?.data?.result?.transactions || []);
      }
    } catch (error) {
      console.log(error);
      setTransactions([]); // എറർ വന്നാലും അപ്ലിക്കേഷൻ ക്രാഷ് ആവാതിരിക്കാൻ
    }
  };

  useEffect(() => {
    getWallet();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
    toast.error("Please Enter a Amount")
      return;
    }

    try {
      setLoading(true);

      const orderRes = await axiosInstance.post(
        "/user/wallet/createOrder", 
        { amount: Number(amount) }
      );

      const order = orderRes.data;

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        toast.error("Payment gateway failed to load. Please refresh.");
        return;
      }

      const razorpayKey =
        order.razorpayKeyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_TyBdnHhmwVXFOs";

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "URBAN SOLE",
        description: "Wallet Top-up",
        order_id: order.id,
        handler: async function (response) {
          toast.success("Payment Successfull")
          try {
            const verifyRes = await axiosInstance.post(
              "/user/wallet/verify-topup",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: amount
              }
            );

            if (verifyRes.data.success) {
              setAmount("");
              getWallet();
            }
          } catch (err) {
            console.error("Payment verification failed:", err);
          }
        },
        prefill: {
          name: "Yazid",
          email: "yazid@example.com"
        },
        theme: {
          color: "#000000"
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response){
          toast.error("Payment Failed: " + response.error.description);
      });

      rzp.open();
    } catch (error) {
      console.error("Topup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="us-wallet-page">
      {/* Navbar */}
      <Navbar />

      {loading&&<Loader/>}

      {/* Main Content Area */}
      <main className="us-main-content">
        {/* Page Header */}
        <header className="us-page-header">
          <h1 className="us-page-title">MY WALLET</h1>
          <p className="us-page-subtitle">Manage your balance, payment methods, and transaction history.</p>
        </header>

        <div className="us-wallet-grid">
          {/* Left Column: Balance & Topup Form */}
          <section className="us-balance-section">
            <div>
              <h2 className="us-balance-label">CURRENT BALANCE</h2>
              <div className="us-balance-amount">
                ₹ {balance.toFixed(2)}
              </div>
            </div>

            {/* Topup Form inside the card */}
            <form onSubmit={handleTopup} className="us-topup-form">
            <input
                type="number"
                placeholder="Enter Amount"
                value={amount}
                min="0"
                onKeyDown={(e) => {
                  // minus (-), plus (+), e (exponential), decimal (.) എന്നിവ ടൈപ്പ് ചെയ്യുന്നത് തടയാൻ
                  if (["e", "E", "+", "-", "."].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onInput={(e) => {
                  if (e.target.value.length > 5) {
                    e.target.value = e.target.value.slice(0, 5);
                  }
                  setAmount(e.target.value);
                }}
                className="us-amount-input"
              />
              <button
                type="submit"
                disabled={loading}
                className="us-add-fund-btn"
              >
                 ADD FUNDS
              </button>
            </form>
          </section>

          {/* Right Column: Transaction History */}
          <section className="us-activity-section">
            <div className="us-activity-section-header">
              <h2 className="us-activity-title">RECENT ACTIVITY</h2>
            </div>
            <div className="us-activity-table-container">
              <table className="us-activity-table">
                <thead>
                  <tr className="us-table-header-row">
                    <th className="us-th">DATE</th>
                    <th className="us-th">DESCRIPTION</th>
                    <th className="us-th">TYPE</th>
                    <th className="us-th" style={{ textAlign: 'right' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx._id} className="us-table-row">
<td className="us-td-date">
  {new Date(tx.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })}
</td>                        <td className="us-td-desc">
                          <div className="us-tx-main-text">{tx.description || tx.source}</div>
                          <div className="us-tx-sub-text">{tx.referenceId || "Wallet transaction"}</div>
                        </td>
                        <td className={`us-td-type ${tx.type === "CREDIT" ? "us-amount-credit" : "us-amount-debit"}`} style={{ fontWeight: '600' }}>
                          {tx.type}
                        </td>
                        <td className={`us-td-amount ${tx.type === "CREDIT" ? "us-amount-credit" : "us-amount-debit"}`}>
                          {tx.type === "CREDIT" ? "+" : "-"} ₹ {tx.amount}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="us-empty-row">
                        Transaction not available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

    <UserFooter/>
    </div>
  );
};

export default Wallet;