import React from "react";
import "./Loader.css";

const Loader = ({ text = "Please wait..." }) => {
  return (
    <div className="loader-overlay">
      <div className="loader-box">
        <div className="loader-spinner"></div>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default Loader;
