"use client";
import React from "react";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  fullScreen?: boolean;
}

export default function LogoLoader({
  size = "md",
  label = "Loading...",
  fullScreen = false,
}: LogoLoaderProps) {
  const sizeMap = {
    sm: "w-10 h-10",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    xl: "w-44 h-44",
  };

  const containerSizes = {
    sm: "p-4 rounded-2xl",
    md: "p-6 rounded-3xl",
    lg: "p-8 rounded-[2rem]",
    xl: "p-10 rounded-[2.5rem]",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Claymorphic Card Shell for Loader */}
      <div className={`clay-card ${containerSizes[size]} flex items-center justify-center bg-white/90 backdrop-blur-xl border border-primary/10 shadow-clay-card relative overflow-hidden group`}>
        {/* Subtle Ambient Pulse */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-amber-500/5 to-transparent animate-pulse" />

        {/* Animated Fill & Unfill SVG */}
        <div className={`relative ${sizeMap[size]} flex items-center justify-center`}>
          <svg
            viewBox="0 0 500 580"
            className="w-full h-full drop-shadow-md"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Fill/Unfill Vertical ClipPath Animation */}
              <clipPath id="logo-fill-clip">
                <rect x="0" y="0" width="500" height="580">
                  <animate
                    attributeName="y"
                    values="580; 0; 580"
                    keyTimes="0; 0.5; 1"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="height"
                    values="0; 580; 0"
                    keyTimes="0; 0.5; 1"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </rect>
              </clipPath>
            </defs>

            {/* Base / Unfilled Layer (Faded Navy/Gold Outline) */}
            <g opacity="0.2">
              <path fill="#183153" d="M 110 90 C 60 160 55 250 60 320 C 68 410 135 480 205 520 L 218 575 L 242 455 C 180 435 105 375 102 305 C 98 235 110 170 142 120 Z" />
              <path fill="#CDA333" d="M 390 90 C 440 160 445 250 440 320 C 432 410 365 480 295 520 L 248 578 L 305 465 C 365 435 395 375 398 305 C 402 235 390 170 358 120 Z" />
              <path fill="#183153" d="M 165 210 C 165 120 200 65 250 65 C 300 65 335 120 335 210 L 335 242 L 165 242 Z M 205 210 C 205 145 222 102 250 102 C 278 102 295 145 295 210 L 295 242 L 205 242 Z" />
              <rect fill="#FFFFFF" x="155" y="125" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="155" y="157" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="155" y="189" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="295" y="125" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="295" y="157" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="295" y="189" width="50" height="15" rx="7.5" />
              <path fill="#183153" d="M 165 260 L 335 260 L 335 305 C 335 375 295 415 250 415 C 205 415 165 375 165 305 Z" />
              <rect fill="#CDA333" x="202" y="246" width="12" height="70" rx="6" />
              <rect fill="#CDA333" x="218" y="246" width="12" height="96" rx="6" />
              <rect fill="#CDA333" x="234" y="246" width="12" height="118" rx="6" />
              <rect fill="#CDA333" x="250" y="246" width="12" height="136" rx="6" />
              <rect fill="#CDA333" x="266" y="246" width="12" height="118" rx="6" />
              <rect fill="#CDA333" x="282" y="246" width="12" height="96" rx="6" />
              <rect fill="#CDA333" x="298" y="246" width="12" height="70" rx="6" />
            </g>

            {/* Vibrant Filled Layer Animated with clipPath */}
            <g clipPath="url(#logo-fill-clip)">
              <path fill="#183153" d="M 110 90 C 60 160 55 250 60 320 C 68 410 135 480 205 520 L 218 575 L 242 455 C 180 435 105 375 102 305 C 98 235 110 170 142 120 Z" />
              <path fill="#CDA333" d="M 390 90 C 440 160 445 250 440 320 C 432 410 365 480 295 520 L 248 578 L 305 465 C 365 435 395 375 398 305 C 402 235 390 170 358 120 Z" />
              <path fill="#183153" d="M 165 210 C 165 120 200 65 250 65 C 300 65 335 120 335 210 L 335 242 L 165 242 Z M 205 210 C 205 145 222 102 250 102 C 278 102 295 145 295 210 L 295 242 L 205 242 Z" />
              <rect fill="#FFFFFF" x="155" y="125" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="155" y="157" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="155" y="189" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="295" y="125" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="295" y="157" width="50" height="15" rx="7.5" />
              <rect fill="#FFFFFF" x="295" y="189" width="50" height="15" rx="7.5" />
              <path fill="#183153" d="M 165 260 L 335 260 L 335 305 C 335 375 295 415 250 415 C 205 415 165 375 165 305 Z" />
              <rect fill="#CDA333" x="202" y="246" width="12" height="70" rx="6" />
              <rect fill="#CDA333" x="218" y="246" width="12" height="96" rx="6" />
              <rect fill="#CDA333" x="234" y="246" width="12" height="118" rx="6" />
              <rect fill="#CDA333" x="250" y="246" width="12" height="136" rx="6" />
              <rect fill="#CDA333" x="266" y="246" width="12" height="118" rx="6" />
              <rect fill="#CDA333" x="282" y="246" width="12" height="96" rx="6" />
              <rect fill="#CDA333" x="298" y="246" width="12" height="70" rx="6" />
            </g>
          </svg>
        </div>
      </div>

      {label && (
        <p className="text-xs font-black text-navy/60 tracking-wider uppercase animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-light/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}
