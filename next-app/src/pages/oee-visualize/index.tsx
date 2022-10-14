import Head from 'next/head'
import type { NextPage } from 'next'
import Layout from '../../components/layout'
import OEEVisualizeSelection from '@/views/oee-visualize-selection'
import OEESummary from '@/views/oee-summary'
import OEEDekidakaTable from '@/views/oee-dekidaka-table'
import OEEVisualizeLineChart from '@/views/oee-visualize-line-chart'
import { OEEDashboardStore } from '@/store/oee-dashboard.store'
import { OEESettingStore } from '@/store/oee-setting.store'
import { useEffect, useMemo, useState } from 'react'
import { fetchOEECycleTime, fetchOEEFaultOccurrence, fetchOEEProduction } from '@/actions/oee-dashboard.action'
import Selection from '@/components/fields/Selection'
import OEEFaultOccurrenceChart from '@/views/oee-fault-occurance-chart'
import { ChatElementVideo } from '@/types/chart.type'
import { MACHINE_UNIT_SELECTION_TO_VALUE, MACHINE_CHART_AXIS_TO_VALUE } from '@/constants/chart'

const OEEDashboard: NextPage = () => {
  const { dekidakaList, cycleTime, faultOccurrence } = OEEDashboardStore()
  const {  
    selectedProduct,
    selectedProductLine,
    selectedDate,
    selectedMachine,
    selectedOperator,
    selectedPeriod,
    selectedMachineUnit,
    operatorList,
    machineList,
    setSelectedMachineUnit,
    setSelectedOperator,
    setSelectedMachine
  } = OEESettingStore()
  const [ timeTrigger, setTimeTrigger ] = useState<Date>(new Date())

  const isSelectCurrentDate = useMemo(() => new Date().toDateString() === new Date(selectedDate).toDateString(), [selectedDate])
  const cycleTimeVideoElementList = useMemo(() => {
    return cycleTime?.has_video.map<ChatElementVideo>((v, index) => ({ hasVideo: v, videoUrl: cycleTime.video_url[index]})) ?? []
  }, [cycleTime])

  useEffect(() => {
    const fetchInterval = setInterval(() => {
      timeTriggerInterval()
    }, 1000 * 60)

    return () => {
      clearInterval(fetchInterval)
    }
  // eslint-disable-next-line
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    if ([selectedProduct, selectedProductLine, selectedDate, selectedPeriod].every(v => v !== '')) {
      fetchOEEProduction(
        selectedProduct,
        selectedProductLine,
        selectedDate,
        selectedPeriod,
        { signal: controller.signal }
      )
    }

    return () => {
      controller.abort()
    }
  }, [selectedProduct, selectedProductLine, selectedDate, selectedPeriod, timeTrigger])

  useEffect(() => {
    const controller = new AbortController()

    if ([selectedProduct, selectedProductLine, selectedDate, selectedPeriod, selectedOperator].every(v => v !== '')) {
      fetchOEECycleTime(
        selectedProduct,
        selectedProductLine,
        selectedDate,
        selectedPeriod,
        selectedOperator,
        { signal: controller.signal }
      )
    }

    return () => {
      controller.abort()
    }
  }, [selectedProduct, selectedProductLine, selectedDate, selectedPeriod, selectedOperator, timeTrigger])

  useEffect(() => {
    const controller = new AbortController()

    if ([selectedProduct, selectedProductLine, selectedDate, selectedPeriod, selectedMachine].every(v => v !== '')) {
      fetchOEEFaultOccurrence(
        selectedProduct,
        selectedProductLine,
        selectedDate,
        selectedPeriod,
        selectedMachine,
        selectedMachineUnit,
        { signal: controller.signal }
      )
    }

    return () => {
      controller.abort()
    }
  }, [selectedProduct, selectedProductLine, selectedDate, selectedPeriod, selectedMachine, selectedMachineUnit, timeTrigger])

  const timeTriggerInterval = () => {
    if (isSelectCurrentDate) {
      setTimeTrigger(new Date())
    }
  }
  
  return (
    <>
      <div>
        <Head>
          <title>OEE Visualize - Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </div>
      <Layout
        title="OEE Visualize - Dashboard"
        backable>
        <OEEVisualizeSelection/>
        <div className="grid gap-4 grid-cols-2">
          <div className="flex flex-col mt-10 mb-2">
            <OEESummary/>
            <OEEDekidakaTable
              itemList={dekidakaList}/>
          </div>
          <div className="flex flex-col mb-4">
            <div className="flex justify-end mb-2">
              <Selection
                label="Operator:"
                value={selectedOperator}
                orientation="horizontal"
                itemList={operatorList}
                onSelect={setSelectedOperator}
              />
            </div>
            <OEEVisualizeLineChart
              label={(
                <>
                  <div>Cycle Time (CT)</div>
                  <div className="text-sm absolute top-2 right-0">Target CT: {cycleTime?.target ?? 0}</div>
                </>
              )}
              xAxisLabel="time"
              yAxisLabel="secs."
              xAxisList={cycleTime?.x_axis ?? []}
              yAxisList={cycleTime?.y_axis ?? []}
              chartElementVideoList={cycleTimeVideoElementList}
              target={cycleTime?.target ?? 0}
              aspectRatio={2.5} />
            <div className="flex justify-between my-2">
              <Selection
                label="Unit:"
                value={selectedMachineUnit}
                orientation="horizontal"
                itemList={Object.keys(MACHINE_UNIT_SELECTION_TO_VALUE)}
                onSelect={setSelectedMachineUnit}
              />
              <div></div>
              <Selection
                label="Machine:"
                value={selectedMachine}
                orientation="horizontal"
                itemList={machineList}
                onSelect={setSelectedMachine}
              />
            </div>
            <OEEFaultOccurrenceChart
              label="Fault Occurrence"
              mcNumberCollectionList={[
                faultOccurrence?.mc_number_list_all ?? [],
                faultOccurrence?.mc_number_list_top_10 ?? [],
                faultOccurrence?.mc_number_list_top_20 ?? []
              ]}
              xAxisCollectionList={[
                faultOccurrence?.x_axis_all ?? [],
                faultOccurrence?.x_axis_top_10 ?? [],
                faultOccurrence?.x_axis_top_20 ?? [],
              ]}
              yBarAxisCollectionList={[
                faultOccurrence?.y_axis_left_all ?? [],
                faultOccurrence?.y_axis_left_top_10 ?? [],
                faultOccurrence?.y_axis_left_top_20 ?? [],
              ]}
              yLineAxisCollectionList={[
                faultOccurrence?.y_axis_right_all ?? [],
                faultOccurrence?.y_axis_right_top_10 ?? [],
                faultOccurrence?.y_axis_right_top_20 ?? [],
              ]}
              collection={['All', 'Top 10', 'Top 20']}
              xAxisLabel="Error Code"
              yAxisLabel={MACHINE_CHART_AXIS_TO_VALUE[selectedMachineUnit] ?? ''}
              aspectRatio={2.5}/>
          </div>
        </div>
      </Layout>
    </>
  )
}

export default OEEDashboard
