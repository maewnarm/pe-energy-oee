import { FC, useState, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { ParseAxisToStackedBarChartData } from '@/parser/chart.parser'
import { AnnotationOptions } from 'chartjs-plugin-annotation'
import { ChartData } from 'chart.js'
import ChartDetail from './chart-detail'
import { useRef } from 'react'

interface IProps {
  xAxisList: string[]
  yAxisList: Array<Record<string, string>>
  xAxisDisplayNameMap: Record<string, string>
  total: number

  xAxisLabel?: string
  yAxisLabel?: string

  aspectRatio?: number
  convertFunc: (value: number) => [number, string, string]
}

const EnergyVisualizeStackedBarChart: FC<IProps> = ({ xAxisList, yAxisList, xAxisLabel, yAxisLabel, total, xAxisDisplayNameMap, aspectRatio, convertFunc }: IProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [targetAxisY, setTargetAxisY] = useState<number>(0)

  const chartData: ChartData<'bar', number[]> = useMemo(() => ParseAxisToStackedBarChartData(xAxisList, yAxisList), [xAxisList, yAxisList])
  const [convertedTotal, fromUnit, toUnit]:[number, string, string] = useMemo(() => convertFunc(total), [total, convertFunc])
  const annotations: AnnotationOptions[] = useMemo(() => {
    if (targetAxisY === 0) {
      return []
    }

    return [
      {
        type: 'line',
        yMin: targetAxisY,
        yMax: targetAxisY,
        borderWidth: 3,
        borderColor: 'yellow'
      }
    ]
  }, [targetAxisY])
  const yAxisMax: number | undefined = useMemo(() => {
    if (targetAxisY === 0) {
      return undefined
    }

    const maxAxisY = Math.max(...yAxisList.map(yAxis => Object.values(yAxis).reduce((prev, cur) => +cur > 0 ? prev + (+cur) : prev, 0)))

    return targetAxisY < maxAxisY ? maxAxisY : targetAxisY
  }, [targetAxisY, yAxisList])

  return (
    <div className="relative w-full p-4 ml-2 border border-black flex">
      <div className="absolute rounded ml-2 mb-4" ref={tooltipRef}></div>
      <div className="w-4/5">
        <Bar
          options={{
            indexAxis: 'x' as const,
            scales: {
              x: {
                beginAtZero: true,
                stacked: true,
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
                stacked: true,
                max: yAxisMax,
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
            aspectRatio,
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom' as const,
                onHover: function(event, legendItem) {
                  if (tooltipRef.current) {
                    tooltipRef.current.innerHTML = xAxisDisplayNameMap?.[legendItem.text] ?? legendItem.text
                    tooltipRef.current.style.display = 'block'
                    tooltipRef.current.style.padding = '2px 8px'
                    tooltipRef.current.style.background = '#000000de'
                    tooltipRef.current.style.color = 'white'
                    tooltipRef.current.style.left = `${(event.x ?? 0) + 0}px`
                    tooltipRef.current.style.top = `${(event.y ?? 0) - 5}px`
                  }
                },
                onLeave: function() {
                  if (tooltipRef.current) {
                    tooltipRef.current.innerHTML = ""
                    tooltipRef.current.style.display = 'none'
                  }
                }
              },
              title: {
                display: false
              },
              annotation: {
                annotations
              }
            },
          }}
          data={chartData}/>
      </div>
      <div className="w-1/5 px-4">
        <ChartDetail
          totalLine1Text={fromUnit}
          totalLine1={total}
          totalLine2Text={toUnit}
          totalLine2={convertedTotal}
          targetAxisY={targetAxisY}
          onTargetAxisChange={setTargetAxisY}/>
      </div>
    </div>
  )
}

export default EnergyVisualizeStackedBarChart