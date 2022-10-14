import { FC } from 'react'
import { OEEDekidakaItem } from '@/types/oee-dashboard.type'

interface IProps {
  itemList: OEEDekidakaItem[]
}
const OEEDekidakaTable: FC<IProps> = ({ itemList }: IProps) => {
  return (
    <div>
      <div className="text-2xl font-bold my-4">Dekidaka</div>
      <div className="grid grid-cols-4 text-xl text-center">
        <div className={`border border-black bg-sky-400 font-bold p-2`}>
          Working Period
        </div>
        <div className={`border border-black bg-sky-400 font-bold p-2`}>
          Actual / Plan
        </div>
        <div className={`border border-black bg-sky-400 font-bold p-2`}>
          Total Plan
        </div>
        <div className={`border border-black bg-sky-400 font-bold p-2`}>
          % OA
        </div>
      </div>
      { itemList.map((item, index) => {
        return (
          <div className="grid grid-cols-4 text-xl text-center" key={`${item.period}-${index}`}>
            <div className={`border border-black ${index % 2 === 0 ? 'bg-cyan-200':'bg-cyan-50'} p-2`}>
              { item.period }
            </div>
            <div className={`border border-black ${index % 2 === 0 ? 'bg-cyan-200':'bg-cyan-50'} p-2`}>
              <span>{ item.volumePerHr }</span>
              <span className="mx-2">/</span>
              <span>{ item.plan }</span>
            </div>
            <div className={`border border-black ${index % 2 === 0 ? 'bg-cyan-200':'bg-cyan-50'} p-2`}>
              { item.accPlan }
            </div>
            <div className={`border border-black ${index % 2 === 0 ? 'bg-cyan-200':'bg-cyan-50'} p-2`}>
              <span>{ item.percent }</span>
              <span>%</span>
            </div>
          </div>
        )
      }) }
      { itemList.length === 0 && <div className="border border-black p-4 text-center">No Data</div> }
    </div>
  )
}

export default OEEDekidakaTable