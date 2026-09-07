import React from "react";

export interface OrbShapeIconProps {
  size?: number;
  className?: string;
}

/**
 * 🔮 OrbShapeIcon (오브 본체 구체 형상)
 * - 인위적인 궤도 링(Saturn Orbit Ring)을 완전히 배제한 정통 크리스탈 구체(Orb Sphere) 본연의 형상
 * - 3D 구체 라디얼 그라디언트 및 입체 렌즈 굴절감
 * - 상단 곡면 반사광(Glass Glare) 및 스펙큘러 하이라이트 글린트
 * - 중심부 네온 시안/마젠타 성운 코어 및 하단 림 앰비언트 라이트
 */
export function OrbShapeIcon({ size = 24, className = "" }: OrbShapeIconProps) {
  const gradId = React.useId().replace(/:/g, "_");
  const sphereGradId = `orb_shape_sphere_${gradId}`;
  const coreGradId = `orb_shape_core_${gradId}`;

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
        {/* 3D Glass Crystal Orb Sphere Radial Gradient */}
        <radialGradient
          id={sphereGradId}
          cx="35%"
          cy="30%"
          r="70%"
          fx="32%"
          fy="26%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#a5f3fc" stopOpacity="0.85" />
          <stop offset="52%" stopColor="#38bdf8" stopOpacity="0.72" />
          <stop offset="78%" stopColor="#818cf8" stopOpacity="0.55" />
          <stop offset="92%" stopColor="#312e81" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#09090b" stopOpacity="0.92" />
        </radialGradient>

        {/* Glowing Inner Core Singularity Gradient */}
        <radialGradient id={coreGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="45%" stopColor="#67e8f9" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer Soft Ambient Crystal Aura */}
      <circle
        cx="12"
        cy="12"
        r="9.8"
        fill="#38bdf8"
        fillOpacity="0.25"
        className="blur-[1px]"
      />

      {/* 🔮 Pure 3D Glass Crystal Orb Main Sphere (오브 본체 구체) */}
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={`url(#${sphereGradId})`}
        stroke="#67e8f9"
        strokeWidth="1.2"
        strokeOpacity="0.9"
      />

      {/* Glowing Inner Nebula Core */}
      <circle
        cx="12"
        cy="12"
        r="3.8"
        fill={`url(#${coreGradId})`}
        className="animate-pulse"
      />

      {/* Top Curved Specular Glass Glare (크리스탈 렌즈 상단 곡면 반사광) */}
      <path
        d="M7.8 6.8 C9.6 5.2 14.4 5.2 16.2 6.8"
        stroke="#ffffff"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.95"
      />

      {/* Specular Star Sparkle Glint */}
      <circle cx="8.8" cy="8.6" r="0.9" fill="#ffffff" fillOpacity="0.95" />

      {/* Bottom Rim Ambient Light Reflection */}
      <path
        d="M9 17.2 C10.8 18.2 13.2 18.2 15 17.2"
        stroke="#38bdf8"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
    </svg>
  );
}
