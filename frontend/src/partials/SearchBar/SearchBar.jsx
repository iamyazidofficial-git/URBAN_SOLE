import React from 'react';
import './SearchBar.css';

export default function SearchBar({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  clearable = true,
  className = ""
}) {
  return (
    <div className={`search-bar-container ${className}`}>
      <div className="search-input-wrapper">
        {/* Left Search Icon Only */}
        <svg 
          className="search-icon" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="search-input"
        />

        {/* Clear Button (Appears only when text is typed and clearable is true) */}
        {clearable && value && (
          <button 
            type="button" 
            className="clear-button" 
            onClick={onClear}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}