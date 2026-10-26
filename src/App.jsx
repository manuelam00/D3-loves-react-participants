import { useState } from "react";
import { MapBarplot } from "./MapBarplot";
import { ContinentBarplot } from "./ContinentBarplot";
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

const buttons = [
  { continent: "All", students: TOTAL_STUDENTS },
  ...continentTotals,
];

export default function App() {
  // One piece of state drives BOTH charts and the buttons
  const [continent, setContinent] = useState("All");

  const filteredData =
    continent === "All" ? data : data.filter((d) => d.continent === continent);

  return (
    <div className="chart-container">
      <h1 className="chart-title">
        Where do D3 loves React students come from?
      </h1>
      <p className="chart-subtitle">
        A snapshot of students from all over the world.
      </p>

      <section className="chart-section">
        <h2 className="section-title">An overview by continent</h2>
        <ContinentBarplot
          data={continentTotals}
          total={TOTAL_STUDENTS}
          selected={continent}
          onSelect={setContinent}
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
        />
      </section>
    </div>
  );
}
