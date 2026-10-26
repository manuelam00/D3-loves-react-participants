import { useMemo } from "react";
import * as d3 from "d3";
import { COLORS } from "./colors";

// ---- Layout (internal drawing size; the SVG scales to the container width) ----
const WIDTH = 1000;
const ROW_STEP = 40; // height of one continent row
const BAR_THICKNESS = 16;
const PADDING_TOP = 6;
const AXIS_HEIGHT = 32; // room under the rows for the "0%" and "100%" labels

// Columns, from left to right:
//   [ continent, right-aligned ] [ % in bold, right-aligned ] [ bar ......... ] [ count ]
const CONTINENT_RIGHT_X = 165; // continent names END here
const PERCENT_RIGHT_X = 255; // percentages END here
const BAR_START_X = 272; // bars (and the 0% line) start here
const BAR_END_X = WIDTH - 50; // the 100% line

const GRID_TICKS = [25, 50, 75, 100]; // light vertical lines (no line at 0%)
const LABELLED_TICKS = [0, 100]; // only these get a label

const formatPercent = d3.format(".1f"); // 50.4

// data: [{ continent, students }], including continents with 0 students
export const ContinentBarplot = ({ data, total, selected, onSelect }) => {
  // Add each continent's share of all students, in percent (0 – 100)
  const sortedData = useMemo(
    () =>
      data
        .map((d) => ({ ...d, percent: total ? (d.students / total) * 100 : 0 }))
        .sort((a, b) => b.students - a.students),
    [data, total]
  );

  const rowsHeight = sortedData.length * ROW_STEP;
  const height = PADDING_TOP + rowsHeight + AXIS_HEIGHT;

  const yScale = d3
    .scaleBand()
    .domain(sortedData.map((d) => d.continent))
    .range([PADDING_TOP, PADDING_TOP + rowsHeight]);

  // The bar length is the PERCENTAGE: 0% -> no bar, 100% -> the full width
  const xScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([BAR_START_X, BAR_END_X]);

  // ---- Grid and axis ------------------------------------------------------
  // Lines and labels are separate lists: 0% has a label but no line
  const gridLines = GRID_TICKS.map((tick) => (
    <line
      key={tick}
      x1={xScale(tick)}
      x2={xScale(tick)}
      y1={PADDING_TOP}
      y2={PADDING_TOP + rowsHeight}
      stroke={COLORS.grid}
      strokeWidth={1}
      strokeDasharray="2 4"
    />
  ));

  const axisLabels = LABELLED_TICKS.map((tick) => (
    <text
      key={tick}
      x={xScale(tick)}
      y={PADDING_TOP + rowsHeight + 22}
      textAnchor="middle"
      fontSize={14}
      fill={COLORS.value}
    >
      {tick}%
    </text>
  ));

  // ---- Rows ---------------------------------------------------------------
  const rows = sortedData.map((d) => {
    const isSelected = selected === d.continent;
    const isDimmed = selected !== "All" && !isSelected;
    const yMid = yScale(d.continent) + yScale.bandwidth() / 2;
    const barWidth = xScale(d.percent) - BAR_START_X;
    const barEnd = BAR_START_X + Math.max(barWidth, d.students > 0 ? BAR_THICKNESS : 0);

    // Clicking a selected continent again goes back to "All"
    const select = () => onSelect(isSelected ? "All" : d.continent);

    return (
      <g
        key={d.continent}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`${d.continent}: ${formatPercent(d.percent)}%, ${d.students} students`}
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

        {/* Continent, right-aligned (textAnchor="end" = the text ENDS at x) */}
        <text
          x={CONTINENT_RIGHT_X}
          y={yMid}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={16}
          fill={isSelected ? COLORS.label : COLORS.value}
          fontWeight={isSelected ? 700 : 400}
        >
          {d.continent}
        </text>

        {/* Percentage, bold, right-aligned so the decimals line up */}
        <text
          x={PERCENT_RIGHT_X}
          y={yMid}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={20}
          fontWeight={700}
          fill={isSelected ? COLORS.accent : COLORS.label}
        >
          {formatPercent(d.percent)}%
        </text>

        {/* The bar: its length is the percentage */}
        {d.students > 0 && (
          <rect
            x={BAR_START_X}
            y={yMid - BAR_THICKNESS / 2}
            width={Math.max(barWidth, BAR_THICKNESS)} // tiny values still show as a dot
            height={BAR_THICKNESS}
            rx={BAR_THICKNESS / 2}
            fill={isSelected ? COLORS.accent : COLORS.bar}
          />
        )}

        {/* Number of students, just after the bar */}
        <text
          x={barEnd + 8}
          y={yMid}
          dominantBaseline="middle"
          fontSize={15}
          fill={COLORS.value}
        >
          {d.students}
        </text>
      </g>
    );
  });

  // The grid is drawn first, so the bars sit on top of the lines
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      width="100%"
      style={{ display: "block", height: "auto" }}
    >
      {gridLines}
      {axisLabels}
      {rows}
    </svg>
  );
};
