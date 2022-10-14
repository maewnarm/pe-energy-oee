import Head from 'next/head'
import type { NextPage } from 'next'
import Layout from '../components/layout'
import Link from 'next/link'

const Home: NextPage = () => {
  return (
    <>
      <div>
        <Head>
          <title>Home</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </div>
      <Layout
        title="Home">
        <div className="w-full h-full flex flex-col justify-center">
          <div className="link-group animate__animated animate__fadeIn text-xl text-center">
            <Link href={"/energy-visualize"}>
              <p>Energy Visualize</p>
            </Link>
            <Link href={"/oee-visualize"}>
              <p>OEE Visualize</p>
            </Link>
          </div>
        </div>
      </Layout>
    </>
  )
}

export default Home
