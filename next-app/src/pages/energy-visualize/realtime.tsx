import Head from 'next/head'
import type { NextPage } from 'next'
import Layout from '@/components/layout'
import { AirRealtimeStore, ElectricRealtimeStore, EnergySettingStore } from '@/store'
import { fetchAirRealtime, fetchElectricRealtime } from '@/actions'
import { useEffect, useMemo, useState } from 'react'
import EnergyVisualizeSelection from '@/views/energy-visualize-selection'
import moment from 'moment'
import EnergyVisualizeStackedAreaChart from '@/views/energy-visualize-stacked-area-chart'
import EnergyVisualizeRaceChart from '@/views/energy-visualize-race-chart'
import { ElectricRealtimeRaceStore } from '@/store/electric-realtime-race.store'
import { AirRealtimeRaceStore } from '@/store/air-realtime-race.store'
import { ConvertkWhTokgCO2e, ConvertkWhTotCO2e, ConvertkWhToW, Convertm3TokgCO2e, Convertm3TotCO2e } from '@/parser/unit.parser'
import { Select } from 'antd'

let shouldFetchNewData = true
const electricUnitMapToConvertFunc: Record<string, (v: number) => [number, string, string]> = {
  'W': ConvertkWhToW,
  'kW': (v:number): [number, string, string] => [v, '', ''],
  'kgCO2e': ConvertkWhTokgCO2e,
  'tCO2e': ConvertkWhTotCO2e
}

const airUnitMapToConvertFunc: Record<string, (v: number) => [number, string, string]> = {
  'm3': (v:number): [number, string, string] => [v, '', ''],
  'kgCO2e': Convertm3TokgCO2e,
  'tCO2e': Convertm3TotCO2e
}

