import { fetchAirMonthly, fetchElectricMonthly } from "@/actions";
import Layout from "@/components/layout";
import { ConvertkWhTotCO2e, Convertm3TotCO2e } from "@/parser/unit.parser";
import {
  AirMonthlyStore,
  ElectricMonthlyStore,
  EnergySettingStore,
} from "@/store";
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

  useEffect(() => {
    let electricAbortController: AbortController;
    let airAbortController: AbortController;

    if (
      selectedProduct !== "" &&
      selectedProductLine !== "" &&
      selectedDate !== ""
    ) {
      electricAbortController = new AbortController();
      fetchElectricMonthly(selectedProduct, selectedProductLine, selectedDate, {
        signal: electricAbortController.signal,
      });

      airAbortController = new AbortController();
      fetchAirMonthly(selectedProduct, selectedProductLine, selectedDate, {
        signal: electricAbortController.signal,
      });
    }

    return () => {
      electricAbortController?.abort();
      airAbortController?.abort();
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
        <EnergyVisualizeSelection picker="month" />
        <div className="flex flex-col justify-center">
          <div className="m-4">
            <div className="text-2xl font-bold">
              Electric Energy Consumption
            </div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                yAxisLabel="Power consumption (kWh)"
                xAxisList={electricMonthlyStore.xAxisList}
                yAxisList={electricMonthlyStore.yAxisList}
                yAxisUnit="kWh"
                xAxisDisplayNameMap={electricMonthlyStore.nameMap}
                legendDisplayMap={electricMonthlyStore.infoNameMap}
                total={electricMonthlyStore.total}
                convertFunc={ConvertkWhTotCO2e}
              />
            </div>
            <div className="text-2xl font-bold">Air Consumption</div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                yAxisLabel="Air consumption (m3)"
                xAxisList={airMonthlyStore.xAxisList}
                yAxisList={airMonthlyStore.yAxisList}
                yAxisUnit="m3"
                xAxisDisplayNameMap={airMonthlyStore.nameMap}
                legendDisplayMap={airMonthlyStore.infoNameMap}
                total={airMonthlyStore.total}
                convertFunc={Convertm3TotCO2e}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default EnergyMonthly;
