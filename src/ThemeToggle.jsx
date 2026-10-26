// A light / dark switch: a pill with a sun and a moon, and a knob that slides
// under the active one. It's a real <button>, so it works with the keyboard too.
export const ThemeToggle = ({ theme, onToggle }) => {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      onClick={onToggle}
    >
      <span className={isDark ? "theme-knob is-dark" : "theme-knob"} />

      {/* Sun */}
      <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="12"
            y1="2"
            x2="12"
            y2="4.5"
            transform={`rotate(${angle} 12 12)`}
          />
        ))}
      </svg>

      {/* Moon */}
      <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    </button>
  );
};
