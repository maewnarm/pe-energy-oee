import { DatePicker } from 'antd'
import { PickerProps } from 'antd/lib/date-picker/generatePicker'
import { Moment } from 'moment'
import { FC } from 'react'

interface IProps {
  orientation?: 'vertical' | 'horizontal'
}

const DatePickerSection: FC<IProps & PickerProps<Moment>> = ({ orientation = 'vertical', ...props}: IProps & PickerProps<Moment>) => {
  return (
	  <div className={`flex ${orientation === 'vertical' ? 'flex-col' : ''}`}>
      <div className="text-lg font-bold">Date:</div>
      <DatePicker {...props} allowClear={false}/>
	  </div>
  )
}

export default DatePickerSection
