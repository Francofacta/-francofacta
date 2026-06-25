export function BrandLogo() {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#0f0f0f" />
        <path
          d="M6,16 Q11,8 16,16 Q21,24 26,16"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon points="23,11 28,16 23,21" fill="white" />
      </svg>
      <span style={{ fontWeight: 700, fontSize: "20px", color: "#0f0f0f" }}>
        Cash<span style={{ color: "#c94a1a" }}>flux</span>
      </span>
    </span>
  );
}
