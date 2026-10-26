// Chart colours for each theme. The SVG charts get these as a prop,
// so they switch instantly with the light / dark toggle.
// (The HTML parts of the page use the matching CSS variables in chart.css.)
export const THEMES = {
  dark: {
    bg: "#1b1b1f", // page background
    land: "#2a2b31", // map countries: quiet context
    landStroke: "#1b1b1f",
    accent: "#ff6fa3", // pink: selection, map circles and lines
    bar: "#7fa6a6", // sea-teal from the mosaic
    track: "#26272c",
    grid: "#3a3b42",
    label: "#e8e7e2",
    value: "#8b8f94",
  },
  light: {
    bg: "#f5f4f0",
    land: "#e3e1da",
    landStroke: "#f5f4f0",
    accent: "#c2255c", // a deeper pink: passes contrast (5.1:1) on the light background
    bar: "#587676", // deeper teal from the mosaic, for contrast on light
    track: "#e8e6e0",
    grid: "#cfccc4",
    label: "#1b1b1f",
    value: "#63676b",
  },
};
