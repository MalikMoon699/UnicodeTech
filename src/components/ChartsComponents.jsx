import React from "react";
import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Loader from "./Loader";

const pieColors = [
  "#FFCE56",
  "var(--status-approved)",
  "var(--status-rejected)",
  "#00CED1",
  "#8A2BE2",
  "#FF7F50",
  "#FFD700",
];

const renderYAxisTick = ({ x, y, payload }) => {
  const value = payload.value;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="var(--muted-foreground)"
        style={{
          fontSize: 12,
        }}
      >
        {value.length > 12 ? value.slice(0, 12) + "..." : value}
      </text>
    </g>
  );
};

const getNumericKeys = (data) => {
  if (!data?.length) return [];
  return Object.keys(data[0]).filter((key) => typeof data[0][key] === "number");
};

const getCategoryKey = (data) => {
  if (!data?.length) return "";

  return Object.keys(data[0]).find((key) => typeof data[0][key] === "string");
};

export const AreaChart = ({ data, height = 220, width = "100%" }) => {
  const xKey = getCategoryKey(data);
  const Keys = getNumericKeys(data);

  const colors = {
    Leave: {
      stroke: "var(--primary)",
      fill: "#6c62d558",
    },
    Present: {
      stroke: "var(--status-approved)",
      fill: "#22c55e48",
    },
    NewArrival: {
      stroke: "var(--status-approved)",
      fill: "#22c55e48",
    },
    Absent: {
      stroke: "var(--status-rejected)",
      fill: "#e64d4d5e",
    },
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <ReAreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip
          cursor={{ fill: "var(--primary-hover)" }}
          contentStyle={{
            fontWeight: 600,
            borderRadius: 12,
            padding: "12px",
            background: "var(--card)",
            color: "var(--card-foreground)",
            border: "1px solid var(--border)",
            boxShadow: "0 10px 25px var(--primary-hover)",
            minWidth: "180px",
          }}
        />
        {Keys.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[key]?.stroke || "var(--primary)"}
            fill={colors[key]?.fill || "#6c62d558"}
            strokeWidth={2}
            fillOpacity={0.2}
          />
        ))}
      </ReAreaChart>
    </ResponsiveContainer>
  );
};

export const BarChart = ({ data, height = 220, width = "100%" }) => {
  const xKey = getCategoryKey(data);
  const keys = getNumericKeys(data);

  const colors = {
    fail: "var(--status-rejected)",
    success: "var(--status-approved)",
    sent: "var(--primary)",
    ravenue: "var(--status-approved)",
    credits: "var(--primary)",
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <ReBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip
          cursor={{ fill: "var(--primary-hover)" }}
          contentStyle={{
            fontWeight: 600,
            borderRadius: 12,
            padding: "12px",
            background: "var(--card)",
            color: "var(--card-foreground)",
            border: "1px solid var(--border)",
            boxShadow: "0 10px 25px var(--primary-hover)",
            minWidth: "180px",
          }}
        />
        <Legend />

        {keys.map((key) => (
          <Bar
            key={key}
            radius={[4, 4, 0, 0]}
            animationDuration={2000}
            animationBegin={300}
            dataKey={key}
            fill={colors[key] || "var(--primary)"}
          />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
};

export const PieChart = ({ data, height = 220, width = "100%" }) => {
  const dataKey = getNumericKeys(data)[0];
  const nameKey = getCategoryKey(data);

  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);
  const allZero = total === 0;

  const chartData = allZero ? [{ [nameKey]: "No Data", [dataKey]: 1 }] : data;

  const COLORS = pieColors;

  return (
    <div style={{ width: "100%" }}>
      <div
        className="pie-chart-divid"
        style={{ display: "flex", gap: "20px", alignItems: "center" }}
      >
        <div style={{ flex: 1 }}>
          <ResponsiveContainer minWidth="180px" width={width} height={height}>
            <RePieChart>
              <Pie
                data={chartData}
                dataKey={dataKey}
                nameKey={nameKey}
                outerRadius={90}
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={allZero ? "#dcdcdc" : COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;

                    return (
                      <div
                        style={{
                          background: "var(--card)",
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1px solid var(--border)",
                          boxShadow: "0 10px 25px var(--primary-hover)",
                          fontWeight: 600,
                          minWidth: "160px",
                        }}
                      >
                        <div style={{ marginBottom: "6px" }}>
                          {item[nameKey] || "N/A"}
                        </div>
                        <div>Count: {!allZero ? item[dataKey] : 0}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RePieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, width: "100%", marginLeft: "30px" }}>
          {data.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
                fontWeight: 600,
                color: "var(--muted-foreground)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "3px",
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
                <span>{item[nameKey]}</span>
              </div>

              <span>{item[dataKey]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const BarVerticalChart = ({ data, height = 220, width = "100%" }) => {
  const xKey = getCategoryKey(data);
  const keys = getNumericKeys(data);

  const colors = {
    fail: "var(--status-rejected)",
    success: "var(--status-approved)",
    sent: "var(--primary)",
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      <ReBarChart layout="vertical" data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis
          type="category"
          dataKey={xKey}
          width={100}
          tick={renderYAxisTick}
        />
        <Tooltip
          cursor={{ fill: "var(--primary-hover)" }}
          contentStyle={{
            fontWeight: 600,
            borderRadius: 12,
            padding: "12px",
            background: "var(--card)",
            color: "var(--card-foreground)",
            border: "1px solid var(--border)",
            boxShadow: "0 10px 25px var(--primary-hover)",
            minWidth: "180px",
          }}
        />
        <Legend />

        {keys.map((key) => (
          <Bar
            key={key}
            radius={[0, 8, 8, 0]}
            animationDuration={2000}
            animationBegin={300}
            dataKey={key}
            fill={colors[key] || "var(--primary)"}
          />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
};

export const ChartRenderer = ({ data, type, height = 220, width = "100%" }) => {
  switch (type) {
    case "area":
      return <AreaChart data={data} height={height} width={width} />;
    case "bar":
      return <BarChart data={data} height={height} width={width} />;
    case "v-bar":
      return <BarVerticalChart data={data} height={height} width={width} />;
    case "pie":
      return <PieChart data={data} height={height} width={width} />;
    default:
      return <div>Invalid chart type</div>;
  }
};

export const ChartCard = ({
  title = "",
  chartType = "",
  ChartData = [],
  contentStyle = {},
  loading = false,
  height = 220,
  width = "100%",
}) => {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2>{title}</h2>
      </div>
      <div style={contentStyle} className="chart-content-cotainer">
        {loading ? (
          <Loader style={{ height, width }} />
        ) : (
          <ChartRenderer
            data={ChartData}
            type={chartType}
            height={height}
            width={width}
          />
        )}
      </div>
    </div>
  );
};
