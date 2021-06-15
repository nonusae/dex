import React, { useState } from 'react';

function DropDown({ onSelect, activeItem, items }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const selectItem = (e, item) => {
    e.preventDefault();
    setDropdownVisible(!dropdownVisible);
    onSelect(item);
  };

  return (
    <div className="dropdown ml-3">
      <button
        className="btn btn-secondary dropdown-toggle"
        type="button"
        onClick={() => setDropdownVisible(!dropdownVisible)}
      >
        {activeItem.label}
      </button>
      <div className={`dropdown-menu ${dropDownVisible ? 'visible' : ''}`}>
        {items &&
          items.map((item, index) => (
            <a
              className={`dropdown-item ${
                item.value === activeItem.value ? 'active' : null
              }`}
              href="#"
              key={index}
              onClick={(e) => selectItem(e, item.value)}
            >
              {item.label}
            </a>
          ))}
      </div>
    </div>
  );
}

export default DropDown;