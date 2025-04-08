import React from 'react'

const BackgroundAuth = () => {
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        backgroundImage: "url('/img1.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "brightness(0.3) blur(2px)",
      }}
    />
  );
}

export default BackgroundAuth
