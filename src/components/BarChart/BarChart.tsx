import "../../utils/chartjs";
import { Bar } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { ChartData, ChartDataset, GridLineOptions } from "chart.js";
import { useStyles } from "../../utils/styles";
import { BarChartStyles } from "./BarChart.styles";
import { colors, cssVariables } from "../../utils/cssVariables";

interface Data2DEntry {
  label: string;
  values: Record<string, number>;
}

interface Data2DJson {
  keys: string[];
  colors: string[];
  data: Data2DEntry[];
}

interface Data1DJson {
  keys: string[];
  data: number[];
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
}

function normalize(json: Data2DJson): Data2DJson {
  return {
    ...json,
    data: json.data.map((item) => ({ ...item, values: normalizeValues(item.values) })),
  };
}

function minResponses2D(json: Data2DJson, min: number) {
  return {
    ...json,
    data: json.data.filter((item) => totalResponses(item.values) > min),
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
  console.log({ keys, data, json });
  return { ...json, data, keys };
}

function normalizeValues(values: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  let total = 0;
  for (const value of Object.values(values)) total += value;
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
  const [_json, setJson] = useState<Data2DJson | Data1DJson | null>(null);

  useEffect(() => {
    const get = async () => {
      try {
        const data = await fetch(`/data/${props.data}.json`).then((res) => res.json());
        setJson(data);
      } catch (e) {
        // TODO: handle
        console.error(e);
      }
    };
    get();
  }, []);

  if (!_json) return <p>Loading</p>;

  let yStyle: string | undefined = undefined;
  let displayLegend = false;
  let total: number | null = null;

  let data: ChartData<"bar">;

  if (typeof _json.data[0] === "number") {
    let json = _json as Data1DJson;

    if (props.minResponses) json = minResponses1D(json, props.minResponses);
    if (json.total != null) total = json.total;

    data = {
      labels: json.keys,
      datasets: [
        {
          data: json.data,
          backgroundColor: "#399ef4",
        },
      ],
    };
  } else {
    displayLegend = true;
    let json = _json as Data2DJson;
    if (props.minResponses) json = minResponses2D(json, props.minResponses);
    if (props.normalize) {
      json = normalize(json);
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

  const height = props.height ?? 400;
  const width = (props.width ?? cssVariables.contentWidth) + cssVariables.contentPadding * 2;
  const aspectRatio = width / height;

  const valueAxisFormat: Intl.NumberFormatOptions = {
    style: yStyle,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  };
  const gridLineOptions: Partial<GridLineOptions> = {
    color: colors.medium400,
  };

  return (
    <div className={s("container")}>
      <div className={s("inner")} style={{ height, width }}>
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
                          return `Used by ${percent} of respondents`;
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
  );
}
