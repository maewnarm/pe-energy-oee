import { FC } from 'react'
import Header from './header'

interface IProps {
  title: string
  children?: React.ReactNode
  backable?: boolean
}

const Container: FC<IProps> = ({ title, backable, children }: IProps) => {
  return (
    <>
      <Header title={title} backable={backable}/>
      <div className="w-full overflow-y-auto overflow-x-hidden" style={{ height: "calc(100vh - 64px)" }}>
        <div className="w-full h-full p-4 m-auto" style={{ maxWidth: '1400px' }}>
          {children}
        </div>
      </div>
    </>
  )
}

export default Container