const EnergyRealtime: NextPage = () => {
  const { selectedProduct, selectedProductLine } = EnergySettingStore()
  const electricRealtimeStore = ElectricRealtimeStore()
  const airRealtimeStore = AirRealtimeStore()
  const electricRealtimeRaceStore = ElectricRealtimeRaceStore()
  const airRealtimeRaceStore = AirRealtimeRaceStore()

  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [displayCurrentDate, setDisplayCurrentDate] = useState<string>('')
  const [displayCurrentTime, setDisplayCurrentTime] = useState<string>('')

  const [electricPaddingSecs, setElectricPaddingSecs] = useState<number>(3)
  const [electricLatestMins, setElectricLatestMins] = useState<number>(1)
  const [selectedElectricUnit, setSelectedElectricUnit] = useState<string>('kW')

  const [airPaddingSecs, setAirPaddingSecs] = useState<number>(3)
  const [airLatestMins, setAirLatestMins] = useState<number>(1)
  const [selectedAirUnit, setSelectedAirUnit] = useState<string>('m3')

  const electricRealtimeYAxisList = useMemo(() => electricRealtimeStore.yAxisList.map(yAxis => {
    const mapDict: Record<string, string> = {}
    Object.entries(yAxis).forEach(entries => {
      const [key, value] = entries
      mapDict[key] = `${electricUnitMapToConvertFunc[selectedElectricUnit]?.(+value)[0]}`
    })

    return mapDict
  }), [electricRealtimeStore.yAxisList, selectedElectricUnit])
  const airRealtimeYAxisList = useMemo(() => airRealtimeStore.yAxisList.map(yAxis => {
    const mapDict: Record<string, string> = {}
    Object.entries(yAxis).forEach(entries => {
      const [key, value] = entries
      mapDict[key] = `${airUnitMapToConvertFunc[selectedAirUnit]?.(+value)[0]}`
    })

    return mapDict
  }), [airRealtimeStore.yAxisList, selectedAirUnit])
  const electricRealtimeRaceYAxisList = useMemo(() => electricRealtimeRaceStore.yAxisList.map(yAxis => electricUnitMapToConvertFunc[selectedElectricUnit]?.(+yAxis)[0]), [electricRealtimeRaceStore.yAxisList, selectedElectricUnit])
  const airRealtimeRaceYAxisList = useMemo(() => airRealtimeRaceStore.yAxisList.map(yAxis => airUnitMapToConvertFunc[selectedAirUnit]?.(+yAxis)[0]), [airRealtimeRaceStore.yAxisList, selectedAirUnit])

  const electricDisplayYAxisText = useMemo(() => `Unit. ${selectedElectricUnit}`, [selectedElectricUnit])
  const electricRaceXAxisText = useMemo(() => `Power consump. ${selectedElectricUnit}`, [selectedElectricUnit])
  const airDisplayYAxisText = useMemo(() => `Unit. ${selectedAirUnit}`, [selectedAirUnit])
  const airRaceXAxisText = useMemo(() => `Air consump. ${selectedAirUnit}`, [selectedAirUnit])

  useEffect(() => {
    const timeInterval = setInterval(async () => {
      setCurrentTime(new Date())
    }, 1000)
    return () => {
      clearInterval(timeInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchRealtimeData = async () => {
      if (selectedProduct !== '' && selectedProductLine !== '' && shouldFetchNewData) {
        shouldFetchNewData = false
        await fetchElectricRealtime(selectedProduct, selectedProductLine, electricPaddingSecs, electricLatestMins)
        await fetchAirRealtime(selectedProduct, selectedProductLine, airPaddingSecs, airLatestMins)
        shouldFetchNewData = true
      }
    }
    setDisplayCurrentDate(moment(currentTime).format('DD-MMM-YYYY'))
    setDisplayCurrentTime(moment(currentTime).format('HH:mm:ss'))
    fetchRealtimeData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime])

  return (
    <>
      <div>
        <Head>
          <title>Energy Visualize - Realtime</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </div>
      <Layout
        title="Energy Visualize Realtime"
        backable>
        <EnergyVisualizeSelection
          hidePicker
          rightSection={(
            <>
              <div className="mx-4 mt-2">
                <div className="flex">
                  <span className="text-lg font-bold">
                  Date: 
                  </span>
                  <span className="text-lg ml-2">
                    { displayCurrentDate }
                  </span>
                </div>
                <div className="flex">
                  <span className="text-lg font-bold">
                  Time: 
                  </span>
                  <span className="text-lg ml-2">
                    { displayCurrentTime }
                  </span>
                </div>
              </div>
            </>
          )}/>
        <div className="flex flex-col justify-center">
          <div className="m-4">
            <div className="flex justify-between">
              <div className="text-2xl font-bold">
                  Electric Energy Consumption
              </div>
              <Select value={selectedElectricUnit} onChange={setSelectedElectricUnit}>
                {Object.keys(electricUnitMapToConvertFunc).map((unit, index) => (
                  <Select.Option value={unit} key={`e-unit-${index}`}>{ unit }</Select.Option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 grid-cols-2 my-4">
              <EnergyVisualizeStackedAreaChart
                aspectRatio={1.2}
                yAxisLabel={electricDisplayYAxisText}
                xAxisList={electricRealtimeStore.xAxisList}
                yAxisList={electricRealtimeYAxisList}
                xAxisDisplayNameMap={electricRealtimeStore.nameMap}
                paddingSecs={electricPaddingSecs}
                latestMins={electricLatestMins}
                onChangePaddingSecs={setElectricPaddingSecs}
                onChangeLatestMins={setElectricLatestMins}/>

              <EnergyVisualizeRaceChart
                aspectRatio={1.5}
                xAxisLabel={electricRaceXAxisText}
                xAxisList={electricRealtimeRaceStore.xAxisList}
                yAxisList={electricRealtimeRaceYAxisList}
                xAxisDisplayNameMap={electricRealtimeStore.nameMap}/>
            </div>
            
            <div className="flex justify-between">
              <div className="text-2xl font-bold">
                  Air Consumption
              </div>
              <Select value={selectedAirUnit} onChange={setSelectedAirUnit}>
                {Object.keys(airUnitMapToConvertFunc).map((unit, index) => (
                  <Select.Option value={unit} key={`a-unit-${index}`}>{ unit }</Select.Option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 grid-cols-2 my-4">
              <EnergyVisualizeStackedAreaChart
                aspectRatio={1.2}
                yAxisLabel={airDisplayYAxisText}
                xAxisList={airRealtimeStore.xAxisList}
                yAxisList={airRealtimeYAxisList}
                xAxisDisplayNameMap={airRealtimeStore.nameMap}
                paddingSecs={airPaddingSecs}
                latestMins={airLatestMins}
                onChangePaddingSecs={setAirPaddingSecs}
                onChangeLatestMins={setAirLatestMins}/>
              <EnergyVisualizeRaceChart
                aspectRatio={1.5}
                xAxisLabel={airRaceXAxisText}
                xAxisList={airRealtimeRaceStore.xAxisList}
                yAxisList={airRealtimeRaceYAxisList}
                xAxisDisplayNameMap={airRealtimeStore.nameMap}/>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export default EnergyRealtime
