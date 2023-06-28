import { fetchEnergyFactoryDay } from "@/actions/energy-factory.action";
import { fetchProductVolumeMonthly } from "@/actions/lineinfo.actions";
import Layout from "@/components/layout";
import { EnergySettingStore, FactoryEnergyStore } from "@/store";
import { CommonStore } from "@/store/common.store";
import { LineInfoStore } from "@/store/lineinfo.store";
import { createIntervalTimestamp } from "@/util/timerange";
import EnergyVisualizeSelection from "@/views/energy-visualize-selection";
import { Button, Card, Divider, InputNumber, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import Head from "next/head";
import React, { useEffect, useMemo, useState } from "react";
import { Chart } from "react-chartjs-2";
import { HiOutlineRefresh } from "react-icons/hi";

dayjs.extend(isBetween);

const PerUnit = () => {
  const [selectedProduct, selectedProductLine, selectedDate] =
    EnergySettingStore((state) => [
      state.selectedProduct,
      state.selectedProductLine,
      state.selectedDate,
    ]);
  const [prodVolumePlan, prodVolumeActual] = LineInfoStore((state) => [
    state.prodVolumePlan,
    state.prodVolumeActual,
  ]);
  const [factoryData] = FactoryEnergyStore((state) => [state.factoryData]);
  const setIsLoading = CommonStore.getState().setIsLoading;
  let prodVolumeController: AbortController;
  let FactoryEnergyController: AbortController;
  const [chartDataEnergy, setChartDataEnergy] = useState<number[]>([]);
  const [chartDataPerUnitActual, setChartDataPerUnitActual] = useState<
    number[]
  >([]);
  const [chartDataPerUnitPlan, setChartDataPerUnitPlan] = useState<number[]>(
    []
  );
  const [sumData, setSumData] = useState("-");
  const [target, setTarget] = useState(0);
  const [prodVolume, setProdVolume] = useState<[number, number]>([0, 0]);
  const [perUnitData, setPerUnitData] = useState<[string, string]>(["-", "-"]);
  const [perUnitUnit, setPerUnitUnit] = useState("kWh");
  const [isChanged, setIsChanged] = useState(false);
  const [intervalTimestamp, setIntervalTimestamp] = useState<Dayjs[]>([]);

  const getData = async () => {
    setIsChanged(false);
    if (
      selectedProduct !== "" &&
      selectedProductLine !== "" &&
      selectedDate !== ""
    ) {
      setIsLoading(true);

      setIntervalTimestamp(
        createIntervalTimestamp(
          15,
          "m",
          dayjs(selectedDate).startOf("d"),
          dayjs(selectedDate).endOf("d")
        )
      );

      prodVolumeController = new AbortController();
      await fetchProductVolumeMonthly(
        selectedProduct,
        selectedProductLine,
        selectedDate,
        {
          signal: prodVolumeController.signal,
        }
      );

      FactoryEnergyController = new AbortController();
      await fetchEnergyFactoryDay(
        selectedProduct,
        selectedProductLine,
        selectedDate,
        {
          signal: FactoryEnergyController.signal,
        }
      );

      setIsLoading(false);
    } else {
      message.error("Please complete a Product, Line and Date selection");
    }
  };

  const targetPowerChange = (value: number | null) => {
    if (!value) return;
    setTarget(value);
  };

  useEffect(() => {
    return () => {
      prodVolumeController?.abort();
      FactoryEnergyController?.abort();
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    setIsChanged(true);
  }, [selectedProduct, selectedProductLine, selectedDate]);

  useEffect(() => {
    console.log(prodVolumePlan, prodVolumeActual);
    const date = dayjs(selectedDate).date();
    setProdVolume([
      prodVolumeActual[date - 1] || 0,
      prodVolumePlan[date - 1] || 0,
    ]);
  }, [prodVolumePlan, prodVolumeActual]);

  useEffect(() => {
    console.log(intervalTimestamp, factoryData);
    let cData: number[] = [];
    intervalTimestamp.forEach((ts, idx) => {
      if (idx === 0) return;
      const st = intervalTimestamp[idx - 1];
      const vals = factoryData
        .filter((data) => dayjs(data.logtime_).isBetween(st, ts, "m", "[)"))
        .map((d) => d.value);
      const avg = vals.reduce((sum, val) => sum + val / 1000, 0) / vals.length;
      cData.push(avg || 0);
    });
    console.log(cData);
    setChartDataEnergy(cData);
    const sum = cData
      .reduce((sum, val) => sum + val, 0)
      .toLocaleString("en-US", { maximumFractionDigits: 2 });
    setSumData(sum);
    // TODO add per unit line
    // TODO add plan/actual energy bar
    // TODO add monthly chart
  }, [intervalTimestamp, factoryData]);

  useEffect(() => {
    let perUnitActual = 0;
    let perUnitPlan = 0;
    let unit = "Wh";
    if (prodVolume[0] > 0) {
      perUnitActual = (Number(sumData) / prodVolume[0]) * 1000; // convert to Wh
    }
    if (prodVolume[1] > 0) {
      perUnitPlan = (target / prodVolume[1]) * 1000; //convert to Wh
    }
    console.log(sumData, prodVolume, perUnitActual, perUnitPlan);
    if (
      (perUnitActual < 0.001 && perUnitActual !== 0) ||
      (perUnitPlan < 0.001 && perUnitPlan !== 0)
    ) {
      // convert to milli Wh
      perUnitActual *= 1000;
      perUnitPlan *= 1000;
      unit = "mWh";
    } else if (
      (perUnitActual > 10000 && perUnitActual !== 0) ||
      (perUnitPlan > 10000 && perUnitPlan !== 0)
    ) {
      // convert to kWh
      perUnitActual /= 1000;
      perUnitPlan /= 1000;
      unit = "kWh";
    } else if (
      (perUnitActual > 1000000 && perUnitActual !== 0) ||
      (perUnitPlan > 1000000 && perUnitPlan !== 0)
    ) {
      // convert to MWh
      perUnitActual /= 1000000;
      perUnitPlan /= 1000000;
      unit = "MWh";
    }
    setPerUnitData([
      perUnitActual.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      }),
      perUnitPlan.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      }),
    ]);
    setPerUnitUnit(unit);
  }, [target, sumData, prodVolume]);

  useEffect(() => {
    // calculate per unit data line
    const cDataPerUnitActual = chartDataEnergy.map((v) =>
      prodVolume[0] !== 0 ? (v / prodVolume[0]) * 1000 : 0
    );
    const cDataPerUnitPlan = chartDataEnergy.map((v) =>
      prodVolume[1] !== 0 ? (v / prodVolume[1]) * 1000 : 0
    );
    setChartDataPerUnitActual(cDataPerUnitActual);
    setChartDataPerUnitPlan(cDataPerUnitPlan);
  }, [chartDataEnergy, prodVolume]);

  return (
    <>
      <Head>
        <title>Energy Visualize - Per Unit</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout title="Energy Visualization - Daily" backable>
        <EnergyVisualizeSelection datePickerLabel="Date:" />
        <div className="ml-auto mt-2 w-fit flex gap-1">
          <Button
            type="primary"
            onClick={getData}
            disabled={isChanged}
            icon={<HiOutlineRefresh className="w-full" />}
          />
          <Button type="primary" onClick={getData} disabled={!isChanged}>
            Get data
          </Button>
        </div>
        <div className="flex flex-col justify-center">
          <div className="m-4">
            <div className="text-2xl font-bold">
              Energy Consumption per unit detail
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Card
                  size="small"
                  title="Power consumption"
                  headStyle={{ backgroundColor: "#89C7BF", fontSize: "1.2rem" }}
                  bodyStyle={{ backgroundColor: "#C2FFF7" }}
                >
                  <div className="grid grid-cols-[5fr_1fr_5fr] mx-4 gap-2 text-center my-2">
                    <div>
                      <span>Actual</span>
                      <p className="text-4xl font-medium mb-0">{`${sumData}`}</p>
                      <p className="mb-0 text-xl">kWh</p>
                    </div>
                    <Divider style={{ height: "100%" }} type="vertical" />
                    <div>
                      <span>Target</span>
                      <div className="mx-auto">
                        <InputNumber
                          className="actual-input"
                          bordered={false}
                          style={{ backgroundColor: "#EEEEEE" }}
                          size="large"
                          controls={false}
                          onChange={targetPowerChange}
                          value={target}
                          disabled
                        />
                        <p className="mb-0 text-xl">kWh</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <div>
                <Card
                  size="small"
                  title="Production volume"
                  headStyle={{ backgroundColor: "#A4C789", fontSize: "1.2rem" }}
                  bodyStyle={{ backgroundColor: "#D5FFB5" }}
                >
                  <div className="grid grid-cols-[5fr_1fr_5fr] mx-4 gap-2 text-center my-2">
                    <div>
                      <span>Actual</span>
                      <p className="text-4xl font-medium mb-0">{`${prodVolume[0].toLocaleString(
                        "en-US",
                        { maximumFractionDigits: 0 }
                      )}`}</p>
                      <p className="mb-0 text-xl">pcs.</p>
                    </div>
                    <Divider style={{ height: "100%" }} type="vertical" />
                    <div>
                      <span>Target</span>
                      <p className="text-4xl mb-0">{`${prodVolume[1].toLocaleString(
                        "en-US",
                        { maximumFractionDigits: 0 }
                      )}`}</p>
                      <p className="mb-0 text-xl">pcs.</p>
                    </div>
                  </div>
                </Card>
              </div>
              <div>
                <Card
                  size="small"
                  title="Power consumption per unit"
                  headStyle={{ backgroundColor: "#FCCC6A", fontSize: "1.2rem" }}
                  bodyStyle={{ backgroundColor: "#FFEBC2" }}
                >
                  <div className="grid grid-cols-[5fr_1fr_5fr] mx-4 gap-2 text-center my-2">
                    <div>
                      <span>Actual</span>
                      <p className="text-4xl font-medium mb-0">{`${perUnitData[0]}`}</p>
                      <p className="mb-0 text-xl">{`${perUnitUnit}/unit`}</p>
                    </div>
                    <Divider style={{ height: "100%" }} type="vertical" />
                    <div>
                      <span>Target</span>
                      <p className="text-4xl mb-0">{`${perUnitData[1]}`}</p>
                      <p className="mb-0 text-xl">{`${perUnitUnit}/unit`}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            <div className="flex my-4">
              <Chart
                type="bar"
                options={{
                  scales: {
                    x: {
                      beginAtZero: true,
                      stacked: true,
                      title: {
                        display: true,
                        text: "Time",
                        color: "black",
                        font: {
                          weight: "bold",
                        },
                      },
                    },
                    y: {
                      stacked: true,
                      // max: yAxisMax,
                      title: {
                        display: true,
                        text: "Consumption (kWh)",
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
                      // max: y1AxisMax,
                      display: true,
                      position: "right",
                      grid: {
                        borderDash: [8, 2],
                      },
                      title: {
                        display: true,
                        text: "Consumption per unit (Wh/unit)",
                        color: "black",
                        font: {
                          weight: "bold",
                          size: 15,
                        },
                      },
                    },
                  },
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                    title: {
                      display: true,
                      text: "Energy consumption per unit",
                    },
                  },
                }}
                data={{
                  labels: intervalTimestamp.map((ts) => ts.format("HH:mm")),
                  datasets: [
                    {
                      type: "bar" as const,
                      label: "Power",
                      data: chartDataEnergy,
                      borderColor: "rgb(247, 166, 15)",
                      backgroundColor: "rgba(250, 192, 85, 0.7)",
                      yAxisID: "y",
                      // cubicInterpolationMode: "monotone",
                      // tension: 0.4,
                    },
                    {
                      type: "line" as const,
                      label: "Per unit (Plan)",
                      data: chartDataPerUnitPlan,
                      borderColor: "rgb(54, 54, 54)",
                      backgroundColor: "rgba(127, 126, 128, 0.7)",
                      yAxisID: "y1",
                      cubicInterpolationMode: "monotone",
                      tension: 0.4,
                    },
                    {
                      type: "line" as const,
                      label: "Per unit (Actual)",
                      data: chartDataPerUnitActual,
                      borderColor: "rgb(87, 49, 224)",
                      backgroundColor: "rgba(126, 115, 201, 0.7)",
                      yAxisID: "y1",
                      cubicInterpolationMode: "monotone",
                      tension: 0.4,
                    },
                  ],
                }}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PerUnit;
