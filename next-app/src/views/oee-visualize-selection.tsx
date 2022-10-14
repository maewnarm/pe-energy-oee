import { FC, useEffect } from 'react'
import Selection from '@/components/fields/Selection'
import { OEESettingStore } from '@/store/oee-setting.store'
import { fetchOEEMachineSetting, fetchOEEOperatorSetting, fetchOEEProductSetting } from '@/actions/oee-setting.action'
import DatePickerSection from '@/components/fields/DatePicker'
import moment from 'moment'

interface IProps {
	picker?: 'date' | 'month' | 'year'
}

const OEEVisualizeSelection: FC<IProps> = ({ picker = 'date' }:IProps ) => {
  const {
    productList,
    productLineList,
    periodList,
    selectedProduct,
    selectedProductLine,
    selectedDate,
    selectedPeriod,
    setSelectedProduct,
    setSelectedProductLine,
    setSelectedDate,
    setSelectedPeriod
  } = OEESettingStore()
  
  useEffect(() => {
    const controller = new AbortController()
    fetchOEEProductSetting({ signal: controller.signal })

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    let controller: AbortController
    if (selectedProduct !== '' && selectedProductLine !== '') {
      controller = new AbortController()
      fetchOEEOperatorSetting(selectedProduct, selectedProductLine, { signal: controller.signal })
      fetchOEEMachineSetting(selectedProduct, selectedProductLine, { signal: controller.signal })
    }

    return () => {
      controller?.abort()
    }
  }, [selectedProduct, selectedProductLine])

  return (
    <div className="grid gap-4 grid-cols-4 mb-4">
      <Selection
        label="Product:"
        value={selectedProduct}
        itemList={productList()}
        onSelect={setSelectedProduct}/>

      <Selection
        label="Line:"
        value={selectedProductLine}
        itemList={productLineList()}
        onSelect={setSelectedProductLine}/>
        
      <DatePickerSection
        picker={picker}
        value={moment(selectedDate)}
        onChange={(value, dateString) => setSelectedDate(dateString)}/>

      <Selection
        label="Period:"
        value={selectedPeriod}
        itemList={periodList}
        onSelect={setSelectedPeriod}/>
    </div>
  )
}

export default OEEVisualizeSelection
