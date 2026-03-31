import React from "react";

const Logo = ({ size = "md", className = "" }) => {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  return (
    <svg
      viewBox="0 0 200 200"
      className={`${sizeMap[size] || sizeMap.md} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="100" fill="#E06666" />

      {/* Left profile face */}
      <g transform="translate(55, 100)">
        {/* Head */}
        <ellipse cx="0" cy="0" rx="20" ry="28" fill="white" />
        {/* Ear */}
        <circle cx="22" cy="-8" r="6" fill="white" />
        {/* Chin indent */}
        <path d="M -8 20 Q 0 25 8 20" fill="#E06666" />
      </g>

      {/* Right stethoscope */}
      <g transform="translate(120, 100)">
        {/* Stethoscope earpiece left */}
        <circle cx="-8" cy="-20" r="5" fill="white" />
        {/* Stethoscope earpiece right */}
        <circle cx="8" cy="-20" r="5" fill="white" />
        {/* Stethoscope tubing */}
        <path
          d="M -8 -20 Q -15 -10 -18 5 Q -20 15 -10 20"
          stroke="white"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 8 -20 Q 15 -10 18 5 Q 20 15 10 20"
          stroke="white"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Stethoscope diaphragm */}
        <circle cx="0" cy="22" r="8" fill="white" />
      </g>

      {/* Center accent dot */}
      <circle cx="100" cy="110" r="4" fill="#E06666" />
    </svg>
  );
};

export default Logo;
