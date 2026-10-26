import { useEffect, useState } from "react";
import { MapBarplot } from "./MapBarplot";
import { ContinentBarplot } from "./ContinentBarplot";
import { ThemeToggle } from "./ThemeToggle";
import { Footer } from "./Footer";
import { THEMES } from "./colors";
import rawData from "./data.json";
import isoRegions from "./iso-regions.json"; // the ISO 3166 file with UN regions
import worldData from "./world.json";
import "./chart.css";

// ---- Continent of each country, from the ISO file -----------------------
// We use the ISO "region" (Europe, Asia, Oceania, Africa), except for the Americas,
// where we use the file's own sub-regions: Northern America and
// Latin America and the Caribbean.
const continentOf = (c) => (c.region === "Americas" ? c["sub-region"] : c.region);

// ---- Join: add each country's continent from the ISO file ----
// data.json has an ISO "code" (alpha-3, e.g. "FRA") for each country.
// We look it up in the ISO file, like a VLOOKUP / a join in SQL.
const CONTINENT_BY_CODE = Object.fromEntries(
  isoRegions.map((c) => [c["alpha-3"], continentOf(c)])
);
const data = rawData.map((d) => ({ ...d, continent: CONTINENT_BY_CODE[d.code] }));

// The continents, used by both charts and the buttons (Africa included, even with 0)
const CONTINENTS = [
  "Europe",
  "Northern America",
  "Latin America and the Caribbean",
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

const buttons = [{ continent: "All", students: TOTAL_STUDENTS }, ...continentTotals];

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

        {/* Two columns under the title: text on the left, key numbers on the right */}
        <div className="hero-bottom">
          <div>
            <p className="hero-subtitle">
              A snapshot of students from all over the world.
            </p>

            <p className="data-note">
              <span className="data-note-label">A note on the data</span>
              Countries show where participants are based, not where they are
              originally from. A map of countries of origin could tell a very
              different story.
            </p>
          </div>

          {/* BANs ("big numbers"): computed from the data, so they update with it */}
          <div className="hero-stats" aria-label="Key numbers">
            <p className="hero-stats-label">
              <span className="pulse-dot" aria-hidden="true" />
              Cohort 1
            </p>
            {/* A 2 x 2 grid: numbers on the first row, words underneath
                232        20
                students   countries */}
            <div className="ban-grid">
              <span className="ban-number">{TOTAL_STUDENTS}</span>
              <span className="ban-number">{data.length}</span>
              <span className="ban-label">students</span>
              <span className="ban-label">countries</span>
            </div>
          </div>
        </div>
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
        <p className="chart-footnote">
          Groups follow the UN M49 regions (ISO 3166 country list). For the
          Americas, we use its two sub-regions: Northern America and Latin
          America and the Caribbean.
        </p>
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
                b.continent === continent ? "filter-button active" : "filter-button"
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

      {/* Call to action: one simple sentence */}
      <footer className="cta">
        <p>
          Want to be on the map?{" "}
          <a
            href="https://www.react-graph-gallery.com/react-d3-dataviz-course"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the waitlist for the course
          </a>
          , taught by{" "}
          <a href="https://www.yan-holtz.com/" target="_blank" rel="noopener noreferrer">
            Yan Holtz
          </a>
          .
        </p>
      </footer>

      <Footer />
    </main>
  );
}
