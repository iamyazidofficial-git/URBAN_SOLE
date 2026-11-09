import React, { useState } from 'react';
import './UserFilter.css';

const UserFilter = ({ isOpen, onClose, initialFilters, onApplyFilters }) => {
  if (!isOpen) return null;

  // Initialize filter state with current active filters or default empty values
  const [selectedCategories, setSelectedCategories] = useState(initialFilters?.categories || []);
  const [selectedPrice, setSelectedPrice] = useState(initialFilters?.price || '');
  const [selectedColor, setSelectedColor] = useState(initialFilters?.color || '');
  const [selectedBrands, setSelectedBrands] = useState(initialFilters?.brands || []);
  const [selectedSizes, setSelectedSizes] = useState(initialFilters?.sizes || []);

  // Checkbox handlers for array items (Categories & Brands)
  const handleToggleArrayItem = (item, currentArray, setArray) => {
    if (currentArray.includes(item)) {
      setArray(currentArray.filter((i) => i !== item));
    } else {
      setArray([...currentArray, item]);
    }
  };

  // Toggle Size handler
  const handleToggleSize = (size) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  // Clear All
  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedPrice('');
    setSelectedColor('');
    setSelectedBrands([]);
    setSelectedSizes([]);
  };

  // Apply Filters
  const handleApply = () => {
    onApplyFilters({
      categories: selectedCategories,
      price: selectedPrice,
      color: selectedColor,
      brands: selectedBrands,
      sizes: selectedSizes,
    });
    onClose();
  };

  const colorsList = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#ffffff', border: true },
    { name: 'Blue', hex: '#2563eb' },
    { name: 'Red', hex: '#dc2626' },
    { name: 'Green', hex: '#16a34a' },
    { name: 'Grey', hex: '#6b7280' },
    { name: 'Brown', hex: '#9a3412' },
    { name: 'Cream', hex: '#fef3c7', border: true },
  ];

  return (
    <div className="fm-overlay">
      <div className="fm-container">
        
        {/* Header */}
        <div className="fm-header">
          <h2 className="fm-title">FILTERS</h2>
          <button className="fm-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Filters Content Grid */}
        <div className="fm-content">
          
          {/* Category Section */}
          <div className="fm-section">
            <h3 className="fm-section-heading">CATEGORY</h3>
            <div className="fm-options-list">
              {['Casual', 'Sports', 'Formal', 'Sneakers', 'Running'].map((cat) => (
                <label className="fm-checkbox-label" key={cat}>
                  <input
                    type="checkbox"
                    className="fm-checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleToggleArrayItem(cat, selectedCategories, setSelectedCategories)}
                  /> 
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Price Section */}
          <div className="fm-section">
            <h3 className="fm-section-heading">PRICE</h3>
            <div className="fm-options-list">
              {[
                { label: 'All Prices', value: '' },
                { label: 'Under ₹7,000', value: '0-7000' },
                { label: '₹7,000 – ₹9,000', value: '7000-9000' },
                { label: '₹9,000 – ₹11,000', value: '9000-11000' },
                { label: '₹11,000+', value: '11000-10000000' },
              ].map((p) => (
                <label className="fm-radio-label" key={p.value}>
                  <input
                    type="radio"
                    name="price"
                    className="fm-radio"
                    checked={selectedPrice === p.value}
                    onChange={() => setSelectedPrice(p.value)}
                  /> 
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {/* Color Section */}
          <div className="fm-section">
            <h3 className="fm-section-heading">COLOR</h3>
            <div className="fm-color-grid">
              {colorsList.map((c) => (
                <span
                  key={c.name}
                  className={`fm-color-circle ${selectedColor === c.name ? 'active-color' : ''}`}
                  style={{
                    backgroundColor: c.hex,
                    border: c.border ? '1px solid #cfc4c5' : 'none',
                  }}
                  title={c.name}
                  onClick={() => setSelectedColor(selectedColor === c.name ? '' : c.name)}
                ></span>
              ))}
            </div>
          </div>

          {/* Brand Section */}
          <div className="fm-section">
            <h3 className="fm-section-heading">BRAND</h3>
            <div className="fm-options-list">
              {['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Skechers', 'Converse', 'Asics'].map((brand) => (
                <label className="fm-checkbox-label" key={brand}>
                  <input
                    type="checkbox"
                    className="fm-checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => handleToggleArrayItem(brand, selectedBrands, setSelectedBrands)}
                  /> 
                  {brand}
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="fm-footer">
          <button className="fm-clear-btn" onClick={handleClearAll}>CLEAR ALL</button>
          <button className="fm-apply-btn" onClick={handleApply}>APPLY FILTERS</button>
        </div>

      </div>
    </div>
  );
};

export default UserFilter;