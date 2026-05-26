import React from 'react';
import { motion } from 'motion/react';

interface GlassmorphicAppleLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'dark' | 'light';
}

export default function GlassmorphicAppleLogo({ size = 'md', className = '', theme = 'dark' }: GlassmorphicAppleLogoProps) {
  const isDark = theme === 'dark';

  // Pixel size mappings
  const dimensions = {
    sm: { width: 40, height: 40, outerRadius: 28 },
    md: { width: 56, height: 56, outerRadius: 40 },
    lg: { width: 112, height: 112, outerRadius: 76 },
    xl: { width: 180, height: 180, outerRadius: 120 }
  }[size];

  // Colors based on theme
  const accentGreen = '#89FFA0';
  const holoCyan = '#34D399';
  const glassBorder = isDark ? 'rgba(137, 255, 160, 0.45)' : 'rgba(45, 90, 39, 0.4)';

  return (
    <div 
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {/* Background radial highlight aura */}
      <div 
        className={`absolute inset-0 rounded-full blur-xl opacity-40 mix-blend-screen transition-all pointer-events-none duration-1000 ${
          isDark 
            ? 'bg-gradient-to-r from-emerald-600/35 to-[#89FFA0]/25 scale-110' 
            : 'bg-gradient-to-r from-emerald-500/15 to-emerald-300/10 scale-90'
        }`}
      />

      {/* Holographic orbital rotation rings */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Scanner Tech Ring */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 12,
            ease: "linear"
          }}
          style={{ transformOrigin: '50px 50px' }}
        >
          {/* Inner dotted orbit tracks */}
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke={isDark ? "rgba(137, 255, 160, 0.2)" : "rgba(45, 90, 39, 0.15)"} 
            strokeWidth="0.75" 
            strokeDasharray="3 4 1 4" 
          />
          {/* Futuristic tech corner crosshairs */}
          <path d="M50 4v3M50 93v3M4 50h3M93 50h3" stroke={isDark ? "rgba(137, 255, 160, 0.5)" : "rgba(45, 90, 39, 0.4)"} strokeWidth="1" strokeLinecap="round" />
        </motion.g>

        {/* Counter-rotating diagonal holographic scanning loop */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{
            repeat: Infinity,
            duration: 9,
            ease: "linear"
          }}
          style={{ transformOrigin: '50px 50px' }}
        >
          {/* Holographic orbital ellipse */}
          <ellipse 
            cx="50" 
            cy="50" 
            rx="46" 
            ry="20" 
            transform="rotate(-25 50 50)"
            stroke={`url(#holoRingGrad-${size})`}
            strokeWidth="1.5"
            strokeDasharray="24 120 10 30"
            className="opacity-90"
          />
          {/* Active scanning orbital node */}
          <motion.circle
            cx="50" 
            cy="50"
            r="2.5"
            fill={accentGreen}
            className="shadow-[0_0_8px_#89FFA0]"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              transform: 'translate(41px, 12px)',
            }}
          />
        </motion.g>

        {/* Dynamic scanning grid vertical line */}
        <motion.line
          x1="18"
          y1="15"
          x2="82"
          y2="15"
          stroke={`url(#laserGrad-${size})`}
          strokeWidth="1.5"
          animate={{
            y: [20, 75, 20],
            opacity: [0, 0.85, 0.85, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="pointer-events-none mix-blend-screen"
        />

        <defs>
          <linearGradient id={`holoRingGrad-${size}`} x1="4" y1="50" x2="96" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={holoCyan} stopOpacity="0.8" />
            <stop offset="50%" stopColor={accentGreen} stopOpacity="0.1" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`laserGrad-${size}`} x1="18" y1="0" x2="82" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0" />
            <stop offset="20%" stopColor={accentGreen} stopOpacity="0.4" />
            <stop offset="50%" stopColor="#34D399" stopOpacity="1" />
            <stop offset="80%" stopColor={accentGreen} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Primary 3D Glassmorphic Apple Object */}
      <motion.svg
        className="w-[85%] h-[85%] overflow-visible relative z-10 cursor-pointer drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <defs>
          {/* Main Glass 3D Body Fill Gradient */}
          <linearGradient id={`appleGlassGrad-${size}`} x1="20" y1="15" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isDark ? "rgba(137, 255, 160, 0.45)" : "rgba(220, 238, 224, 0.6)"} />
            <stop offset="35%" stopColor={isDark ? "rgba(34, 197, 94, 0.25)" : "rgba(167, 243, 186, 0.35)"} />
            <stop offset="70%" stopColor={isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(110, 211, 137, 0.2)"} />
            <stop offset="100%" stopColor={isDark ? "rgba(137, 255, 160, 0.03)" : "rgba(220, 238, 224, 0.1)"} />
          </linearGradient>

          {/* Leaf Shine Gradient */}
          <linearGradient id={`leafGlassGrad-${size}`} x1="50" y1="5" x2="65" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={accentGreen} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
          </linearGradient>

          {/* Holographic grid overlay pattern */}
          <pattern id={`techGrid-${size}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="none" />
            <path d="M 6 0 L 0 0 0 6" fill="none" stroke={isDark ? "rgba(137, 255, 160, 0.15)" : "rgba(45, 90, 39, 0.1)"} strokeWidth="0.5" />
          </pattern>

          {/* Shadow/Glow filters */}
          <filter id={`glassGlow-${size}`} x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.53   0 0 0 0 1   0 0 0 0 0.62  0 0 0 0.45 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Behind-glass tech circuits background block inside the apple body */}
        <clipPath id={`appleClip-${size}`}>
          {/* Organic Apple shape outline */}
          <path d="M50 82C43 82 34 84.5 28 80.5C20.5 75.5 14 62.5 14 47.5C14 31.5 23 23.5 36.5 23.5C41.5 23.5 46.5 25.5 50 27.5C53.5 25.5 58.5 23.5 63.5 23.5C77 23.5 86 31.5 86 47.5C86 62.5 79.5 75.5 72 80.5C66 84.5 57 82 50 82Z" />
        </clipPath>

        <g clipPath={`url(#appleClip-${size})`}>
          {/* Holographic grid matrix */}
          <rect x="0" y="20" width="100" height="70" fill={`url(#techGrid-${size})`} className="opacity-80" />
          
          {/* Internal neon laser circuits & nodes */}
          <circle cx="35" cy="45" r="1.5" fill="#34D399" className="opacity-75" />
          <circle cx="65" cy="55" r="2" fill={accentGreen} className="opacity-90 shadow-lg" />
          <circle cx="48" cy="65" r="1" fill="#34D399" className="opacity-60" />
          <line x1="35" y1="45" x2="42" y2="52" stroke="#34D399" strokeWidth="0.75" strokeDasharray="1 1" className="opacity-60" />
          <line x1="42" y1="52" x2="65" y2="55" stroke={accentGreen} strokeWidth="0.75" className="opacity-70" />
          
          {/* Inside Heart Pulse/Calorie Wave representation */}
          <path 
            d="M 22 56 Q 30 54, 38 46 T 48 50 T 58 42 T 68 54 T 78 52" 
            fill="none" 
            stroke={`url(#holoRingGrad-${size})`} 
            strokeWidth="0.8" 
            className="opacity-40" 
          />
        </g>

        {/* 2. Frosted Glassy Translucent Apple Body */}
        <path 
          d="M50 82C43 82 34 84.5 28 80.5C20.5 75.5 14 62.5 14 47.5C14 31.5 23 23.5 36.5 23.5C41.5 23.5 46.5 25.5 50 27.5C53.5 25.5 58.5 23.5 63.5 23.5C77 23.5 86 31.5 86 47.5C86 62.5 79.5 75.5 72 80.5C66 84.5 57 82 50 82Z" 
          fill={`url(#appleGlassGrad-${size})`}
          stroke={glassBorder}
          strokeWidth="1.5"
          className="backdrop-blur-md"
        />

        {/* 3. High-Contrast Specular Glass Reflections & 3D Shines */}
        {/* Top left curved rim shine */}
        <path 
          d="M20 37C18.5 44 21 54 26.5 61" 
          fill="none" 
          stroke={isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 255, 255, 0.85)"} 
          strokeWidth="2" 
          strokeLinecap="round" 
          className="mix-blend-overlay"
        />
        {/* Bottom right subtle bounce highlight */}
        <path 
          d="M62 76.5C68.5 73.5 75 65.5 78.5 56.5" 
          fill="none" 
          stroke={isDark ? "rgba(137, 255, 160, 0.3)" : "rgba(255, 255, 255, 0.4)"} 
          strokeWidth="1" 
          strokeLinecap="round"
        />

        {/* 4. Elegant Glass Apple Leaf and Stem */}
        {/* Curved stem in tech-orange/cyan or green */}
        <path 
          d="M50 25C49 20 52 14 56.5 11" 
          fill="none" 
          stroke={isDark ? "rgb(52, 211, 153)" : "rgb(31, 78, 38)"} 
          strokeWidth="2" 
          strokeLinecap="round" 
        />
        {/* Futuristic translucent Leaf shape */}
        <path 
          d="M56.5 11C63 11 68 15.5 69 19C65 21 57.5 19 56.5 11Z" 
          fill={`url(#leafGlassGrad-${size})`}
          stroke={isDark ? "rgba(137, 255, 160, 0.6)" : "rgba(45, 90, 39, 0.5)"}
          strokeWidth="1"
        />
        {/* Leaf center shine line */}
        <path 
          d="M58.5 13C61 14 63.5 16.5 65.5 18" 
          fill="none" 
          stroke="white" 
          strokeOpacity="0.5" 
          strokeWidth="0.75" 
        />
      </motion.svg>
    </div>
  );
}
