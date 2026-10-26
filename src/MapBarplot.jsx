import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

// ---- Layout (all in pixels) ---------------------------------------------
const WIDTH = 1000;
const HEIGHT = 500;
const MARGIN = { top: 20, right: 40, bottom: 20, left: 10 };

const MAP_WIDTH = 530; // the map lives in x = MARGIN.left ... MAP_WIDTH
const LINK_END_X = 610; // where the lines arrive...
const NAME_X = LINK_END_X + 8; // ...and the country names start, left-aligned
const NUMBER_RIGHT_X = LINK_END_X + 168; // bold counts END here (right-aligned)
const BAR_START_X = LINK_END_X + 180; // bars start here
const ROW_STEP = 24; // fixed height per country row, so filtering doesn't create giant bars
const BAR_THICKNESS = 12; // bars are thinner than their row, for the rounded "pill" look

// Colours live in colors.js, shared with the overview chart.
// One accent colour (pink) ties each country's circle to its line.
// The map is deliberately quiet: it's context, not the main message.

// ---- Zoom areas ------------------------------------------------------------
// [west, south, east, north] in degrees of longitude / latitude.
// When a continent HAS students, the map zooms to fit their locations
// (see boxAroundPoints). These fixed boxes are only used for regions with no students yet.
const REGION_BOUNDS = {
  Europe: [-25, 34, 45, 71],
  "North America": [-170, 7, -50, 75],
  "South America": [-82, -56, -34, 13],
  Asia: [25, -11, 150, 60],
  Oceania: [110, -48, 180, 0],
  Africa: [-20, -36, 53, 38],
};

// Used in the "no students yet" message
const REGION_ADJECTIVES = {
  Europe: "European",
  "North America": "North American",
  "South America": "South American",
  Asia: "Asian",
  Oceania: "Oceanian",
  Africa: "African",
};

// A box around the students' locations, with some padding, and never too small
// (a single country would otherwise zoom in to a dot).
const boxAroundPoints = (rows) => {
  const lons = rows.map((d) => d.lon);
  const lats = rows.map((d) => d.lat);
  const MIN_LON_SPAN = 45;
  const MIN_LAT_SPAN = 28;
  const PAD = 8;
  let [w, e] = [d3.min(lons) - PAD, d3.max(lons) + PAD];
  let [s, n] = [d3.min(lats) - PAD, d3.max(lats) + PAD];
  if (e - w < MIN_LON_SPAN) {
    const mid = (w + e) / 2;
    [w, e] = [mid - MIN_LON_SPAN / 2, mid + MIN_LON_SPAN / 2];
  }
  if (n - s < MIN_LAT_SPAN) {
    const mid = (s + n) / 2;
    [s, n] = [mid - MIN_LAT_SPAN / 2, mid + MIN_LAT_SPAN / 2];
  }
  return [Math.max(w, -180), Math.max(s, -60), Math.min(e, 180), Math.min(n, 80)];
};

// Turns a [west, south, east, north] box into GeoJSON points along its edges.
// (Edges, not just corners: in Equal Earth the meridians are curved.)
const boxToGeo = ([w, s, e, n]) => {
  const coordinates = [];
  for (let lon = w; lon <= e; lon += 5) coordinates.push([lon, s], [lon, n]);
  for (let lat = s; lat <= n; lat += 5) coordinates.push([w, lat], [e, lat]);
  coordinates.push([e, s], [e, n]);
  return { type: "MultiPoint", coordinates };
};

const ZOOM_DURATION = 800; // ms

