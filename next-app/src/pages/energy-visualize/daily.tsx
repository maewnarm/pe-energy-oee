import { fetchAirDaily, fetchElectricDaily } from "@/actions";
import Layout from "@/components/layout";
import { ConvertkWhTokgCO2e, Convertm3TokgCO2e } from "@/parser/unit.parser";
import { AirDailyStore, ElectricDailyStore, EnergySettingStore } from "@/store";
import EnergyVisualizeSelection from "@/views/energy-visualize-selection";
import EnergyVisualizeStackedBarChart from "@/views/energy-visualize-stacked-bar-chart";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";

const EnergyDaily: NextPage = () => {
  const { selectedProduct, selectedProductLine, selectedDate } =
    EnergySettingStore();
  const electricDailyStore = ElectricDailyStore();
  const airDailyStore = AirDailyStore();

  useEffect(() => {
    let electricAbortController: AbortController;
    let airAbortController: AbortController;

    if (
      selectedProduct !== "" &&
      selectedProductLine !== "" &&
      selectedDate !== ""
    ) {
      electricAbortController = new AbortController();
      fetchElectricDaily(selectedProduct, selectedProductLine, selectedDate, {
        signal: electricAbortController.signal,
      });

      airAbortController = new AbortController();
      fetchAirDaily(selectedProduct, selectedProductLine, selectedDate, {
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
          <title>Energy Visualize - Daily</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </div>
      <Layout title="Energy Visualization - Daily" backable>
        <EnergyVisualizeSelection datePickerLabel="Date:" />
        <div className="flex flex-col justify-center">
          <div className="m-4">
            <div className="text-2xl font-bold">
              Electric Energy Consumption
            </div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                yAxisLabel="Power consumption (kWh)"
                xAxisList={electricDailyStore.xAxisList}
                yAxisList={electricDailyStore.yAxisList}
                yAxisUnit="kWh"
                xAxisDisplayNameMap={electricDailyStore.nameMap}
                legendDisplayMap={electricDailyStore.infoNameMap}
                total={electricDailyStore.total}
                convertFunc={ConvertkWhTokgCO2e}
              />
            </div>
            <div className="text-2xl font-bold">Air Consumption</div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                yAxisLabel="Air comsumption (m3)"
                xAxisList={airDailyStore.xAxisList}
                yAxisList={airDailyStore.yAxisList}
                yAxisUnit="m3"
                xAxisDisplayNameMap={airDailyStore.nameMap}
                legendDisplayMap={airDailyStore.infoNameMap}
                total={airDailyStore.total}
                convertFunc={Convertm3TokgCO2e}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default EnergyDaily;
