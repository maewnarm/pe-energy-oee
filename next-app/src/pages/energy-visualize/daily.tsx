import Head from 'next/head'
import type { NextPage } from 'next'
import Layout from '@/components/layout'
import { AirDailyStore, ElectricDailyStore, EnergySettingStore } from '@/store'
import EnergyVisualizeSelection from '@/views/energy-visualize-selection'
import { useEffect } from 'react'
import EnergyVisualizeStackedBarChart from '@/views/energy-visualize-stacked-bar-chart'
import { ConvertkWhTokgCO2e, Convertm3TokgCO2e } from '@/parser/unit.parser'
import { fetchAirDaily, fetchElectricDaily } from '@/actions'

const EnergyDaily: NextPage = () => {
  const { selectedProduct, selectedProductLine, selectedDate } = EnergySettingStore()
  const electricDailyStore = ElectricDailyStore()
  const airDailyStore = AirDailyStore()

  useEffect(() => {
    let electricAbortController: AbortController
    let airAbortController: AbortController

    if (selectedProduct !== '' && selectedProductLine !== '' && selectedDate !== '') {
      electricAbortController = new AbortController()
      fetchElectricDaily(selectedProduct, selectedProductLine, selectedDate, { signal: electricAbortController.signal })

      airAbortController = new AbortController()
      fetchAirDaily(selectedProduct, selectedProductLine, selectedDate, { signal: electricAbortController.signal })
    }

    return () => {
      electricAbortController?.abort()
      airAbortController?.abort()
    }
  }, [selectedProduct, selectedProductLine, selectedDate])

  return (
    <>
      <div>
        <Head>
          <title>Energy Visualize - Daily</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </div>
      <Layout
        title="Energy Visualization - Daily"
        backable>
        <EnergyVisualizeSelection/>
        <div className="flex flex-col justify-center">
          <div className="m-4">
            <div className="text-2xl font-bold">
                Electric Energy Consumption
            </div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                xAxisList={electricDailyStore.xAxisList}
                yAxisList={electricDailyStore.yAxisList}
                xAxisDisplayNameMap={electricDailyStore.nameMap}
                total={electricDailyStore.total}
                convertFunc={ConvertkWhTokgCO2e}
              />
            </div>
            <div className="text-2xl font-bold">
                Air Consumption
            </div>
            <div className="flex my-4">
              <EnergyVisualizeStackedBarChart
                xAxisList={airDailyStore.xAxisList}
                yAxisList={airDailyStore.yAxisList}
                xAxisDisplayNameMap={airDailyStore.nameMap}
                total={airDailyStore.total}
                convertFunc={Convertm3TokgCO2e}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export default EnergyDaily
