import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// SVG designed specifically for iOS Safari Apple Touch Icon & PWA Maskable Icon:
// Fully opaque dark space background (#020206 -> #0b0d22 -> #131635) across the full 512x512 canvas.
// The glorious "Crystal Key" sits majestically in the center within Apple's 80% safe zone (safe area 410x410).
const keySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Background Canvas Gradient (100% Opaque for iOS Safari) -->
    <radialGradient id="keyBg" cx="50%" cy="42%" r="78%">
      <stop offset="0%" stop-color="#14183e" />
      <stop offset="45%" stop-color="#080918" />
      <stop offset="100%" stop-color="#020206" />
    </radialGradient>

    <!-- Glow & Lighting Filters -->
    <filter id="cyanGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="purpleGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="24" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="starGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="keyGlint" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <!-- Crystal Key Metallic & Prismatic Gradients -->
    <linearGradient id="goldCyanBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="20%" stop-color="#a5f3fc" />
      <stop offset="45%" stop-color="#38bdf8" />
      <stop offset="75%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>

    <linearGradient id="crystalShaft" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="18%" stop-color="#67e8f9" stop-opacity="0.9" />
      <stop offset="48%" stop-color="#0284c7" stop-opacity="0.85" />
      <stop offset="80%" stop-color="#4338ca" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0.98" />
    </linearGradient>

    <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="30%" stop-color="#38bdf8" />
      <stop offset="70%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>

    <linearGradient id="crossguardGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
      <stop offset="25%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#c084fc" stop-opacity="0.9" />
      <stop offset="75%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.8" />
    </linearGradient>

    <!-- Key Head Core Singularity Radial -->
    <radialGradient id="keyHeadCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="25%" stop-color="#67e8f9" stop-opacity="0.9" />
      <stop offset="60%" stop-color="#9333ea" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#060818" stop-opacity="0.95" />
    </radialGradient>

    <!-- Celestial Orbital Rings -->
    <linearGradient id="ringCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0.15" />
    </linearGradient>
    <linearGradient id="ringPurple" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#c084fc" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.15" />
    </linearGradient>
  </defs>

  <!-- 1. FULL SQUARE BASE CANVAS (Opaque for Apple Touch Icon & PWA) -->
  <rect width="512" height="512" fill="url(#keyBg)" />

  <!-- 2. Ambient Deep Space Halos -->
  <circle cx="256" cy="155" r="165" fill="#7c3aed" opacity="0.26" filter="url(#purpleGlow)" />
  <circle cx="256" cy="270" r="150" fill="#0284c7" opacity="0.30" filter="url(#cyanGlow)" />

  <!-- 3. Celestial Orbital Rings & Arcane Magic Circles -->
  <circle cx="256" cy="155" r="130" fill="none" stroke="url(#ringCyan)" stroke-width="1.8" stroke-dasharray="6 14" opacity="0.65" />
  <circle cx="256" cy="155" r="105" fill="none" stroke="url(#ringPurple)" stroke-width="1.4" stroke-dasharray="4 8" opacity="0.55" />
  <circle cx="256" cy="265" r="215" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="4 18" opacity="0.32" />

  <!-- Starry Spark Points -->
  <circle cx="256" cy="25" r="3.5" fill="#38bdf8" filter="url(#starGlow)" />
  <circle cx="386" cy="155" r="3" fill="#c084fc" filter="url(#starGlow)" />
  <circle cx="126" cy="155" r="3.5" fill="#67e8f9" filter="url(#starGlow)" />
  <circle cx="395" cy="360" r="2.5" fill="#38bdf8" opacity="0.75" />
  <circle cx="118" cy="370" r="2.5" fill="#c084fc" opacity="0.75" />
  <circle cx="205" cy="465" r="2" fill="#ffffff" opacity="0.7" />
  <circle cx="310" cy="460" r="2" fill="#67e8f9" opacity="0.7" />

  <!-- 4. THE GLORIOUS CRYSTAL KEY (Centrally aligned & balanced) -->
  <g id="crystalKey">
    <!-- Back Light Radiance -->
    <ellipse cx="256" cy="285" rx="60" ry="160" fill="#38bdf8" opacity="0.15" filter="url(#cyanGlow)" />

    <!-- A. KEY STEM / SHAFT (Long vertical crystal column) -->
    <!-- Shadow / Base Layer -->
    <rect x="246" y="215" width="20" height="210" rx="10" fill="#040614" />
    <!-- 3D Prismatic Glass Body -->
    <rect x="246" y="215" width="20" height="210" rx="10" fill="url(#crystalShaft)" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1.2" />
    
    <!-- Central Pure Light Conduit Core -->
    <line x1="256" y1="220" x2="256" y2="415" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.95" filter="url(#keyGlint)" />
    <line x1="256" y1="220" x2="256" y2="415" stroke="#67e8f9" stroke-width="1.5" stroke-linecap="round" />

    <!-- Prismatic Middle Collar Rings / Beads on Shaft -->
    <g transform="translate(256, 310)">
      <ellipse cx="0" cy="0" rx="15" ry="5.5" fill="url(#goldCyanBorder)" stroke="#ffffff" stroke-width="1" />
      <ellipse cx="0" cy="0" rx="11" ry="3.5" fill="#06091e" />
      <circle cx="0" cy="0" r="2.5" fill="#ffffff" filter="url(#starGlow)" />
    </g>

    <!-- B. KEY BIT (TEETH) - Beautiful Prismatic Crystal Wings & Notches on the Right -->
    <g id="keyTeeth">
      <!-- Tooth 1 (Upper Notch) -->
      <path d="M 264 340 L 298 340 L 305 347 L 305 358 L 296 364 L 264 364 Z" 
            fill="url(#toothGrad)" stroke="#ffffff" stroke-width="1.2" />
      <line x1="268" y1="352" x2="298" y2="352" stroke="#ffffff" stroke-width="1.8" opacity="0.9" />
      <circle cx="300" cy="352" r="2" fill="#ffffff" filter="url(#keyGlint)" />

      <!-- Tooth 2 (Main Long Stepped Notch) -->
      <path d="M 264 374 L 314 374 L 324 384 L 324 397 L 314 406 L 292 406 L 286 398 L 264 398 Z" 
            fill="url(#toothGrad)" stroke="#ffffff" stroke-width="1.2" />
      <line x1="268" y1="390" x2="316" y2="390" stroke="#ffffff" stroke-width="2" opacity="0.95" />
      <circle cx="318" cy="390" r="2.5" fill="#ffffff" filter="url(#starGlow)" />

      <!-- Tooth 3 (Lower Delicate Notch) -->
      <path d="M 264 412 L 296 412 L 302 418 L 302 426 L 294 430 L 264 430 Z" 
            fill="url(#toothGrad)" stroke="#ffffff" stroke-width="1" />
      <line x1="268" y1="421" x2="294" y2="421" stroke="#ffffff" stroke-width="1.5" opacity="0.85" />
    </g>

    <!-- C. SHAFT FINIAL / CRYSTAL TIP (Sharp lower crystal spire) -->
    <g id="shaftTip">
      <path d="M 246 422 L 256 454 L 266 422 Z" fill="url(#crystalShaft)" stroke="#ffffff" stroke-width="1.2" />
      <line x1="256" y1="420" x2="256" y2="452" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
      <!-- Star spark at very tip -->
      <circle cx="256" cy="454" r="3.5" fill="#ffffff" filter="url(#starGlow)" />
    </g>

    <!-- D. KEY CROSSGUARD / WING COLLAR (Between Bow and Stem) -->
    <g id="crossguard">
      <!-- Elegant curved crystal wings -->
      <path d="M 256 208 C 220 208, 188 222, 168 236 C 196 235, 230 228, 256 222 C 282 228, 316 235, 344 236 C 324 222, 292 208, 256 208 Z" 
            fill="url(#crossguardGrad)" stroke="#ffffff" stroke-width="1.2" />
      
      <!-- Wing Tip Glints -->
      <circle cx="168" cy="236" r="2.5" fill="#67e8f9" filter="url(#starGlow)" />
      <circle cx="344" cy="236" r="2.5" fill="#c084fc" filter="url(#starGlow)" />

      <!-- Center Hexagonal Runic Gem Node -->
      <path d="M 256 208 L 268 220 L 268 232 L 256 242 L 244 232 L 244 220 Z" 
            fill="#080d28" stroke="url(#goldCyanBorder)" stroke-width="1.6" />
      <circle cx="256" cy="225" r="4.5" fill="#38bdf8" filter="url(#keyGlint)" />
      <circle cx="256" cy="225" r="2" fill="#ffffff" />
    </g>

    <!-- E. KEY BOW (HEAD) - The Grand Astral Crystal Ring & Oracle Jewel -->
    <g id="keyHead">
      <!-- Outer Decorative Spire / Crown at Top (Y: 66 ~ 95) -->
      <g id="headCrown">
        <path d="M 256 62 L 268 82 L 256 94 L 244 82 Z" fill="url(#goldCyanBorder)" stroke="#ffffff" stroke-width="1.2" />
        <circle cx="256" cy="62" r="3.5" fill="#ffffff" filter="url(#starGlow)" />
        <line x1="256" y1="66" x2="256" y2="90" stroke="#ffffff" stroke-width="2" />
      </g>

      <!-- Left & Right Flank Ornaments on Head Ring -->
      <path d="M 172 155 L 184 143 L 184 167 Z" fill="url(#goldCyanBorder)" stroke="#ffffff" stroke-width="1" />
      <path d="M 340 155 L 328 143 L 328 167 Z" fill="url(#goldCyanBorder)" stroke="#ffffff" stroke-width="1" />
      <circle cx="172" cy="155" r="2.5" fill="#67e8f9" filter="url(#starGlow)" />
      <circle cx="340" cy="155" r="2.5" fill="#c084fc" filter="url(#starGlow)" />

      <!-- The Outer Thick Crystal Arch Ring -->
      <!-- Shadow background -->
      <circle cx="256" cy="155" r="74" fill="none" stroke="#040616" stroke-width="18" />
      <!-- Prismatic Gradient Arch -->
      <circle cx="256" cy="155" r="74" fill="none" stroke="url(#goldCyanBorder)" stroke-width="15" />
      <!-- Outer and Inner Fine Glass Rim Strokes -->
      <circle cx="256" cy="155" r="82" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.85" />
      <circle cx="256" cy="155" r="66" fill="none" stroke="rgba(255, 255, 255, 0.6)" stroke-width="1.2" />

      <!-- Interior Scrying Glass Void & Nebula -->
      <circle cx="256" cy="155" r="65" fill="#040510" />
      <circle cx="256" cy="155" r="65" fill="url(#keyHeadCore)" />

      <!-- 8-Point Cosmic Compass / Facet Facets inside the Bow -->
      <g stroke="#67e8f9" stroke-width="0.8" opacity="0.6">
        <line x1="256" y1="95" x2="256" y2="215" stroke-dasharray="2 4" />
        <line x1="196" y1="155" x2="316" y2="155" stroke-dasharray="2 4" />
        <line x1="213" y1="112" x2="299" y2="198" stroke-dasharray="2 4" />
        <line x1="213" y1="198" x2="299" y2="112" stroke-dasharray="2 4" />
      </g>

      <!-- Central Singularity Radiant 4-Point Starlight Core -->
      <g transform="translate(256, 155)" filter="url(#starGlow)">
        <!-- Nova Flare Diamond -->
        <path d="M 0,-34 Q 0,0 34,0 Q 0,0 0,34 Q 0,0 -34,0 Q 0,0 0,-34 Z" fill="#ffffff" opacity="0.98" />
        <path d="M 0,-20 Q 0,0 20,0 Q 0,0 0,20 Q 0,0 -20,0 Q 0,0 0,-20 Z" fill="#67e8f9" />
        <!-- Pure White Starlight Singularity Core -->
        <circle cx="0" cy="0" r="5" fill="#ffffff" />
      </g>

      <!-- Diagonal Sparkling Starlets inside Core -->
      <circle cx="232" cy="138" r="2.2" fill="#ffffff" opacity="0.9" />
      <circle cx="278" cy="134" r="1.8" fill="#67e8f9" opacity="0.9" />
      <circle cx="238" cy="174" r="2" fill="#c084fc" opacity="0.85" />
      <circle cx="276" cy="172" r="2.4" fill="#ffffff" opacity="0.95" />

      <!-- Top Primary Curved Specular Glare (Realistic Glass Crescent Highlight) -->
      <path d="M 218 116 C 235 104, 277 104, 294 116 C 278 110, 234 110, 218 116 Z" fill="#ffffff" opacity="0.95" />

      <!-- Secondary Specular Glare Accent Dot -->
      <circle cx="210" cy="132" r="3" fill="#ffffff" opacity="0.8" />
    </g>
  </g>
</svg>`;

async function run() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const svgBuffer = Buffer.from(keySvg);

  // 1. Save SVG as orb-icon.svg (and key-icon.svg for convenience)
  fs.writeFileSync(path.join(publicDir, 'orb-icon.svg'), keySvg);
  fs.writeFileSync(path.join(publicDir, 'key-icon.svg'), keySvg);
  console.log('Saved orb-icon.svg and key-icon.svg');

  // 2. apple-touch-icon-orb.png (180x180, 100% opaque for iOS Safari)
  await sharp(svgBuffer)
    .resize(180, 180)
    .flatten({ background: '#020206' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon-orb.png'));
  console.log('Generated apple-touch-icon-orb.png (180x180, opaque)');

  // 3. orb-icon-192.png (192x192, 100% opaque)
  await sharp(svgBuffer)
    .resize(192, 192)
    .flatten({ background: '#020206' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'orb-icon-192.png'));
  console.log('Generated orb-icon-192.png (192x192, opaque)');

  // 4. orb-icon-512.png (512x512, 100% opaque)
  await sharp(svgBuffer)
    .resize(512, 512)
    .flatten({ background: '#020206' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'orb-icon-512.png'));
  console.log('Generated orb-icon-512.png (512x512, opaque)');

  // 5. orb-favicon.png (64x64, 100% opaque)
  await sharp(svgBuffer)
    .resize(64, 64)
    .flatten({ background: '#020206' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'orb-favicon.png'));
  console.log('Generated orb-favicon.png (64x64, opaque)');
}

run().catch(console.error);
