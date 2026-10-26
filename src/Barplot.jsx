import { useMemo } from "react";
import * as d3 from "d3";

const WIDTH = 500;
const HEIGHT = 400;
// Left margin leaves room for the country labels
const MARGIN = { top: 10, right: 30, bottom: 10, left: 110 };

export const Barplot = ({ data }) => {
  // Area available for the bars, once margins are removed
  const boundsWidth = WIDTH - MARGIN.left - MARGIN.right;
  const boundsHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  // Sort descending so the biggest bar is on top
  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.students - a.students),
    [data]
  );

  // Y scale: one band per country
  const yScale = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(sortedData.map((d) => d.country))
        .range([0, boundsHeight])
        .padding(0.2),
    [sortedData, boundsHeight]
  );

  // X scale: number of students -> pixels
  const xScale = useMemo(() => {
    const max = d3.max(sortedData, (d) => d.students) ?? 0;
    return d3.scaleLinear().domain([0, max]).range([0, boundsWidth]);
  }, [sortedData, boundsWidth]);

  // All rendering is plain JSX: D3 only computes positions
  const bars = sortedData.map((d) => {
    const y = yScale(d.country);
    const barWidth = xScale(d.students);
    const barHeight = yScale.bandwidth();

    return (
      <g key={d.country}>
        <rect
          x={0}
          y={y}
          width={barWidth}
          height={barHeight}
          fill="#69b3a2"
          rx={1}
        />
        {/* Country label, left of the bar */}
        <text
          x={-8}
          y={y + barHeight / 2}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={12}
        >
          {d.country}
        </text>
        {/* Value label, at the end of the bar */}
        <text
          x={barWidth + 4}
          y={y + barHeight / 2}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={11}
          fill="#555"
        >
          {d.students}
        </text>
      </g>
    );
  });

  return (
    <svg width={WIDTH} height={HEIGHT}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>{bars}</g>
    </svg>
  );
};

// Example usage:
//
// import { Barplot } from "./Barplot";
//
// const data = [
//   { country: "United States", students: 68 },
//   { country: "France", students: 21 },
//   ...
// ];
//
// export default function App() {
//   return <Barplot data={data} />;
// }
