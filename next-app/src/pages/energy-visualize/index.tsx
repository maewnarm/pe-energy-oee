import Head from 'next/head'
import type { NextPage } from 'next'
import Link from 'next/link'
import Layout from '../../components/layout'

const EnergyHome: NextPage = () => {
  return (
    <>
      <div>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </div>
      <Layout
        title="Home"
        backable>
        <div className="w-full h-full flex flex-col justify-center">
          <div className="link-group animate__animated animate__fadeIn text-xl text-center">
            <Link href={"/energy-visualize/realtime"}>
              <p>Energy Visualize - Realtime</p>
            </Link>

            <Link href={"/energy-visualize/daily"}>
              <p>Energy Visualize - Daily</p>
            </Link>

            <Link href={"/energy-visualize/monthly"}>
              <p>Energy Visualize - Monthly</p>
            </Link>

            <Link href={"/energy-visualize/yearly"}>
              <p>Energy Visualize - Yearly</p>
            </Link>
          </div>
        </div>
      </Layout>
    </>
  )
}

export default EnergyHome
