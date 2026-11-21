import React, { useState, useEffect } from "react";
import "./Referrals.css";
import Navbar from "../../../partials/navbar/navbar";
import UserFooter from "../../../partials/UserFooter/UserFooter";
import axiosInstance from "../../../utils/axiosInstance";

const Referrals = () => {
  const [referralData, setReferralData] = useState({
    referralCode: "",
    successfulReferrals: 0,
    totalEarned: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralDetails = async () => {
      try {
        const response = await axiosInstance.get("/user/referral/getDetails");
        console.log(response)
        if (response?.data?.success) {
          setReferralData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to load referral details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralDetails();
  }, []);

  const handleCopyCode = () => {
    if (!referralData.referralCode) return;
    navigator.clipboard.writeText(referralData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mr-page-wrapper">
      <Navbar />

      <main className="mr-main-content">
        <div className="mr-container">
          {/* Header Section */}
          <header className="mr-header">
            <h1 className="mr-title">MY REFERRALS</h1>
            <p className="mr-subtitle">
              Share the archive with your network. Earn rewards for every successful referral.
            </p>
          </header>

          {/* Stats Section */}
          <div className="mr-stats-grid">
            <div className="mr-card">
              <span className="mr-card-label">Total Earned</span>
              <div className="mr-card-value">
                ₹{loading ? "0" : referralData.totalEarned.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="mr-card">
              <span className="mr-card-label">Successful Referrals</span>
              <div className="mr-card-value">
                {loading ? "0" : referralData.successfulReferrals}
              </div>
            </div>
          </div>

          {/* Code Box Section */}
          <div className="mr-code-card">
            <h2 className="mr-code-title">Your Unique Code</h2>
            <p className="mr-code-subtitle">
              Share this link with friends to start earning.
            </p>

            <div className="mr-input-wrapper">
              <input
                type="text"
                readOnly
                value={loading ? "Loading..." : referralData.referralCode || "N/A"}
                className="mr-code-input"
              />
              <button
                type="button"
                className="mr-copy-btn"
                onClick={handleCopyCode}
                aria-label="Copy Referral Code"
              >
                {copied ? (
                  <span className="mr-copied-text">Copied!</span>
                ) : (
                  <svg
                    className="mr-copy-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <UserFooter />
    </div>
  );
};

export default Referrals;