import React from "react";

interface CrystalOrbIconProps {
  size?: number;
  className?: string;
}

/**
 * 🔑 CrystalKeyIcon / CrystalOrbIcon
 * A distinct, hyper-realistic 3D crystal key icon (Rebranded from Crystal Orb)
 * Features:
 * - Radiant astral crystal ring bow with starlight core
 * - Luminous prismatic crystal shaft with cyan/purple energy reflection
 * - Arcane faceted teeth for unlocking dimensional gates
 * - Specular crystal glints and celestial aura
 */
export function CrystalKeyIcon({ size = 24, className = "" }: CrystalOrbIconProps) {
  const gradId = React.useId().replace(/:/g, "_");
  const keyGradId = `key_grad_${gradId}`;
  const coreGradId = `key_core_${gradId}`;
  const ringGradId = `key_ring_${gradId}`;
  const shaftGradId = `key_shaft_${gradId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        {/* Crystal Ring & Accent Gradient */}
        <linearGradient id={keyGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#67e8f9" stopOpacity="0.9" />
          <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.85" />
        </linearGradient>

        {/* Core Singularity Radial Gradient */}
        <radialGradient id={coreGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#67e8f9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>

        {/* Orbit Halo Gradient */}
        <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#c084fc" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
        </linearGradient>

        {/* Crystal Shaft Gradient */}
        <linearGradient id={shaftGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#67e8f9" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* 1. Ambient Background Halo */}
      <circle cx="12" cy="7" r="5.8" fill="#38bdf8" fillOpacity="0.16" className="blur-[0.8px]" />

      {/* 2. Celestial Orbit Ring around the Key Head */}
      <ellipse
        cx="12"
        cy="7"
        rx="6.5"
        ry="2.8"
        stroke={`url(#${ringGradId})`}
        strokeWidth="0.8"
        strokeDasharray="1.5 1.5"
        strokeLinecap="round"
        className="opacity-75"
        transform="rotate(-15 12 7)"
      />

      {/* 3. Key Bow (Upper Crystal Ring Head) */}
      {/* Outer Crystal Ring */}
      <circle
        cx="12"
        cy="7"
        r="3.8"
        stroke={`url(#${keyGradId})`}
        strokeWidth="1.3"
      />
      {/* Inner Scrying Cavity */}
      <circle cx="12" cy="7" r="2.8" fill="#050716" />
      <circle cx="12" cy="7" r="2.5" fill={`url(#${coreGradId})`} />

      {/* Center 4-Point Starlight Singularity */}
      <path
        d="M 12 4.8 Q 12 7 14.2 7 Q 12 7 12 9.2 Q 12 7 9.8 7 Q 12 7 12 4.8 Z"
        fill="#ffffff"
        opacity="0.95"
      />
      <circle cx="12" cy="7" r="0.6" fill="#ffffff" />

      {/* Top Spire Crown Gem */}
      <path d="M 12 2.2 L 12.8 3.2 L 12 3.8 L 11.2 3.2 Z" fill="#ffffff" opacity="0.9" />
      <circle cx="12" cy="2.2" r="0.4" fill="#67e8f9" />

      {/* 4. Crossguard / Wing Collar (Connecting Head and Stem) */}
      <path
        d="M 8.8 10.8 C 10.2 10.4 11.2 10.2 12 10.2 C 12.8 10.2 13.8 10.4 15.2 10.8 C 13.8 11.3 12.8 11.5 12 11.5 C 11.2 11.5 10.2 11.3 8.8 10.8 Z"
        fill={`url(#${keyGradId})`}
      />
      <circle cx="12" cy="10.8" r="0.7" fill="#ffffff" />

      {/* 5. Crystal Shaft (Vertical Stem) */}
      <rect
        x="11.2"
        y="11.2"
        width="1.6"
        height="9.5"
        rx="0.8"
        fill={`url(#${shaftGradId})`}
        stroke="#ffffff"
        strokeWidth="0.4"
        strokeOpacity="0.8"
      />
      {/* Central Light Ray Conduit */}
      <line x1="12" y1="11.6" x2="12" y2="20.4" stroke="#ffffff" strokeWidth="0.5" strokeLinecap="round" />

      {/* 6. Middle Shaft Runic Bead / Node */}
      <ellipse cx="12" cy="15.2" rx="1.3" ry="0.6" fill="#ffffff" opacity="0.85" />

      {/* 7. Key Bit (Faceted Crystal Teeth on Right Side) */}
      <path
        d="M 12.8 16.5 L 14.8 16.5 L 15.3 17.0 L 15.3 17.8 L 14.6 18.2 L 12.8 18.2 Z"
        fill={`url(#${keyGradId})`}
        stroke="#ffffff"
        strokeWidth="0.3"
      />
      <path
        d="M 12.8 18.8 L 15.8 18.8 L 16.4 19.4 L 16.4 20.2 L 15.6 20.8 L 14.2 20.8 L 13.8 20.2 L 12.8 20.2 Z"
        fill={`url(#${keyGradId})`}
        stroke="#ffffff"
        strokeWidth="0.3"
      />

      {/* 8. Shaft Bottom Spire Tip */}
      <path d="M 11.2 20.7 L 12 22.4 L 12.8 20.7 Z" fill={`url(#${shaftGradId})`} stroke="#ffffff" strokeWidth="0.3" />
      <circle cx="12" cy="22.4" r="0.5" fill="#ffffff" />

      {/* 9. Tiny Starlet Glint on Head */}
      <circle cx="10.2" cy="5.8" r="0.5" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

// Backward compatibility export
export const CrystalOrbIcon = CrystalKeyIcon;
