import { ChartData, ChartEvent } from 'chart.js'
import { FC, useEffect, useMemo, useState } from 'react'
import { Chart } from 'react-chartjs-2'
import Selection from '@/components/fields/Selection'
import { ParseOEEAxisToFaultOccurrenceChartData } from '@/parser/chart.parser'
import { Modal } from 'antd'

interface IProps {
  mcNumberCollectionList: string[][]
  xAxisCollectionList: string[][]
  yBarAxisCollectionList: string[][]
  yLineAxisCollectionList: string[][]
  collection: string[]

  label?: string

  xAxisLabel: string
  yAxisLabel: string

  aspectRatio?: number
}

const OEEFaultOccurrenceChart: FC<IProps> = ({ xAxisCollectionList, yBarAxisCollectionList, yLineAxisCollectionList, mcNumberCollectionList, collection, label, xAxisLabel, yAxisLabel, aspectRatio }: IProps) => {
  const [sort, setSort] = useState<string>('')

  const sortIndex = useMemo(() => collection.findIndex(v => v === sort), [sort, collection])
  const xAxisList = useMemo(() => sortIndex === -1 ? [] : xAxisCollectionList[sortIndex], [sortIndex, xAxisCollectionList])
  const yBarAxisList = useMemo(() => sortIndex === -1 ? [] : yBarAxisCollectionList[sortIndex], [sortIndex, yBarAxisCollectionList])
  const yLineAxisList = useMemo(() => sortIndex === -1 ? [] : yLineAxisCollectionList[sortIndex], [sortIndex, yLineAxisCollectionList])
  const mcNumberList = useMemo(() => sortIndex === -1 ? []: mcNumberCollectionList[sortIndex], [sortIndex, mcNumberCollectionList])
  const chartData: ChartData<'line' | 'bar', number[]> = useMemo(() => ParseOEEAxisToFaultOccurrenceChartData(xAxisList, yBarAxisList, yLineAxisList), [yBarAxisList, yLineAxisList, xAxisList])

  useEffect(() => {
    setSort(collection?.[0] ?? 0)
  }, [collection])

  const onChartClicked = (event: ChartEvent, elements: any[]) => {
    if (elements.length === 0) {
      return
    }

    const firstElement = elements[0]
    const index = firstElement.element.$context.parsed.x
    const machineStr = mcNumberList[index]
    openMachineModal(machineStr)
  }

  const openMachineModal = (machineStr: string) => {
    return Modal.info({
      width: 600,
      icon: "",
      title: "Machines",
      okText: "Close",
      content: (
        <div>{machineStr}</div>
      )
    })
  }

  return (
    <div className="relative w-full p-4 ml-2 border border-black flex flex-col">
      { label && <div className="text-2xl text-center font-bold">{ label }</div> }
      <div className="flex justify-between">
        <div></div>
        <Selection
          label="Sort:"
          value={sort}
          orientation="horizontal"
          itemList={collection}
          onSelect={setSort}
        />
      </div>
      <div className="w-full">
        <Chart
          type="bar"
          options={{
            indexAxis: 'x' as const,
            scales: {
              x: {
                beginAtZero: true,
                title: {
                  display: !!xAxisLabel,
                  text: xAxisLabel,
                  color: 'black',
                  font: {
                    weight: 'bold'
                  }
                }
              },
              y: {
                title: {
                  display: !!yAxisLabel,
                  text: yAxisLabel,
                  color: 'black',
                  font: {
                    weight: 'bold'
                  }
                }
              }
            },
            elements: {
              point: {
                radius: 0
              }
            },
            interaction: {
              axis: 'y'
            },
            onClick: onChartClicked,
            aspectRatio,
            responsive: true,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: false
              }
            },
          }}
          data={chartData}/>
      </div>
    </div>
  )
}

export default OEEFaultOccurrenceChart
