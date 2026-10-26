import { useMemo } from "react";
import * as d3 from "d3";
import { COLORS } from "./colors";

// Internal drawing size; the SVG scales to the container width (viewBox)
const WIDTH = 1000;
const ROW_STEP = 30; // height of one continent row
const BAR_THICKNESS = 8;
const LABEL_WIDTH = 160; // room for "North America"
const VALUE_WIDTH = 110; // room for "117 · 50%" after the longest bar
const PADDING_Y = 6;

// data: [{ continent, students }], including continents with 0 students
export const ContinentBarplot = ({ data, total, selected, onSelect }) => {
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.students - a.students),
    [data]
  );

  const height = sortedData.length * ROW_STEP + PADDING_Y * 2;
  const barMaxWidth = WIDTH - LABEL_WIDTH - VALUE_WIDTH;

  const yScale = d3
    .scaleBand()
    .domain(sortedData.map((d) => d.continent))
    .range([PADDING_Y, height - PADDING_Y]);

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(sortedData, (d) => d.students) || 1])
    .range([0, barMaxWidth]);

  const rows = sortedData.map((d) => {
    const isSelected = selected === d.continent;
    const isDimmed = selected !== "All" && !isSelected;
    const yMid = yScale(d.continent) + yScale.bandwidth() / 2;
    const w = xScale(d.students);
    const share = total ? Math.round((d.students / total) * 100) : 0;

    // Clicking a selected continent again goes back to "All"
    const select = () => onSelect(isSelected ? "All" : d.continent);

    return (
      <g
        key={d.continent}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`${d.continent}: ${d.students} students`}
        onClick={select}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            select();
          }
        }}
        style={{
          cursor: "pointer",
          outline: "none",
          opacity: isDimmed ? 0.35 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {/* Invisible full-row rectangle: the whole row is clickable */}
        <rect
          x={0}
          y={yScale(d.continent)}
          width={WIDTH}
          height={yScale.bandwidth()}
          fill="transparent"
        />
        <text
          x={0}
          y={yMid}
          dominantBaseline="middle"
          fontSize={13}
          fill={COLORS.label}
          fontWeight={isSelected ? 700 : 400}
        >
          {d.continent}
        </text>
        {/* Background track: shows the full scale, so an empty bar still reads as "0 of a lot" */}
        <rect
          x={LABEL_WIDTH}
          y={yMid - BAR_THICKNESS / 2}
          width={barMaxWidth}
          height={BAR_THICKNESS}
          rx={BAR_THICKNESS / 2}
          fill={COLORS.track}
        />
        {w > 0 && (
          <rect
            x={LABEL_WIDTH}
            y={yMid - BAR_THICKNESS / 2}
            width={Math.max(w, BAR_THICKNESS)} // tiny values still show as a dot
            height={BAR_THICKNESS}
            rx={BAR_THICKNESS / 2}
            fill={isSelected ? COLORS.accent : COLORS.bar}
          />
        )}
        <text
          x={LABEL_WIDTH + Math.max(w, BAR_THICKNESS) + 12}
          y={yMid}
          dominantBaseline="middle"
          fontSize={12}
        >
          <tspan fill={COLORS.label} fontWeight={700}>
            {d.students}
          </tspan>
          <tspan fill={COLORS.value}> · {share}%</tspan>
        </text>
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      width="100%"
      style={{ display: "block", height: "auto" }}
    >
      {rows}
    </svg>
  );
};
