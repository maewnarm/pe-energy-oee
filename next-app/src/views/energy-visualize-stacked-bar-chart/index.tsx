import { ParseAxisToStackedBarChartData } from "@/parser/chart.parser";
import { Switch } from "antd";
import type {
  ChartData,
  ChartEvent,
  Chart as ChartJS,
  LegendElement,
  LegendItem,
} from "chart.js";
import { AnnotationOptions } from "chartjs-plugin-annotation";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Chart } from "react-chartjs-2";
import ChartDetail from "./chart-detail";

interface IProps {
  xAxisList: string[];
  yAxisList: Array<Record<string, string>>;
  y1AxisList?: number[];
  xAxisDisplayNameMap: Record<string, string>;
  legendDisplayMap: Record<string, Array<Record<string, string>>>;
  total: number;

  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisUnit: string;
  y1AxisLabel?: string;
  y1AxisUnit?: string;
  y1AxisMultiplier?: number;

  aspectRatio?: number;
  convertFunc: (value: number) => [number, string, string];
}

const EnergyVisualizeStackedBarChart: FC<IProps> = ({
  xAxisList,
  yAxisList,
  y1AxisList,
  xAxisLabel,
  yAxisLabel,
  yAxisUnit,
  y1AxisLabel,
  y1AxisUnit,
  y1AxisMultiplier,
  total,
  xAxisDisplayNameMap,
  legendDisplayMap,
  aspectRatio,
  convertFunc,
}: IProps) => {
  const chartRef = useRef<ChartJS>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetAxisY, setTargetAxisY] = useState<number>(0);
  const [targetAxisY1, setTargetAxisY1] = useState<number>(0);
  const [calTotal, setCalTotal] = useState(total);
  const [perTotal, setPerTotal] = useState(0);
  const [isBarShow, setIsBarShow] = useState(true);
  const [isLineShow, setIsLineShow] = useState(true);

  const chartData: ChartData<"bar" | "line", number[]> = useMemo(
    () =>
      ParseAxisToStackedBarChartData(
        xAxisList,
        yAxisList,
        y1AxisList,
        y1AxisMultiplier
      ),
    [xAxisList, yAxisList, y1AxisList]
  );
  const [convertedTotal, fromUnit, toUnit]: [number, string, string] = useMemo(
    () => convertFunc(calTotal),
    [calTotal, convertFunc]
  );
  const annotations: AnnotationOptions[] = useMemo(() => {
    const annos: AnnotationOptions[] = [];
    if (targetAxisY !== 0) {
      annos.push({
        label: {
          display: true,
          content: `${yAxisLabel} = ${targetAxisY} ${yAxisUnit}`,
          backgroundColor: "transparent",
          color: "red",
          textAlign: "left",
          position: "start",
          font: {
            size: 14,
          },
          yAdjust: -10,
        },
        yScaleID: "y",
        type: "line",
        yMin: targetAxisY,
        yMax: targetAxisY,
        borderWidth: 3,
        borderColor: "red",
      });
    }

    if (targetAxisY1 !== 0) {
      annos.push({
        label: {
          display: true,
          content: `${y1AxisLabel} = ${targetAxisY1} ${y1AxisUnit}`,
          backgroundColor: "transparent",
          color: "orange",
          textAlign: "right",
          position: "end",
          font: {
            size: 14,
          },
          yAdjust: -10,
        },
        yScaleID: "y1",
        type: "line",
        yMin: targetAxisY1,
        yMax: targetAxisY1,
        borderWidth: 3,
        borderColor: "orange",
        borderDash: [8, 2],
      });
    }

    return annos;
  }, [targetAxisY, targetAxisY1]);

  const yAxisMax: number | undefined = useMemo(() => {
    if (targetAxisY === 0) {
      return undefined;
    }

    const maxAxisY = Math.max(
      ...yAxisList.map((yAxis) =>
        Object.values(yAxis).reduce(
          (prev, cur) => (+cur > 0 ? prev + +cur : prev),
          0
        )
      )
    );

    return Math.round((targetAxisY < maxAxisY ? maxAxisY : targetAxisY) * 1.1);
  }, [targetAxisY, yAxisList]);

  const y1Total: number | undefined = useMemo(
    () => y1AxisList?.reduce((acc, cur) => acc + cur, 0),
    [y1AxisList]
  );

  const y1AxisMax: number | undefined = useMemo(() => {
    if (targetAxisY1 === 0) {
      return undefined;
    }

    const flatData: any[] =
      chartRef.current?.data.datasets
        .filter((d) => d.type === "line")
        .map((d1) => d1.data.map((v) => v))
        .flat() || ([] as number[]);

    const maxAxisY1 = Math.max(...(flatData ?? []));

    return Math.round(
      (targetAxisY1 < maxAxisY1 ? maxAxisY1 : targetAxisY1) * 1.1
    );
  }, [targetAxisY1, y1AxisList]);

  function customOnClickHandle(
    e: ChartEvent,
    legendItem: LegendItem,
    legend: LegendElement<"bar" | "line">
  ) {
    const index = legendItem.datasetIndex;
    const ci = legend.chart;
    const legendLabel = ci.getDatasetMeta(index!).label;
    const indexLine = legend.chart.data.datasets.findIndex(
      (data) => data.type === "line" && data.label === legendLabel
    );
    if (ci.isDatasetVisible(index!)) {
      ci.hide(index!);
      ci.hide(indexLine);
      legendItem.hidden = true;
    } else {
      ci.show(index!);
      ci.show(indexLine);
      legendItem.hidden = false;
    }
    // get hidden = true items
    const showedLegends =
      // @ts-expect-error
      legend.legendItems?.filter((l) => !l.hidden).map((l) => l.dataId) || [];
    // re-calculate only showed
    const newTotal = yAxisList.reduce((acc, el) => {
      const sum = Object.entries(el).reduce(
        (a, [k, v]) => a + (showedLegends.includes(k) ? Number(v) : 0),
        0
      );
      return acc + sum;
    }, 0);
    setCalTotal(newTotal);
    if (y1AxisList && y1AxisMultiplier && y1Total) {
      setPerTotal((newTotal * y1AxisMultiplier) / y1Total);
    }
  }

  useEffect(() => {
    setCalTotal(total);
    if (y1AxisList && y1AxisMultiplier && y1Total) {
      setPerTotal((total * y1AxisMultiplier) / y1Total);
    }
  }, [total]);

  useEffect(() => {
    chartRef.current?.data.datasets.forEach((d, idx) => {
      if (d.type !== "line") {
        isBarShow ? chartRef.current?.show(idx) : chartRef.current?.hide(idx);
      }
    });
  }, [isBarShow]);

  useEffect(() => {
    chartRef.current?.data.datasets.forEach((d, idx) => {
      if (d.type === "line") {
        isLineShow ? chartRef.current?.show(idx) : chartRef.current?.hide(idx);
      }
    });
  }, [isLineShow]);

  return (
    <div className="relative w-full p-4 ml-2 border border-black flex">
      <div className="absolute rounded ml-2 mb-4" ref={tooltipRef}></div>
      <div className="w-4/5">
        <div className="flex w-fit ml-auto mb-2">
          <span className="mr-1">Power consumption :</span>
          <Switch
            checkedChildren="show"
            unCheckedChildren="hide"
            checked={isBarShow}
            onChange={(checked) => setIsBarShow(checked)}
          />
          <span className="ml-5 mr-1">Power consumption per piece :</span>
          <Switch
            checkedChildren="show"
            unCheckedChildren="hide"
            checked={isLineShow}
            onChange={(checked) => setIsLineShow(checked)}
          />
        </div>
        <Chart
          ref={chartRef}
          type="bar"
          options={{
            indexAxis: "x" as const,
            scales: {
              x: {
                beginAtZero: true,
                stacked: true,
                title: {
                  display: !!xAxisLabel,
                  text: xAxisLabel,
                  color: "black",
                  font: {
                    weight: "bold",
                  },
                },
              },
              y: {
                stacked: true,
                max: yAxisMax,
                title: {
                  display: !!yAxisLabel,
                  text: yAxisLabel,
                  color: "black",
                  font: {
                    weight: "bold",
                    size: 15,
                  },
                },
              },
              y1: {
                type: "linear",
                beginAtZero: true,
                max: y1AxisMax,
                display: true,
                position: "right",
                grid: {
                  borderDash: [8, 2],
                },
                title: {
                  display: !!y1AxisLabel,
                  text: y1AxisLabel,
                  color: "black",
                  font: {
                    weight: "bold",
                    size: 15,
                  },
                },
              },
            },
            aspectRatio,
            responsive: true,
            plugins: {
              legend: {
                position: "bottom" as const,
                labels: {
                  generateLabels(chart) {
                    const datasets = chart.data.datasets;
                    const dataLength = datasets.length;
                    const {
                      labels: {
                        usePointStyle,
                        pointStyle,
                        textAlign,
                        color,
                        // useBorderRadius,
                        // borderRadius,
                      },
                    } = chart.legend!.options;
                    const indexArr = Array.apply(null, Array(dataLength)).map(
                      (_, i) => i
                    );
                    return indexArr
                      .filter(
                        (idx) => chart.getDatasetMeta(idx).yAxisID !== "y1"
                      )
                      .map((i) => {
                        const meta = chart.getDatasetMeta(i);
                        const style = meta.controller.getStyle(0, false);
                        const borderWidth = style.borderWidth as number;

                        return {
                          text: datasets[meta.index].label
                            ? xAxisDisplayNameMap[datasets[meta.index].label!]
                            : "",
                          // extra data key
                          dataId: datasets[meta.index].label,
                          fillStyle: style.backgroundColor,
                          fontColor: color,
                          hidden: !meta.visible,
                          lineCap: style.borderCapStyle,
                          lineDash: style.borderDash,
                          lineDashOffset: style.borderDashOffset,
                          lineJoin: style.borderJoinStyle,
                          lineWidth: (borderWidth + borderWidth) / 4,
                          strokeStyle: style.borderColor,
                          pointStyle: pointStyle || style.pointStyle,
                          rotation: style.rotation,
                          textAlign: textAlign || style.textAlign,
                          datasetIndex: meta.index,
                        } as LegendItem;
                      });
                  },
                },
                onHover: function (event, legendItem, legend) {
                  if (tooltipRef.current) {
                    tooltipRef.current.innerHTML =
                      // @ts-expect-error
                      legendDisplayMap[legendItem.dataId]
                        .map((t) => `${t.mc_no} [${t.mc_name}]`)
                        .join("\n") ?? legendItem;
                    tooltipRef.current.style.display = "flex";
                    tooltipRef.current.style.padding = "2px 8px";
                    tooltipRef.current.style.background = "#000000de";
                    tooltipRef.current.style.color = "white";
                    // console.log(tooltipRef.current.clientHeight);
                    tooltipRef.current.style.left = `${(event.x ?? 0) + 15}px`;
                    tooltipRef.current.style.top = `${
                      (event.y ?? 0) + 5 - tooltipRef.current.clientHeight
                    }px`;
                    tooltipRef.current.style.whiteSpace = "pre-line";
                  }
                },
                onLeave: function () {
                  if (tooltipRef.current) {
                    tooltipRef.current.innerHTML = "";
                    tooltipRef.current.style.display = "none";
                  }
                },
                onClick: customOnClickHandle,
              },
              title: {
                display: false,
              },
              annotation: {
                annotations,
              },
              tooltip: {
                callbacks: {
                  title: (items) =>
                    `${items[0].label} = ${
                      y1AxisList ? y1AxisList[items[0].dataIndex] : 0
                    } pcs.`,
                  label: (context) => {
                    const label =
                      context.dataset.yAxisID === "y"
                        ? `${
                            xAxisDisplayNameMap[context.dataset.label!]
                          } : ${context.parsed.y.toFixed(3)} ${yAxisUnit}`
                        : `${
                            xAxisDisplayNameMap[context.dataset.label!]
                          } : ${context.parsed.y.toFixed(3)} ${y1AxisUnit}`;
                    return label;
                  },
                },
              },
            },
            animation: false,
          }}
          data={chartData}
        />
      </div>
      <div className="w-1/5 px-4">
        <ChartDetail
          totalLine1Text={fromUnit}
          totalLine1={calTotal}
          perUnitText={`[${y1Total?.toLocaleString(
            "en-US"
          )} pcs./M] ${y1AxisUnit}`}
          perUnit={perTotal}
          totalLine2Text={toUnit}
          totalLine2={convertedTotal}
          targetAxisY={targetAxisY}
          onTargetAxisYChange={setTargetAxisY}
          targetAxisY1={targetAxisY1}
          onTargetAxisY1Change={setTargetAxisY1}
        />
      </div>
    </div>
  );
};

export default EnergyVisualizeStackedBarChart;
