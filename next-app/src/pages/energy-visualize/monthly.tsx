import { fetchAirMonthly, fetchElectricMonthly } from "@/actions";
import { fetchProductVolumeMonthly } from "@/actions/lineinfo.actions";
import Layout from "@/components/layout";
import { ConvertkWhTotCO2e, Convertm3TotCO2e } from "@/parser/unit.parser";
import {
  AirMonthlyStore,
  ElectricMonthlyStore,
  EnergySettingStore,
} from "@/store";
import { CommonStore } from "@/store/common.store";
import { LineInfoStore } from "@/store/lineinfo.store";
import EnergyVisualizeSelection from "@/views/energy-visualize-selection";
import EnergyVisualizeStackedBarChart from "@/views/energy-visualize-stacked-bar-chart";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";

const EnergyMonthly: NextPage = () => {
  const { selectedProduct, selectedProductLine, selectedDate } =
    EnergySettingStore();
  const electricMonthlyStore = ElectricMonthlyStore();
  const airMonthlyStore = AirMonthlyStore();
  const prodVolumePlan = LineInfoStore((state) => state.prodVolumePlan);
  const prodVolumeActual = LineInfoStore((state) => state.prodVolumeActual);
  const setIsLoading = CommonStore.getState().setIsLoading;

  useEffect(() => {
    let electricAbortController: AbortController;
    let airAbortController: AbortController;
    let prodVolumeController: AbortController;

    (async function () {
      if (
        selectedProduct !== "" &&
        selectedProductLine !== "" &&
        selectedDate !== ""
      ) {
        setIsLoading(true);

        electricAbortController = new AbortController();
        await fetchElectricMonthly(
          selectedProduct,
          selectedProductLine,
          selectedDate,
          {
            signal: electricAbortController.signal,
          }
        );

        airAbortController = new AbortController();
        await fetchAirMonthly(
          selectedProduct,
          selectedProductLine,
          selectedDate,
          {
            signal: electricAbortController.signal,
          }
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

        setIsLoading(false);
      }
    })();

    return () => {
      electricAbortController?.abort();
      airAbortController?.abort();
      prodVolumeController?.abort();
    };
  }, [selectedProduct, selectedProductLine, selectedDate]);

  return (
    <>
      <div>
        <Head>
          <title>Energy Visualize - Monthly</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </div>
      <Layout title="Energy Visualization - Monthly" backable>
        <EnergyVisualizeSelection datePickerLabel="Month:" picker="month" />
        <div className="flex flex-col justify-center">
          <div className="m-4">
            <div className="text-2xl font-bold">
              Electric Energy Consumption
            </div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                xAxisList={electricMonthlyStore.xAxisList}
                yAxisList={electricMonthlyStore.yAxisList}
                yAxisLabel="Power consumption (kWh)"
                yAxisUnit="kWh"
                y1AxisList={prodVolumeActual}
                y1AxisLabel="Power consumption / piece (Wh/pc.)"
                y1AxisUnit="Wh/pc."
                y1AxisMultiplier={1000}
                xAxisDisplayNameMap={electricMonthlyStore.nameMap}
                legendDisplayMap={electricMonthlyStore.infoNameMap}
                total={electricMonthlyStore.total}
                convertFunc={ConvertkWhTotCO2e}
                convertDescription="1 kWh = 0.595 kgCO2e"
              />
            </div>
            <div className="text-2xl font-bold">Air Consumption</div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                yAxisLabel="Air consumption (m3)"
                xAxisList={airMonthlyStore.xAxisList}
                yAxisList={airMonthlyStore.yAxisList}
                yAxisUnit="m3"
                y1AxisList={prodVolumeActual}
                y1AxisLabel="Air consumption / piece (m3/pc.)"
                y1AxisUnit="m3/pc."
                y1AxisMultiplier={1}
                xAxisDisplayNameMap={airMonthlyStore.nameMap}
                legendDisplayMap={airMonthlyStore.infoNameMap}
                total={airMonthlyStore.total}
                convertFunc={Convertm3TotCO2e}
                convertDescription="1 m3 = 0.0765 kgCO2e"
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default EnergyMonthly;