export const MapBarplot = ({
  data,
  geoData,
  maxValue,
  continent = "All", // the selected continent
  colors: COLORS, // the current theme's palette, from colors.js via App
}) => {
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

  // 1) TARGET VIEW: where the map should end up for the current selection.
  //    fitExtent finds the scale + translate that make a shape fill the map area:
  //    - "All": the whole world
  //    - a selection with students: a box around their locations, so the circles
  //      spread across the map area and line up nicely with the bars
  //    - a region with no students yet (Africa): that region's fixed box
  //    Equal Earth: an equal-area projection, so country sizes are honest.
  const targetView = useMemo(() => {
    let shape = countries;
    if (continent !== "All") {
      const box = data.length > 0 ? boxAroundPoints(data) : REGION_BOUNDS[continent];
      if (box) shape = boxToGeo(box);
    }
    const p = d3.geoEqualEarth().fitExtent(
      [
        [MARGIN.left, 0],
        [MAP_WIDTH, boundsHeight],
      ],
      shape
    );
    return { scale: p.scale(), translate: p.translate() };
  }, [continent, data, countries, boundsHeight]);

  // 2) CURRENT VIEW: what is drawn right now. During a zoom it moves,
  //    frame by frame, from the old view to the target view.
  const [view, setView] = useState(targetView);
  const viewRef = useRef(targetView); // same value, readable inside the animation

  useEffect(() => {
    // d3.interpolate builds a function: 0 -> start view, 1 -> target view
    const interpolate = d3.interpolate(viewRef.current, targetView);
    let frame;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / ZOOM_DURATION);
      const v = interpolate(d3.easeCubicInOut(t)); // ease = slow start & end
      // Copy into a NEW object, so React sees a change and re-renders
      const next = { scale: v.scale, translate: [...v.translate] };
      viewRef.current = next;
      setView(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame); // stop if the user clicks again mid-zoom
  }, [targetView]);

  // 3) The projection used for drawing is built from the current view
  const projection = useMemo(
    () => d3.geoEqualEarth().scale(view.scale).translate(view.translate),
    [view]
  );

  const geoPathGenerator = d3.geoPath().projection(projection);

  // ---- Scales -------------------------------------------------------------
  // maxValue comes from the FULL dataset, so bar lengths stay comparable
  // whichever continent is selected.
  const max = maxValue ?? d3.max(sortedData, (d) => d.students) ?? 0;

  // The bar block is centred vertically, so with only a few countries the bars
  // sit in the middle, level with the zoomed map, instead of hugging the top.
  const yScale = useMemo(() => {
    const blockHeight = Math.min(boundsHeight, sortedData.length * ROW_STEP);
    const top = (boundsHeight - blockHeight) / 2;
    return d3
      .scaleBand()
      .domain(sortedData.map((d) => d.country))
      .range([top, top + blockHeight])
      .padding(0.25);
  }, [sortedData, boundsHeight]);

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
        {/* Country name, left-aligned, right where its line arrives */}
        <text
          x={NAME_X}
          y={y + h / 2}
          dominantBaseline="middle"
          fontSize={15}
          fill={isHovered(d.country) ? COLORS.label : COLORS.value}
          fontWeight={isHovered(d.country) ? 600 : 400}
        >
          {d.country}
        </text>
        {/* Number of students: bold, right-aligned before the bar
            (same style as the percentages in the overview chart) */}
        <text
          x={NUMBER_RIGHT_X}
          y={y + h / 2}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize={16}
          fontWeight={700}
          fill={COLORS.label}
        >
          {d.students}
        </text>
        {/* Thin, pill-shaped bar, vertically centred in its row.
            rx = half the thickness -> fully rounded ends */}
        <rect
          x={BAR_START_X}
          y={y + (h - BAR_THICKNESS) / 2}
          width={w}
          height={BAR_THICKNESS}
          rx={BAR_THICKNESS / 2}
          fill={COLORS.bar}
        />
      </g>
    );
  });

  // ---- Empty state: a region with no students (yet!) --------------------
  // A dashed line leaves the region and ends at a message where the bars would be.
  let emptyState = null;
  const box = REGION_BOUNDS[continent];
  if (sortedData.length === 0 && box) {
    const [w, s, e, n] = box;
    const [cx, cy] = projection([(w + e) / 2, (s + n) / 2]); // centre of the continent
    const msgX = (LINK_END_X + WIDTH - MARGIN.right) / 2; // centre of the bar area
    const msgY = boundsHeight / 2;

    emptyState = (
      <g>
        <path
          d={linkGenerator({ source: [cx, cy], target: [LINK_END_X - 10, msgY] })}
          fill="none"
          stroke={COLORS.accent}
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
        {/* A gently pulsing dot: someone is on their way... */}
        <circle cx={cx} cy={cy} r={6} fill={COLORS.accent} fillOpacity={0.2}>
          <animate attributeName="r" values="6;18;6" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="fill-opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={3} fill={COLORS.accent} />

        <text x={msgX} y={msgY - 16} textAnchor="middle" fontSize={22} fill={COLORS.label}>
          Waiting for future students
        </text>
        <text x={msgX} y={msgY + 16} textAnchor="middle" fontSize={22} fill={COLORS.label}>
          from the{" "}
          <tspan fontStyle="italic" fontWeight={700} fill={COLORS.accent}>
            {REGION_ADJECTIVES[continent] ?? continent}
          </tspan>{" "}
          continent!
        </text>
      </g>
    );
  }

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
        {/* When zoomed in, countries extend beyond the map area.
            The clip path hides anything outside it, so the map never covers the bars. */}
        <defs>
          <clipPath id="map-clip">
            <rect
              x={MARGIN.left}
              y={0}
              width={MAP_WIDTH - MARGIN.left}
              height={boundsHeight}
            />
          </clipPath>
        </defs>
        <g clipPath="url(#map-clip)">{mapShapes}</g>
        {links}
        {circles}
        {bars}
        {emptyState}
      </g>
    </svg>
  );
};
