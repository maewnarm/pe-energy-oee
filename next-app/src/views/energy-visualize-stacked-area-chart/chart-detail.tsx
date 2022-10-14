import { Input } from 'antd'
import { FC } from 'react'

interface IProps {
  targetAxisY: number
  paddingSecs: number
  latestMins: number

  onTargetAxisChange: (value: number) => void
  onChangePaddingSecs: (value: number) => void
  onChangeLatestMins: (value: number) => void
}

const ChartDetail: FC<IProps> = ({ targetAxisY, paddingSecs, latestMins, onChangePaddingSecs, onChangeLatestMins, onTargetAxisChange }:IProps) => {
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="text-base font-bold">Target line</div>
      <Input
        value={targetAxisY}
        onChange={(e) => onTargetAxisChange(+e.target.value)}
        type="number"/>
      <div className="text-base font-bold">Padding secs</div>
      <Input
        value={paddingSecs}
        onChange={(e) => onChangePaddingSecs(+e.target.value)}
        type="number"/>
      <div className="text-base font-bold">Latest mins</div>
      <Input
        value={latestMins}
        onChange={(e) => onChangeLatestMins(+e.target.value)}
        type="number"/>
    </div>
  )
}

export default ChartDetail
