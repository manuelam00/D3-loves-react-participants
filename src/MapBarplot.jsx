import { useMemo, useState } from "react";
import * as d3 from "d3";

// ---- Layout (all in pixels) ---------------------------------------------
const WIDTH = 1000;
const HEIGHT = 500;
const MARGIN = { top: 20, right: 40, bottom: 20, left: 10 };

const MAP_WIDTH = 540; // the map lives in x = MARGIN.left ... MAP_WIDTH
const LINK_END_X = 640; // where the lines arrive, just left of the labels
const LABEL_WIDTH = 110; // room for "United Kingdom"
const BAR_START_X = LINK_END_X + LABEL_WIDTH; // bars start here
const ROW_STEP = 23; // fixed height per country row, so filtering doesn't create giant bars

// ---- Colours for a dark background -------------------------------------------
// One accent colour (pink) ties each country's circle to its line.
// The map is deliberately quiet: it's context, not the main message.
const COLORS = {
  land: "#2a2e37",
  landStroke: "#16181d",
  accent: "#ff6fa3",
  bar: "#5cc8b0",
  label: "#d4d7dd",
  value: "#8a8f99",
};

export const MapBarplot = ({ data, geoData, maxValue }) => {
  // Which country is under the mouse? null = none.
  const [hovered, setHovered] = useState(null);

  const boundsHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const barMaxWidth = WIDTH - MARGIN.right - BAR_START_X;

  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.students - a.students),
    [data]
  );

  // ---- Map ----------------------------------------------------------------
  const countries = useMemo(
    () => ({
      type: "FeatureCollection",
      features: geoData.features.filter(
        (f) => f.properties.name !== "Antarctica"
      ),
    }),
    [geoData]
  );

  // Equal Earth: an equal-area projection, so country sizes are honest
  const projection = useMemo(
    () =>
      d3.geoEqualEarth().fitExtent(
        [
          [MARGIN.left, 0],
          [MAP_WIDTH, boundsHeight],
        ],
        countries
      ),
    [countries, boundsHeight]
  );

  const geoPathGenerator = d3.geoPath().projection(projection);

  // ---- Scales -------------------------------------------------------------
  // maxValue comes from the FULL dataset, so bar lengths stay comparable
  // whichever continent is selected.
  const max = maxValue ?? d3.max(sortedData, (d) => d.students) ?? 0;

  const yScale = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(sortedData.map((d) => d.country))
        .range([0, Math.min(boundsHeight, sortedData.length * ROW_STEP)])
        .padding(0.25),
    [sortedData, boundsHeight]
  );

  const xScale = d3.scaleLinear().domain([0, max]).range([0, barMaxWidth]);
  const radiusScale = d3.scaleSqrt().domain([0, max]).range([0, 18]);
  const linkGenerator = d3.linkHorizontal();

  // ---- Helpers for the hover state ---------------------------------------------
  const isHovered = (country) => hovered === country;
  const isDimmed = (country) => hovered !== null && hovered !== country;

  // The same two handlers are attached to the bar row and to the circle,
  // so hovering either one highlights the whole country.
  const hoverProps = (country) => ({
    onMouseEnter: () => setHovered(country),
    onMouseLeave: () => setHovered(null),
    style: { cursor: "pointer" },
  });

  // ---- Shapes -------------------------------------------------------------
  const mapShapes = countries.features.map((feature, i) => (
    <path
      key={i}
      d={geoPathGenerator(feature)}
      fill={COLORS.land}
      stroke={COLORS.landStroke}
      strokeWidth={0.5}
    />
  ));

  // Draw the hovered line last so it sits on top of the others
  const linkOrder = hovered
    ? [
        ...sortedData.filter((d) => d.country !== hovered),
        ...sortedData.filter((d) => d.country === hovered),
      ]
    : sortedData;

  const links = linkOrder.map((d) => {
    const [x0, y0] = projection([d.lon, d.lat]);
    const y1 = yScale(d.country) + yScale.bandwidth() / 2;

    let opacity = 0.45;
    if (isHovered(d.country)) opacity = 1;
    if (isDimmed(d.country)) opacity = 0.08;

    return (
      <path
        key={d.country}
        d={linkGenerator({ source: [x0, y0], target: [LINK_END_X, y1] })}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={isHovered(d.country) ? 2.5 : 1.2}
        pointerEvents="none" // thin lines are hard to hover; let circles & bars do it
        style={{ strokeOpacity: opacity, transition: "stroke-opacity 0.2s" }}
      />
    );
  });

  const circles = sortedData.map((d) => {
    const [x, y] = projection([d.lon, d.lat]);
    return (
      <g
        key={d.country}
        {...hoverProps(d.country)}
        style={{
          ...hoverProps(d.country).style,
          opacity: isDimmed(d.country) ? 0.25 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <circle
          cx={x}
          cy={y}
          r={Math.max(radiusScale(d.students), 4)}
          fill={COLORS.accent}
          fillOpacity={isHovered(d.country) ? 0.35 : 0.15}
          stroke={COLORS.accent}
          strokeOpacity={0.8}
        />
        <circle cx={x} cy={y} r={1.8} fill={COLORS.accent} />
      </g>
    );
  });

  const bars = sortedData.map((d) => {
    const y = yScale(d.country);
    const h = yScale.bandwidth();
    const w = xScale(d.students);
    const gap = yScale.step() - h; // space between two bars

    return (
      <g
        key={d.country}
        {...hoverProps(d.country)}
        style={{
          ...hoverProps(d.country).style,
          opacity: isDimmed(d.country) ? 0.3 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {/* Invisible rectangle covering the whole row: a big, easy hover target */}
        <rect
          x={LINK_END_X}
          y={y - gap / 2}
          width={WIDTH - MARGIN.right - LINK_END_X}
          height={yScale.step()}
          fill="transparent"
        />
        <text
          x={LINK_END_X + 6}
          y={y + h / 2}
          dominantBaseline="middle"
          fontSize={12}
          fill={COLORS.label}
          fontWeight={isHovered(d.country) ? 700 : 400}
        >
          {d.country}
        </text>
        <rect x={BAR_START_X} y={y} width={w} height={h} fill={COLORS.bar} rx={2} />
        <text
          x={BAR_START_X + w + 5}
          y={y + h / 2}
          dominantBaseline="middle"
          fontSize={11}
          fill={isHovered(d.country) ? COLORS.label : COLORS.value}
        >
          {d.students}
        </text>
      </g>
    );
  });

  // Drawing order = stacking order: map, then lines, then circles and bars on top
  return (
    // viewBox = the internal drawing coordinates (1000 x 500).
    // width="100%" = stretch that drawing to fill the container,
    // keeping the proportions. Everything scales together: map, lines, bars, text.
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      style={{ display: "block", height: "auto" }}
    >
      <g transform={`translate(0,${MARGIN.top})`}>
        {mapShapes}
        {links}
        {circles}
        {bars}
      </g>
    </svg>
  );
};
