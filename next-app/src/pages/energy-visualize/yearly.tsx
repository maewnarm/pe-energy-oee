import { fetchAirYearly, fetchElectricYearly } from "@/actions";
import Layout from "@/components/layout";
import { ConvertkWhTotCO2e, Convertm3TotCO2e } from "@/parser/unit.parser";
import {
  AirYearlyStore,
  ElectricYearlyStore,
  EnergySettingStore,
} from "@/store";
import EnergyVisualizeSelection from "@/views/energy-visualize-selection";
import EnergyVisualizeStackedBarChart from "@/views/energy-visualize-stacked-bar-chart";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";

const EnergyYearly: NextPage = () => {
  const { selectedProduct, selectedProductLine, selectedDate } =
    EnergySettingStore();
  const electricYearlyStore = ElectricYearlyStore();
  const airYearlyStore = AirYearlyStore();

  useEffect(() => {
    let electricAbortController: AbortController;
    let airAbortController: AbortController;

    if (
      selectedProduct !== "" &&
      selectedProductLine !== "" &&
      selectedDate !== ""
    ) {
      electricAbortController = new AbortController();
      fetchElectricYearly(selectedProduct, selectedProductLine, selectedDate, {
        signal: electricAbortController.signal,
      });

      airAbortController = new AbortController();
      fetchAirYearly(selectedProduct, selectedProductLine, selectedDate, {
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
          <title>Energy Visualize - Yearly</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </div>
      <Layout title="Energy Visualization - Yearly" backable>
        <EnergyVisualizeSelection picker="year" />
        <div className="flex flex-col justify-center">
          <div className="m-4">
            <div className="text-2xl font-bold">
              Electric Energy Consumption
            </div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                yAxisLabel="Power consumption (kWh)"
                xAxisList={electricYearlyStore.xAxisList}
                yAxisList={electricYearlyStore.yAxisList}
                xAxisDisplayNameMap={electricYearlyStore.nameMap}
                total={electricYearlyStore.total}
                convertFunc={ConvertkWhTotCO2e}
              />
            </div>
            <div className="text-2xl font-bold">Air Consumption</div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                yAxisLabel="Air consumption (m3)"
                xAxisList={airYearlyStore.xAxisList}
                yAxisList={airYearlyStore.yAxisList}
                xAxisDisplayNameMap={airYearlyStore.nameMap}
                total={airYearlyStore.total}
                convertFunc={Convertm3TotCO2e}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default EnergyYearly;
