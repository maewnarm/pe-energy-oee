import axios, { AxiosRequestConfig } from 'axios'
import environment from 'src/util/environment'

const axiosInstance = axios.create({
  baseURL: environment.API_URL
})

axiosInstance.interceptors.request.use((config: AxiosRequestConfig) => {
  config.headers = {
    ...config.headers,
    'X-API-Key': environment.API_KEY
  }
  return config
})

export default axiosInstance
