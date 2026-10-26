import { useEffect, useState } from "react";
import { MapBarplot } from "./MapBarplot";
import { ContinentBarplot } from "./ContinentBarplot";
import { ThemeToggle } from "./ThemeToggle";
import { THEMES } from "./colors";
import data from "./data.json";
import worldData from "./world.json";
import "./chart.css";

// Every continent we want to show, including ones with no students yet
const CONTINENTS = [
  "Europe",
  "North America",
  "South America",
  "Asia",
  "Oceania",
  "Africa",
];

// Computed once from the full dataset, so bars keep the same scale when filtering
const MAX_STUDENTS = Math.max(...data.map((d) => d.students));
const TOTAL_STUDENTS = data.reduce((sum, d) => sum + d.students, 0);

// Students per continent, e.g. { continent: "Europe", students: 117 }.
// Built from the CONTINENTS list (not from the data), so Africa appears with 0.
const continentTotals = CONTINENTS.map((c) => ({
  continent: c,
  students: data
    .filter((d) => d.continent === c)
    .reduce((sum, d) => sum + d.students, 0),
}));

// Decorative mosaic in the "Coming next" box: teal tones from the mosaic palette.
// Numbers pick a tone, null = an empty dashed tile (students still to come).
const MOSAIC_TONES = ["#2f3f3e", "#3c544e", "#4e6b67", "#587676", "#729494", "#7fa6a6", "#8db7b7"];
const MOSAIC = [
  3, 5, 1, 6, 2, 4,
  0, 4, 6, 3, 5, null,
  5, 2, 3, null, 1, null,
  1, 6, null, null, null, null,
];

const buttons = [
  { continent: "All", students: TOTAL_STUDENTS },
  ...continentTotals,
];

// Start with the theme the visitor chose last time, otherwise their system setting.
// (localStorage can be unavailable, e.g. in private windows, hence the try/catch.)
const getInitialTheme = () => {
  try {
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  } catch {
    // ignore: fall back to dark
  }
  return "dark";
};

export default function App() {
  // State 1: which continent is selected. Drives both charts and the buttons.
  // Starts on Africa: the page opens on the "waiting for students" view
  const [continent, setContinent] = useState("Africa");

  // State 2: light or dark theme.
  const [theme, setTheme] = useState(getInitialTheme);

  // Whenever the theme changes: tell the CSS (data-theme on <html>) and remember it
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // ignore: the theme just won't be remembered
    }
  }, [theme]);

  const colors = THEMES[theme];

  const filteredData =
    continent === "All" ? data : data.filter((d) => d.continent === continent);

  return (
    <main className="page">
      <ThemeToggle
        theme={theme}
        onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <header className="hero">
        <p className="eyebrow">Data visualization / D3 + React course</p>

        <h1 className="hero-title">
          {/* Each line is its own block, so the title always breaks here */}
          <span className="hero-line">
            Where do{" "}
            <span className="course-logo">
              D3
              <img
                src="https://www.react-graph-gallery.com/asset/heart-x.svg"
                alt="loves"
                className="course-logo-heart"
              />
              React
            </span>
          </span>
          <span className="hero-line">students come from?</span>
        </h1>

        <p className="hero-subtitle">
          A snapshot of students from all over the world.
        </p>

        <p className="hero-intro">
          {TOTAL_STUDENTS} students from {data.length} countries. Explore where
          they come from: first by continent, then country by country.
        </p>
      </header>

      <section className="chart-section">
        <h2 className="section-title">An overview by continent</h2>
        <ContinentBarplot
          data={continentTotals}
          total={TOTAL_STUDENTS}
          selected={continent}
          onSelect={setContinent}
          colors={colors}
        />
      </section>

      <section className="chart-section">
        <h2 className="section-title">A deeper look by country</h2>

        <div
          className="filter-buttons"
          role="group"
          aria-label="Filter by continent"
        >
          {buttons.map((b) => (
            <button
              key={b.continent}
              className={
                b.continent === continent
                  ? "filter-button active"
                  : "filter-button"
              }
              aria-pressed={b.continent === continent}
              onClick={() => setContinent(b.continent)}
            >
              {b.continent}
              <span className="filter-count">{b.students}</span>
            </button>
          ))}
        </div>

        <MapBarplot
          data={filteredData}
          geoData={worldData}
          maxValue={MAX_STUDENTS}
          continent={continent}
          colors={colors}
        />
      </section>

      <aside className="coming-next" aria-label="Coming next">
        <div>
          <p className="coming-next-eyebrow">
            <span className="pulse-dot" aria-hidden="true" />
            Coming next
          </p>
          <h2 className="coming-next-title">
            This is cohort 1. How will the map change as the next cohort
            joins?
          </h2>
          <p className="coming-next-body">
            These numbers capture the students of cohort 1. With cohort 2
            starting in October 2026, their data will land here too, and we'll
            see how the mix shifts: new countries? Growing communities?
          </p>
        </div>

        <div className="coming-next-mosaic" aria-hidden="true">
          {MOSAIC.map((tone, i) =>
            tone === null ? (
              <span key={i} className="mosaic-tile is-empty" />
            ) : (
              <span
                key={i}
                className="mosaic-tile"
                style={{ background: MOSAIC_TONES[tone] }}
              />
            )
          )}
        </div>
      </aside>
    </main>
  );
}
