import type { AppProps } from 'next/app'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'

import Annotation from 'chartjs-plugin-annotation'

import 'animate.css'
import '../styles/main.scss'
import '../styles/main.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Annotation,
  Title,
  Tooltip,
  Filler,
  Legend
)

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
