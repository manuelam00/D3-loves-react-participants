import { useMemo } from "react";
import * as d3 from "d3";

// ---- Layout (all in pixels) ---------------------------------------------
const WIDTH = 1000;
const HEIGHT = 500;
const MARGIN = { top: 20, right: 40, bottom: 20, left: 10 };

const MAP_WIDTH = 520; // the map lives in x = MARGIN.left ... MAP_WIDTH
const LINK_END_X = 640; // where the lines arrive, just left of the labels
const LABEL_WIDTH = 110; // room for "United Kingdom"
const BAR_START_X = LINK_END_X + LABEL_WIDTH; // bars start here

export const MapBarplot = ({ data, geoData }) => {
  const boundsHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const barMaxWidth = WIDTH - MARGIN.right - BAR_START_X;

  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.students - a.students),
    [data]
  );

  // ---- Map: remove Antarctica, then fit the projection into the map area ----
  const countries = useMemo(
    () => ({
      type: "FeatureCollection",
      features: geoData.features.filter(
        (f) => f.properties.name !== "Antarctica"
      ),
    }),
    [geoData]
  );

  // A projection turns [longitude, latitude] into [x, y] pixels
  const projection = useMemo(
    () =>
      d3.geoNaturalEarth1().fitExtent(
        [
          [MARGIN.left, 0],
          [MAP_WIDTH, boundsHeight],
        ],
        countries
      ),
    [countries, boundsHeight]
  );

  // geoPath turns a country shape into an SVG path string ("M...L...Z")
  const geoPathGenerator = d3.geoPath().projection(projection);

  // ---- Scales -------------------------------------------------------------
  const max = d3.max(sortedData, (d) => d.students) ?? 0;

  const yScale = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(sortedData.map((d) => d.country))
        .range([0, boundsHeight])
        .padding(0.25),
    [sortedData, boundsHeight]
  );

  const xScale = d3.scaleLinear().domain([0, max]).range([0, barMaxWidth]);

  // Circle area proportional to the value -> scaleSqrt for the radius
  const radiusScale = d3.scaleSqrt().domain([0, max]).range([0, 18]);

  // linkHorizontal builds a smooth S-shaped curve between two points
  const linkGenerator = d3.linkHorizontal();

  // ---- Shapes (plain JSX) -------------------------------------------------
  const mapShapes = countries.features.map((feature, i) => (
    <path
      key={i}
      d={geoPathGenerator(feature)}
      fill="#e6e6e6"
      stroke="#ffffff"
      strokeWidth={0.5}
    />
  ));

  const links = sortedData.map((d) => {
    const [x0, y0] = projection([d.lon, d.lat]);
    const y1 = yScale(d.country) + yScale.bandwidth() / 2;
    return (
      <path
        key={d.country}
        d={linkGenerator({ source: [x0, y0], target: [LINK_END_X, y1] })}
        fill="none"
        stroke="#c2185b"
        strokeOpacity={0.35}
        strokeWidth={1.2}
      />
    );
  });

  const circles = sortedData.map((d) => {
    const [x, y] = projection([d.lon, d.lat]);
    return (
      <g key={d.country}>
        <circle
          cx={x}
          cy={y}
          r={radiusScale(d.students)}
          fill="#999"
          fillOpacity={0.15}
          stroke="#999"
        />
        <circle cx={x} cy={y} r={1.5} fill="#222" />
      </g>
    );
  });

  const bars = sortedData.map((d) => {
    const y = yScale(d.country);
    const h = yScale.bandwidth();
    const w = xScale(d.students);
    return (
      <g key={d.country}>
        <text
          x={LINK_END_X + 6}
          y={y + h / 2}
          dominantBaseline="middle"
          fontSize={12}
        >
          {d.country}
        </text>
        <rect x={BAR_START_X} y={y} width={w} height={h} fill="#69b3a2" />
        <text
          x={BAR_START_X + w + 4}
          y={y + h / 2}
          dominantBaseline="middle"
          fontSize={11}
          fill="#555"
        >
          {d.students}
        </text>
      </g>
    );
  });

  // Drawing order = stacking order: map, then lines, then circles and bars on top
  return (
    <svg width={WIDTH} height={HEIGHT}>
      <g transform={`translate(0,${MARGIN.top})`}>
        {mapShapes}
        {links}
        {circles}
        {bars}
      </g>
    </svg>
  );
};
