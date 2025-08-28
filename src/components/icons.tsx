'use client';

import type { SVGProps } from 'react';
import { motion } from 'framer-motion';

export const Logo = (props: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 160 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Spotlight Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      
      <g transform="translate(0, 4) scale(0.35)">
        <motion.circle 
          cx="50" cy="50" r="45" 
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary))" 
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <motion.path
          d="M50 35 L50 65"
          stroke="#FFF"
          strokeWidth="4"
          strokeLinecap="round"
           initial={{ scaleY: 0, opacity: 0 }}
           animate={{ scaleY: 1, opacity: 1 }}
           transition={{ duration: 0.5, ease: "easeOut", delay: 0.8 }}
        />
        <motion.circle 
            cx="50" cy="50" r="10" 
            fill="white"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.6 }}
        />
      </g>

      <motion.text
        x="42"
        y="28"
        fontFamily="var(--font-inter), sans-serif"
        fontSize="22"
        fontWeight="800"
        className="animated-gradient-text tracking-tighter"
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 42, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
      >
        Spotlight
      </motion.text>
    </svg>
);