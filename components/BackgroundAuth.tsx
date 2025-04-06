import React from 'react'

const BackgroundAuth = () => {
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "brightness(0.3) blur(2px)",
      }}
    />
  );
}

export default BackgroundAuth
