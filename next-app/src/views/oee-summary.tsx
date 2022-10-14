import { OEEDashboardStore } from '@/store/oee-dashboard.store'
import { FC } from 'react'

const OEESummary: FC = () => {
  const { production } = OEEDashboardStore()

  return (
    <div className="grid gap-4 grid-cols-2 mb-4">
      <div className="flex flex-col border border-black p-4">
        <div className="text-3xl font-bold">OEE</div>
        <div className="text-base font-bold">( Overall Equipment Effectiveness )</div>
        <div className="text-right">
          <span className="text-3xl text-amber-500">{ production?.percent ?? 0 }</span>
          { production?.percent !== '-' && <span className="text-lg text-black">%</span>}
        </div>
      </div>
      <div className="flex flex-col border border-black p-4">
        <div className="text-3xl font-bold">Production</div>
        <div className="mb-6"></div>
        <div className="text-right">
          <span className="text-3xl text-amber-500">{ production?.numerator ?? 0 }</span>
          <span className="mx-2">/</span>
          <span className="text-lg text-black">{ production?.denominator ?? 0} pcs</span>
        </div>
      </div>
    </div>
  )
}

export default OEESummary