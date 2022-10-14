import * as random from './random'

const colorList: string[] = []
for(let i =0; i<100; i++) {
  colorList.push('#' + Math.floor(Math.random()*16777215).toString(16))
}
const util = {
  getCharCodeFromString(str: string): number {
    let totalCodePoint = 0
    for (let i=0; i< str.length; i++) {
      totalCodePoint += str.charCodeAt(i)
    }

    return totalCodePoint
  },

  getColorByIndex (index: number): string {
    return colorList[index]
  },

  serializeQuery (query: Record<string, any>) {
    const str = []
    for (let [key, value] of Object.entries(query)) {
      str.push(
        `${key}=${value}`
      )
    }
    return str.join('&')
  },

  random
}

export default util
