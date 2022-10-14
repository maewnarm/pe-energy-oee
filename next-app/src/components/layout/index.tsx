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
      <div className="w-full p-4 m-auto" style={{ height: "calc(100vh - 60px)", maxWidth: '1400px' }}>{ children }</div>
    </>
  )
}

export default Container
