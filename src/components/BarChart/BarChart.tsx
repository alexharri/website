import "../../utils/chartjs";
import { Bar } from "react-chartjs-2";
import { useState } from "react";
import { ChartData, ChartDataset, GridLineOptions } from "chart.js";
import { useStyles } from "../../utils/styles";
import { BarChartStyles } from "./BarChart.styles";
import { colors, cssVariables } from "../../utils/cssVariables";
import { Toggle } from "../Toggle/Toggle";
import { usePostData } from "../../data/DataProvider";
import { useIsomorphicViewportWidth } from "../../utils/hooks/useViewportWidth";
import { invLerp, lerp } from "../../math/lerp";

interface Data2DEntry {
  label: string;
  values: Record<string, number>;
}

interface Data2DJson {
  keys: string[];
  colors: string[];
  total?: Record<string, number>;
  data: Data2DEntry[];
}

interface Data1DJson {
  keys: string[];
  data: number[];
  colors?: string[];
  total?: number;
}

interface Props {
  data: string;
  labelKey: string;
  minResponses?: number;
  normalize?: boolean;
  width?: number;
  height?: number;
  stacked?: boolean;
  horizontal?: boolean;
  percentage?: boolean;
  minWidth?: number;
  minHeight?: number;
}

function normalize2D(json: Data2DJson): Data2DJson {
  return {
    ...json,
    data: json.data.map((item) => ({
      ...item,
      values: normalizeValues(item.values, json.total?.[item.label]),
    })),
  };
}

function minResponses2D(json: Data2DJson, min: number) {
  return {
    ...json,
    data: json.data.filter((item) => totalResponses(item.values) >= min),
  };
}

function minResponses1D(json: Data1DJson, min: number) {
  const keys: typeof json.keys = [];
  const data: typeof json.data = [];
  for (let i = 0; i < json.keys.length; i++) {
    if (json.data[i] >= min) {
      keys.push(json.keys[i]);
      data.push(json.data[i]);
    }
  }
  return { ...json, data, keys };
}

function normalizeValues(values: Record<string, number>, total?: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof total !== "number") {
    total = 0;
    for (const value of Object.values(values)) total += value;
  } else {
  }

  for (const [key, value] of Object.entries(values)) out[key] = value / total;
  return out;
}

function totalResponses(values: Record<string, number>): number {
  let total = 0;
  for (const value of Object.values(values)) total += value;
  return total;
}

export function BarChart(props: Props) {
  const s = useStyles(BarChartStyles);
  const _json = usePostData<Data1DJson | Data2DJson>(props.data);
  const [normalize, setNormalize] = useState(props.normalize ?? false);

  let is2D = false;
  let yStyle: string | undefined = undefined;
  let total: number | null = null;

  let data: ChartData<"bar">;

  if (typeof _json.data[0] === "number") {
    let json = _json as Data1DJson;
    if (props.percentage) {
      yStyle = "percent";
    }

    if (props.minResponses) json = minResponses1D(json, props.minResponses);
    if (json.total != null) total = json.total;

    data = {
      labels: json.keys,
      datasets: [
        {
          data: json.data,
          backgroundColor: json.colors || "#399ef4",
        },
      ],
    };
  } else {
    is2D = true;
    let json = _json as Data2DJson;
    if (props.minResponses) json = minResponses2D(json, props.minResponses);
    if (normalize) {
      json = normalize2D(json);
      yStyle = "percent";
    } else if (props.percentage) {
      yStyle = "percent";
    }

    data = {
      labels: json.data.map((item) => item.label),
      datasets: json.keys.map((key, i) => {
        const dataset: ChartDataset<"bar"> = {
          label: key,
          data: json.data.map((item) => item.values[key]),
          backgroundColor: json.colors?.[i] ?? "red",
          ...(props.stacked
            ? {
                borderWidth: 1,
                borderColor: colors.background,
              }
            : {}),
        };
        return dataset;
      }),
    };
  }

  const displayLegend = is2D;
  const allowNormalize = is2D && !props.percentage;

  let defaultHeight = 400;
  if (props.horizontal) {
    const baseHeight = displayLegend ? 96 : 32;
    if (data.labels) {
      defaultHeight = baseHeight + data.labels.length * 32;
    } else {
      defaultHeight = baseHeight + data.datasets.length;
    }
  }

  let height = props.height ?? defaultHeight;
  let width = (props.width ?? cssVariables.contentWidth) + cssVariables.contentPadding * 2;
  const preferredWidth = width;

  const windowWidth = useIsomorphicViewportWidth();
  if (windowWidth != null && props.minWidth != null) {
    width = Math.min(
      width,
      Math.max(windowWidth - cssVariables.contentPadding * 2, props.minWidth),
    );
    if (props.minHeight != null) {
      const heightT = invLerp(props.minWidth, preferredWidth, width);
      height = lerp(props.minHeight, height, heightT);
    }
  }

  const aspectRatio = width / height;

  const valueAxisFormat: Intl.NumberFormatOptions = {
    style: yStyle,
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  };
  const gridLineOptions: Partial<GridLineOptions> = {
    color: colors.medium400,
  };

  return (
    <div className="chart">
      {allowNormalize && (
        <div className={s("controls")}>
          <Toggle checked={normalize} onValueChange={setNormalize}>
            Normalize
          </Toggle>
        </div>
      )}
      <div className={s("container")}>
        <div
          className={s("wrapper")}
          style={{ height, width: width + cssVariables.contentPadding * 2 }}
        >
          <div style={{ height, width }}>
            <Bar
              data={data}
              options={{
                aspectRatio,
                indexAxis: props.horizontal ? "y" : "x",
                scales: {
                  y: {
                    stacked: props.stacked,
                    ticks: {
                      color: colors.text700,
                      font: { family: cssVariables.fontFamily, size: 13 },
                      format: !props.horizontal ? valueAxisFormat : undefined,
                    },
                    grid: !props.horizontal ? gridLineOptions : undefined,
                  },
                  x: {
                    stacked: props.stacked,
                    ticks: {
                      color: colors.text,
                      font: { family: cssVariables.fontFamily, size: 13 },
                      format: props.horizontal ? valueAxisFormat : undefined,
                    },
                    grid: props.horizontal ? gridLineOptions : undefined,
                  },
                },
                plugins: {
                  tooltip: {
                    enabled: true,
                    mode: "point",
                    callbacks: {
                      footer:
                        total != null
                          ? (items) => {
                              const item = items[0];
                              const value = item.dataset.data[item.dataIndex] as number;
                              const percent = Number(((value / total!) * 100).toFixed(1)) + "%";
                              return `${percent} of respondents`;
                            }
                          : undefined,
                    },
                  },
                  legend: {
                    display: displayLegend,
                    position: "bottom",
                    labels: {
                      padding: 24,
                      color: colors.text,
                      font: { family: cssVariables.fontFamily, size: 13 },
                      boxWidth: 16,
                      boxHeight: 16,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
