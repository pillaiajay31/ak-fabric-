import React from "react";

interface AKFabricLogoProps {
  className?: string;
  size?: number;
}

export function AKFabricLogo({ className = "h-16 w-16", size = 64 }: AKFabricLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AK Fabric Logo"
    >
      {/* Outer subtle glow/frame */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="20"
        fill="#1a1921"
        stroke="#2e2d3a"
        strokeWidth="2"
      />

      {/* --- Left: Yarn Spool / Bobbin --- */}
      <g transform="translate(6, 4)">
        {/* Top Rim of Spool */}
        <ellipse
          cx="28"
          cy="22"
          rx="16"
          ry="6"
          fill="#32313f"
          stroke="#f3f4f6"
          strokeWidth="2.5"
        />
        {/* Core Hole in Top Rim */}
        <ellipse
          cx="28"
          cy="22"
          rx="6"
          ry="2.5"
          fill="#16151c"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />

        {/* Spool Body (Wrapped Yarn) */}
        <path
          d="M 12 22 L 13 68 C 13 74 43 74 43 68 L 44 22 Z"
          fill="#252430"
          stroke="#f3f4f6"
          strokeWidth="2.5"
        />

        {/* Wound Yarn Thread Texture Lines */}
        <path d="M 12.5 28 C 16 32 40 32 43.5 28" stroke="#ffffff" strokeWidth="1.75" fill="none" />
        <path d="M 13 36 C 17 40 39 40 43 36" stroke="#e5e7eb" strokeWidth="1.75" fill="none" />
        <path d="M 13 44 C 17 48 39 48 43 44" stroke="#ffffff" strokeWidth="1.75" fill="none" />
        <path d="M 13 52 C 17 56 39 56 43 52" stroke="#e5e7eb" strokeWidth="1.75" fill="none" />
        <path d="M 13 60 C 17 64 39 64 43 60" stroke="#ffffff" strokeWidth="1.75" fill="none" />

        {/* Diagonal thread winding accents */}
        <path d="M 15 26 L 41 42" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 15 38 L 41 54" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 15 50 L 41 66" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />

        {/* Bottom Flange Rim */}
        <ellipse
          cx="28"
          cy="68"
          rx="17"
          ry="6"
          fill="#2a2936"
          stroke="#f3f4f6"
          strokeWidth="2.5"
        />
        <ellipse
          cx="28"
          cy="71"
          rx="15"
          ry="4"
          fill="#1f1e28"
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
      </g>

      {/* --- Right: Diagonal Fabric Knit & Weave Cross-Hatch --- */}
      <g transform="translate(6, 4)">
        {/* Diagonal Ribs 1 (Top-Left to Bottom-Right) */}
        <path
          d="M 52 24 L 84 56"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 60 20 L 88 48"
          stroke="#e5e7eb"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 48 36 L 80 68"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 56 48 L 84 76"
          stroke="#e5e7eb"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Diagonal Ribs 2 (Top-Right to Bottom-Left) - Interlocking Weft */}
        <path
          d="M 84 24 L 52 56"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 88 36 L 56 68"
          stroke="#e5e7eb"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 80 20 L 48 52"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 84 48 L 60 72"
          stroke="#e5e7eb"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

