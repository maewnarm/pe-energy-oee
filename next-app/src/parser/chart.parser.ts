import { ChartData, ChartDataset } from 'chart.js'
import util from 'src/util'

export const ParseAxisToRaceChartData = (xAxisList: string[], yAxisList: number[]): ChartData<'bar', number[]> => {
  const sortedLastYAxisValueList = xAxisList.map((xAxis, index) => {
    const key = xAxis
    const value = yAxisList[index]
    const color = util.getColorByIndex(util.getCharCodeFromString(key) % 100)
    return { key, value, color }
  }).sort((a, b) => (+b.value) - (+a.value))

  const labels: string[] = []

  const data: number[] = []
  const backgroundColor: string[] = []
  const borderColor: string[] = []

  sortedLastYAxisValueList.forEach((yAxisValue) => {
    labels.push(yAxisValue.key)
    data.push(+yAxisValue.value)
    backgroundColor.push(yAxisValue.color)
    borderColor.push(yAxisValue.color)
  })

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderColor
      }
    ]
  }
}

export const ParseAxisToStackedAreaChartData = (xAxisList: string[], yAxisList: Array<Record<string, string>>): ChartData<'line', number[]> => {
  const labels: string[] = xAxisList
  const yAxisKeyToAxisData: Record<string, number[]> = {}
  yAxisList.forEach(yAxis => {
    for(const [key, value] of Object.entries(yAxis)) {
      if (yAxisKeyToAxisData[key]) {
        yAxisKeyToAxisData[key].push(+value)
        continue
      }

      yAxisKeyToAxisData[key] = [+value]
    }
  })

  const datasets: ChartDataset<'line', number[]>[] = Object.keys(yAxisKeyToAxisData).map((yAxisKey, index) => {
    const color = util.getColorByIndex(index)
    const label = yAxisKey
    const data = yAxisKeyToAxisData[yAxisKey]
    
    return {
      fill: true,
      backgroundColor: color,
      label,
      data
    }
  })

  return {
    labels,
    datasets,
  }
}

export const ParseAxisToStackedBarChartData = (xAxisList: string[], yAxisList: Array<Record<string, string>>): ChartData<'bar', number[]> => {
  const labels: string[] = xAxisList
  const yAxisKeyToAxisData: Record<string, number[]> = {}
  yAxisList.forEach(yAxis => {
    for(const [key, value] of Object.entries(yAxis)) {
      if (yAxisKeyToAxisData[key]) {
        yAxisKeyToAxisData[key].push(+value)
        continue
      }

      yAxisKeyToAxisData[key] = [+value]
    }
  })

  const datasets: ChartDataset<'bar', number[]>[] = Object.keys(yAxisKeyToAxisData).map((yAxisKey, index) => {
    const color = util.getColorByIndex(index)
    const label = yAxisKey
    const data = yAxisKeyToAxisData[yAxisKey]
    
    return {
      borderColor: color,
      backgroundColor: color,
      label,
      data
    }
  })

  return {
    labels,
    datasets,
  }
}

export const ParseOEEAxisToLineChartData = (xAxisList: string[], yAxisList: string[]): ChartData<'line', number[]> => {
  const labels = xAxisList
  const datasets: ChartDataset<'line', number[]>[] = [
    {
      borderColor: 'rgb(34 211 238)',
      backgroundColor: 'rgb(34 211 238)',
      label: '',
      data: yAxisList.map((v) => +v)
    }
  ]

  return {
    labels,
    datasets
  }
}

export const ParseOEEAxisToFaultOccurrenceChartData = (xAxisList: string[], yBarAxisList: string[], yLineAxisList: string[]): ChartData<'line' | 'bar', number[]> => {
  const labels = xAxisList
  const barDatasets: ChartDataset<'bar', number[]> = {
    type: 'bar' as const,
    borderColor: 'rgb(34 211 238)',
    backgroundColor: 'rgb(34 211 238)',
    label: '',
    order: 1,
    data: yBarAxisList.map((v) => +v)
  }
  const lineDatasets: ChartDataset<'line', number[]> = {
    type: 'line' as const,
    borderColor: 'rgb(234 179 8)',
    backgroundColor: 'rgb(234 179 8)',
    label: '',
    order: 0,
    data: yLineAxisList.map((v) => +v)
  }

  return {
    labels,
    datasets: [
      barDatasets,
      lineDatasets
    ]
  }
}
