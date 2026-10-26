import { useEffect, useState } from "react";
import { MapBarplot } from "./MapBarplot";
import { OverviewBarplot } from "./OverviewBarplot";
import { ThemeToggle } from "./ThemeToggle";
import { Footer } from "./Footer";
import { THEMES } from "./colors";
import rawData from "./data.json";
import isoRegions from "./iso-regions.json"; // the ISO 3166 file with UN regions
import worldData from "./world.json";
import "./chart.css";

// ---- Join: add each country's region and sub-region from the ISO file ----
// data.json has an ISO "code" (alpha-3, e.g. "FRA") for each country.
// We look it up in the ISO file, like a VLOOKUP / a join in SQL.
const GEO_BY_CODE = Object.fromEntries(
  isoRegions.map((c) => [c["alpha-3"], { region: c.region, subregion: c["sub-region"] }])
);
const data = rawData.map((d) => ({ ...d, ...GEO_BY_CODE[d.code] }));

// All 5 regions and 17 sub-regions of the ISO file, alphabetical,
// including the ones with no students (e.g. Africa, Central Asia).
const geoRows = isoRegions.filter((c) => c.region && c["sub-region"]);
const REGIONS = [...new Set(geoRows.map((c) => c.region))].sort();
const SUBREGIONS_BY_REGION = Object.fromEntries(
  REGIONS.map((r) => [
    r,
    [...new Set(geoRows.filter((c) => c.region === r).map((c) => c["sub-region"]))].sort(),
  ])
);
const REGION_OF_SUBREGION = Object.fromEntries(
  REGIONS.flatMap((r) => SUBREGIONS_BY_REGION[r].map((s) => [s, r]))
);

// Computed once from the full dataset, so bars keep the same scale when filtering
const MAX_STUDENTS = Math.max(...data.map((d) => d.students));
const TOTAL_STUDENTS = data.reduce((sum, d) => sum + d.students, 0);

const sumStudents = (rows) => rows.reduce((sum, d) => sum + d.students, 0);

// Students per group, e.g. { name: "Europe", students: 117 }
const regionTotals = REGIONS.map((r) => ({
  name: r,
  students: sumStudents(data.filter((d) => d.region === r)),
}));
const subregionTotals = Object.fromEntries(
  Object.keys(REGION_OF_SUBREGION).map((s) => [
    s,
    sumStudents(data.filter((d) => d.subregion === s)),
  ])
);

// Decorative mosaic in the "Coming next" box: teal tones from the mosaic palette.
// Numbers pick a tone, null = an empty dashed tile (students still to come).
const MOSAIC_TONES = ["#2f3f3e", "#3c544e", "#4e6b67", "#587676", "#729494", "#7fa6a6", "#8db7b7"];
const MOSAIC = [
  3, 5, 1, 6, 2, 4,
  0, 4, 6, 3, 5, null,
  5, 2, 3, null, 1, null,
  1, 6, null, null, null, null,
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
  // State 1: what is selected. Drives both charts and the buttons.
  //   { type: "all" }
  //   { type: "region", name: "Europe" }            <- a bar in the top chart (Region view)
  //   { type: "subregion", name: "Western Europe" } <- a button, or a bar (Sub-region view)
  // Starts on Africa: the page opens on the "waiting for students" view
  const [selection, setSelection] = useState({ type: "region", name: "Africa" });

  // State 2: which level the top chart shows
  const [level, setLevel] = useState("region"); // "region" | "subregion"

  // State 3: light or dark theme.
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
    selection.type === "all"
      ? data
      : data.filter((d) => d[selection.type] === selection.name);

  // Clicking the selected item again goes back to "all"
  const toggle = (type, name) =>
    setSelection(
      selection.type === type && selection.name === name ? { type: "all" } : { type, name }
    );

  // Top chart: its rows, and which ones are highlighted
  const overviewData =
    level === "region"
      ? regionTotals
      : Object.entries(subregionTotals).map(([name, students]) => ({ name, students }));

  let highlighted = [];
  if (level === "region") {
    if (selection.type === "region") highlighted = [selection.name];
    if (selection.type === "subregion") highlighted = [REGION_OF_SUBREGION[selection.name]];
  } else {
    if (selection.type === "subregion") highlighted = [selection.name];
    if (selection.type === "region") highlighted = SUBREGIONS_BY_REGION[selection.name];
  }

  // Name shown on the map's "waiting" message and used for its zoom
  const mapFocus = selection.type === "all" ? "All" : selection.name;

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
        <div className="section-header">
          <h2 className="section-title">An overview by world region</h2>
          {/* Region / Sub-region switch for the top chart */}
          <div className="level-switch" role="group" aria-label="Group by">
            {[
              ["region", "Region"],
              ["subregion", "Sub-region"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={level === value ? "level-option active" : "level-option"}
                aria-pressed={level === value}
                onClick={() => setLevel(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <OverviewBarplot
          data={overviewData}
          total={TOTAL_STUDENTS}
          highlighted={highlighted}
          onRowClick={(name) => toggle(level, name)}
          colors={colors}
        />
        <p className="chart-footnote">
          Regions and sub-regions follow the UN M49 standard (ISO 3166 country
          list).
        </p>
      </section>

      <section className="chart-section">
        <h2 className="section-title">A deeper look by country</h2>

        {/* Sub-region buttons, grouped by region (like the ISO table) */}
        <div className="subregion-filter" role="group" aria-label="Filter by sub-region">
          <button
            className={selection.type === "all" ? "filter-button active" : "filter-button"}
            aria-pressed={selection.type === "all"}
            onClick={() => setSelection({ type: "all" })}
          >
            All
            <span className="filter-count">{TOTAL_STUDENTS}</span>
          </button>

          {REGIONS.map((region) => (
            <div key={region} className="subregion-row">
              <span className="subregion-region">{region}</span>
              <div className="filter-buttons">
                {SUBREGIONS_BY_REGION[region].map((sub) => {
                  const isActive = selection.type === "subregion" && selection.name === sub;
                  // Picked as a whole region in the top chart: show its buttons softly
                  const inRegion = selection.type === "region" && selection.name === region;
                  return (
                    <button
                      key={sub}
                      className={
                        "filter-button" +
                        (isActive ? " active" : "") +
                        (inRegion ? " in-selection" : "") +
                        (subregionTotals[sub] === 0 ? " is-empty" : "")
                      }
                      aria-pressed={isActive}
                      onClick={() => toggle("subregion", sub)}
                    >
                      {sub}
                      <span className="filter-count">{subregionTotals[sub]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <MapBarplot
          data={filteredData}
          geoData={worldData}
          maxValue={MAX_STUDENTS}
          focus={mapFocus}
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
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
          , taught by{" "}
          <a href="https://www.yan-holtz.com/" target="_blank" rel="noopener noreferrer">
            Yan Holtz
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </footer>

      <Footer />
    </main>
  );
}
