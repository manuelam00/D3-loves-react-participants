// "Data and Methods" + "Learning Process and Special Thanks",
// built like the footer of the Chinese radicals explorer.
// The texts contain links, so they are written as JSX (<>…</>), one paragraph each.

const URL = {
  github: "https://github.com/manuelam00/first-D3-project",
  course: "https://www.react-graph-gallery.com/react-d3-dataviz-course",
  yan: "https://www.yan-holtz.com/",
  // Equal Earth: UN General Assembly, 4 September 2026
  unNews: "https://news.un.org/en/story/2026/09/1168284",
  unResolution: "https://docs.un.org/en/A/80/L.104",
  trueSize: "https://www.thetruesize.com/",
  // Continents
  isoFile: "https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes",
  m49: "https://unstats.un.org/unsd/methodology/m49/",
  // Map shapes
  worldGeojson:
    "https://github.com/holtzy/D3-graph-gallery/blob/master/DATA/world.geojson",
  // Inspiration
  hesham:
    "https://public.tableau.com/app/profile/hesham3827/viz/TheGlobalJourneyofRefugees/TheGlobalJourneyofRefugees",
};

const DATA = [
  <>
    Countries are grouped into 5 regions and 17 sub-regions with the{" "}
    <a href={URL.isoFile}>ISO 3166 country list with regional codes</a>, which
    follows the <a href={URL.m49}>UN M49 standard</a>.
  </>,
  <>
    The world map uses the <a href={URL.worldGeojson}>world GeoJSON</a> from the
    D3 Graph Gallery, drawn with the Equal Earth projection: an equal-area
    projection, so countries keep their true relative size. In September 2026
    the UN General Assembly <a href={URL.unNews}>endorsed Equal Earth</a> for
    world maps (to see how much the usual Mercator map distorts sizes, try{" "}
    <a href={URL.trueSize}>The True Size Of</a>).
  </>,
];

const LEARN = [
  <>
    I built this explorer to practice React and D3 during{" "}
    <a href={URL.course}>Yan Holtz's D3 ❤️ React course</a>.
  </>,
  <>
    The layout, with bars feeding lines into the map, is inspired by{" "}
    <a href={URL.hesham}>The Global Journey of Refugees</a> by Hesham Eissa, the
    winning viz of Tableau's Iron Viz 2019. It is one of the best-known pieces
    in the Tableau Community, my favorite software.
  </>,
  <>
    I developed the components with support from Claude, which I used as a
    coding tutor. The code is on <a href={URL.github}>GitHub</a>.
  </>,
];

export const Footer = () => (
  <>
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <h3>Data and Methods</h3>
          {DATA.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div>
          <h3>Learning Process and Special Thanks</h3>
          {LEARN.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </footer>

    {/* Outside the box, centred */}
    <p className="site-credit">
      Manuela M. 2026 for <a href={URL.course}>react-d3-dataviz-course</a>
    </p>
  </>
);
