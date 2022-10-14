import { Select } from 'antd'
import { FC } from 'react'

interface IProps {
  value: string
  label: string
  itemList: string[]
  orientation?: 'vertical' | 'horizontal'
	onSelect: (value: string) => void
}
const Selection: FC<IProps> = ({ value, label, itemList, orientation = 'vertical', onSelect }: IProps) => {
  return (
    <div className={`flex ${orientation === 'vertical' ? 'flex-col' : ''}`}>
      <div className="text-lg font-bold">{ label }</div>
      <Select value={value} onChange={onSelect}>
        {itemList.map((item, index) => (
          <Select.Option value={item} key={`${item}-${index}`}>{ item }</Select.Option>
        ))}
      </Select>
    </div>
  )
}

export default Selection
