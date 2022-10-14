import { ParseAxisToRaceChartData } from '@/parser/chart.parser'
import { ChartData } from 'chart.js'
import { FC, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'

interface IProps {
	xAxisList: string[]
  yAxisList: number[]
  xAxisDisplayNameMap: Record<string, string>

  xAxisLabel?: string
  yAxisLabel?: string
  aspectRatio?: number
}

const EnergyVisualizeRaceChart: FC<IProps> = ({ xAxisList, yAxisList, xAxisLabel, yAxisLabel, xAxisDisplayNameMap, aspectRatio }: IProps) => {
  const chartData: ChartData<'bar', number[]> = useMemo(() => ParseAxisToRaceChartData(xAxisList, yAxisList), [xAxisList, yAxisList])

  return (
    <div className="relative w-full p-4 ml-2 border border-black flex">
      <div className="w-full">
        <Bar
          options={{
            indexAxis: 'y' as const,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: !!yAxisLabel,
                  text: yAxisLabel,
                  color: 'black',
                  font: {
                    weight: 'bold'
                  }
                }
              },
              x: {
                title: {
                  display: !!xAxisLabel,
                  text: xAxisLabel,
                  color: 'black',
                  font: {
                    weight: 'bold'
                  }
                }
              }
            },
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

export default EnergyVisualizeRaceChart