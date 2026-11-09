import React from 'react';
import './UserFooter.css';

const UserFooter = () => {
  return (
    <footer className="us-footer">
      <div className="us-footer-container">
        
        {/* Left Column: Brand & Description */}
        <div className="us-footer-brand-col">
          <h2 className="us-footer-logo">URBAN SOLE</h2>
          <p className="us-footer-desc">
            Redefining urban movement through architectural design, tactile minimalism, and performance engineering for the modern metropolitan cadence.
          </p>
        </div>

        {/* Explore Column */}
        <div className="us-footer-col">
          <h4 className="us-footer-heading">EXPLORE</h4>
          <ul className="us-footer-links-list">
            <li><a href="#">Trending now</a></li>
            <li><a href="#">Men</a></li>
            <li><a href="#">Women</a></li>
          </ul>
        </div>

        {/* Support Column */}
        <div className="us-footer-col">
          <h4 className="us-footer-heading">SUPPORT</h4>
          <ul className="us-footer-links-list">
            <li><a href="#">About</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>

        {/* Follow Us Column */}
        <div className="us-footer-col">
          <h4 className="us-footer-heading">FOLLOW US</h4>
          <ul className="us-footer-links-list">
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Facebook</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Sub-footer / Copyright Row */}
      <div className="us-footer-bottom">
        <div className="us-footer-bottom-container">
          <p className="us-footer-copy">© 2024 URBAN SOLE. ALL RIGHTS RESERVED.</p>
          <div className="us-footer-legal">
            <a href="#">PRIVACY POLICY</a>
            <a href="#">TERMS OF SERVICE</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default UserFooter;