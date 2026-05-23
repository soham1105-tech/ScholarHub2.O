import React from 'react';

const Tree: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 40 180" className="w-10 h-auto" fill={color}>
    <path d="M20 0 L35 40 L5 40 Z" opacity="0.6" />
    <path d="M20 30 L38 80 L2 80 Z" opacity="0.8" />
    <path d="M20 60 L40 130 L0 130 Z" />
    <rect x="18" y="130" width="4" height="50" rx="1" />
  </svg>
);

export const ForestBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-[0.08]">
      {/* Back row */}
      <div className="absolute bottom-[-20px] left-0 w-full flex justify-around opacity-40 scale-[1.3]">
        {[...Array(8)].map((_, i) => (
          <Tree key={`back-${i}`} color="#0d1f12" />
        ))}
      </div>
      
      {/* Mid row */}
      <div className="absolute bottom-[-10px] left-0 w-full flex justify-between px-4 opacity-60 scale-[1.0]">
        {[...Array(10)].map((_, i) => (
          <Tree key={`mid-${i}`} color="#0f2416" />
        ))}
      </div>
      
      {/* Front row */}
      <div className="absolute bottom-0 left-0 w-full flex justify-evenly opacity-80 scale-[0.8]">
        {[...Array(6)].map((_, i) => (
          <Tree key={`front-${i}`} color="#112a1a" />
        ))}
      </div>

      {/* Forest Background Image Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30" 
        style={{ backgroundImage: "url('https://applescoop.org/image/wallpapers/iphone/dark-green-forest-with-one-orange-tree-16-09-2024-1726548480.jpg')" }}
      />
    </div>
  );
};
