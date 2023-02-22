import { ParseAxisToStackedBarChartData } from "@/parser/chart.parser";
import type {
  ChartData,
  ChartEvent,
  LegendElement,
  LegendItem,
} from "chart.js";
import { AnnotationOptions } from "chartjs-plugin-annotation";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import ChartDetail from "./chart-detail";

interface IProps {
  xAxisList: string[];
  yAxisList: Array<Record<string, string>>;
  xAxisDisplayNameMap: Record<string, string>;
  legendDisplayMap: Record<string, Array<Record<string, string>>>;
  total: number;

  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisUnit: string;

  aspectRatio?: number;
  convertFunc: (value: number) => [number, string, string];
}

const EnergyVisualizeStackedBarChart: FC<IProps> = ({
  xAxisList,
  yAxisList,
  xAxisLabel,
  yAxisLabel,
  yAxisUnit,
  total,
  xAxisDisplayNameMap,
  legendDisplayMap,
  aspectRatio,
  convertFunc,
}: IProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetAxisY, setTargetAxisY] = useState<number>(0);
  const [calTotal, setCalTotal] = useState(total);

  const chartData: ChartData<"bar", number[]> = useMemo(
    () => ParseAxisToStackedBarChartData(xAxisList, yAxisList),
    [xAxisList, yAxisList]
  );
  const [convertedTotal, fromUnit, toUnit]: [number, string, string] = useMemo(
    () => convertFunc(calTotal),
    [calTotal, convertFunc]
  );
  const annotations: AnnotationOptions[] = useMemo(() => {
    if (targetAxisY === 0) {
      return [];
    }

    return [
      {
        type: "line",
        yMin: targetAxisY,
        yMax: targetAxisY,
        borderWidth: 3,
        borderColor: "yellow",
      },
    ];
  }, [targetAxisY]);
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

    return targetAxisY < maxAxisY ? maxAxisY : targetAxisY;
  }, [targetAxisY, yAxisList]);

  function customOnClickHandle(
    e: ChartEvent,
    legendItem: LegendItem,
    legend: LegendElement<"bar">
  ) {
    const index = legendItem.datasetIndex;
    const ci = legend.chart;
    if (ci.isDatasetVisible(index!)) {
      ci.hide(index!);
      legendItem.hidden = true;
    } else {
      ci.show(index!);
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
  }

  useEffect(() => {
    setCalTotal(total);
  }, [total]);

  return (
    <div className="relative w-full p-4 ml-2 border border-black flex">
      <div className="absolute rounded ml-2 mb-4" ref={tooltipRef}></div>
      <div className="w-4/5">
        <Bar
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
                    return indexArr.map((i) => {
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
                    console.log(tooltipRef.current.clientHeight);
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
                  label: (context) => {
                    const label = `${
                      xAxisDisplayNameMap[context.dataset.label!]
                    } : ${context.parsed.y.toFixed(3)} ${yAxisUnit}`;
                    return label;
                  },
                },
              },
            },
          }}
          data={chartData}
        />
      </div>
      <div className="w-1/5 px-4">
        <ChartDetail
          totalLine1Text={fromUnit}
          totalLine1={calTotal}
          totalLine2Text={toUnit}
          totalLine2={convertedTotal}
          targetAxisY={targetAxisY}
          onTargetAxisChange={setTargetAxisY}
        />
      </div>
    </div>
  );
};

export default EnergyVisualizeStackedBarChart;
