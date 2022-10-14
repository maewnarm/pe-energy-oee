import { ParseOEEAxisToLineChartData } from '@/parser/chart.parser'
import { ChartData, ChartEvent } from 'chart.js'
import { FC, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { AnnotationOptions } from 'chartjs-plugin-annotation'
import { Modal } from 'antd'
import { ChatElementVideo } from '@/types/chart.type'

interface IProps {
  xAxisList: string[]
  yAxisList: string[]

  chartElementVideoList: ChatElementVideo[]

  target: number
  label?: string | React.ReactNode

  xAxisLabel: string
  yAxisLabel: string

  aspectRatio?: number
}

const OEEVisualizeLineChart: FC<IProps> = ({ xAxisList, yAxisList, xAxisLabel, chartElementVideoList, yAxisLabel, target, aspectRatio, label }: IProps) => {
  const chartData: ChartData<'line', number[]> = useMemo(() => ParseOEEAxisToLineChartData(xAxisList, yAxisList), [xAxisList, yAxisList])
  const yAxisMax: number | undefined = useMemo(() => {
    if (target === 0) {
      return undefined
    }

    const maxAxisY = Math.max(...yAxisList.map(yAxis => +yAxis))

    return target < maxAxisY ? maxAxisY : target
  }, [yAxisList, target])
  const annotations: AnnotationOptions[] = useMemo(() => {
    if (target === 0) {
      return []
    }

    return [
      {
        type: 'line',
        yMin: target,
        yMax: target,
        borderWidth: 3,
        borderColor: 'yellow'
      }
    ]
  }, [target])

  const onChartClicked = (event: ChartEvent, elements: any[]) => {
    if (elements.length === 0) {
      return
    }

    const firstElement = elements[0]
    const index = firstElement.element.$context.parsed.x
    const video = chartElementVideoList[index]

    if (video.hasVideo) {
      openVideoModal(video.videoUrl)
    }
  }

  const openVideoModal = (videoUrl: string) => {
    return Modal.info({
      width: 600,
      icon: "",
      okText: "Close",
      content: (
        <>
          {/* eslint-disable-next-line */}
          <video width="100%" height="auto" style={{ aspectRatio: "16/9" }} controls muted={true}>
            <source src={videoUrl} />
          </video>
        </>
      )
    })
  }

  return (
    <div className="relative w-full p-4 ml-2 border border-black flex flex-col">
      {label && <div className="text-2xl text-center font-bold relative">{label}</div>}
      <div className="w-full">
        <Line
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
            interaction: {
              axis: "y",
            },
            onClick: onChartClicked,
            responsive: true,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: false
              },
              annotation: {
                annotations
              }
            },
          }}
          data={chartData} />
      </div>
    </div>
  )
}

export default OEEVisualizeLineChart