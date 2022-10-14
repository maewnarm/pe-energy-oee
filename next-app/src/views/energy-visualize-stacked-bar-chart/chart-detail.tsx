import { Input, Tooltip } from 'antd'
import { FC } from 'react'

interface IProps {
  totalLine1Text: string
  totalLine1: number
  totalLine2Text: string
  totalLine2: number
  targetAxisY: number
  onTargetAxisChange: (value: number) => void
}

const ChartDetail: FC<IProps> = ({ totalLine1Text, totalLine1, totalLine2, totalLine2Text, targetAxisY, onTargetAxisChange }:IProps) => {
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="text-base font-bold">Target line</div>
      <Input
        value={targetAxisY}
        onChange={(e) => onTargetAxisChange(+e.target.value)}
        type="number"/>
      <div className="text-base font-bold text-center my-4">Summary data</div>
      <div className="my-2">
        <div className="text-sm font-bold">Total</div>
        <div className="flex text-sm justify-end font-bold items-center">
          <Tooltip title={totalLine1}>
            <div className="text-end truncate text-red-700">{totalLine1.toFixed(3) }</div>
          </Tooltip>
          <div className="ml-2">{ totalLine1Text }</div>
        </div>
      </div>

      <div className="my-2">
        <div className="text-sm font-bold">CO 2 emission</div>
        <div className="flex text-sm justify-end font-bold items-center">
          <Tooltip title={totalLine2}>
            <div className="text-end truncate text-red-700">{ totalLine2.toFixed(3) }</div>
          </Tooltip>
          <div className="ml-4">{ totalLine2Text }</div>
        </div>
      </div>
    </div>
  )
}

export default ChartDetail
