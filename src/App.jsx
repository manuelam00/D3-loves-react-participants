import { MapBarplot } from "./MapBarplot";
import { data } from "./data";
import worldData from "./world.json";
import "./chart.css";

export default function App() {
  return (
    <div className="chart-container">
      <h1 className="chart-title">
        Where do D3 loves React students come from?
      </h1>
      <p className="chart-subtitle">
        A snapshot of students from all over the world.
      </p>
      <MapBarplot data={data} geoData={worldData} />
    </div>
  );
}
