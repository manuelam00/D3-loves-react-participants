import { useState } from "react";
import { MapBarplot } from "./MapBarplot";
import data from "./data.json"; // instead of: import { data } from "./data"; (switched to json file)
import worldData from "./world.json";
import "./chart.css";

const CONTINENTS = [
  "All",
  "Europe",
  "North America",
  "South America",
  "Asia",
  "Oceania",
];

// Computed once from the full dataset, so bars keep the same scale when filtering
const MAX_STUDENTS = Math.max(...data.map((d) => d.students));

export default function App() {
  const [continent, setContinent] = useState("All");

  const filteredData =
    continent === "All" ? data : data.filter((d) => d.continent === continent);

  // Total students per continent, shown on each button
  const totalFor = (c) =>
    (c === "All" ? data : data.filter((d) => d.continent === c)).reduce(
      (sum, d) => sum + d.students,
      0,
    );

  return (
    <div className="chart-container">
      <h1 className="chart-title">
        Where do D3 loves React students come from?
      </h1>
      <p className="chart-subtitle">
        A snapshot of students from all over the world.
      </p>

      <div
        className="filter-buttons"
        role="group"
        aria-label="Filter by continent"
      >
        {CONTINENTS.map((c) => (
          <button
            key={c}
            className={
              c === continent ? "filter-button active" : "filter-button"
            }
            aria-pressed={c === continent}
            onClick={() => setContinent(c)}
          >
            {c}
            <span className="filter-count">{totalFor(c)}</span>
          </button>
        ))}
      </div>

      <MapBarplot
        data={filteredData}
        geoData={worldData}
        maxValue={MAX_STUDENTS}
        continent={continent}
      />
    </div>
  );
}
