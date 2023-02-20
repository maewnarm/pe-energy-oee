import * as random from "./random";

const staticColors = [
  "#7840c2",
  "#dfdb16",
  "#fb1d89",
  "#4d7fb0",
  "#3ec97d",
  "#b8728e",
  "#b25bc1",
  "#4bc700",
  "#57f7e3",
  "#c8d8fc",
  "#9e0c1d",
  "#c8d8fc",
  "#4bc700",
  "#fb1d89",
  "#095f75",
  "#51f6f4",
  "#7840c2",
  "#10ad5a",
  "#a2af7f",
  "#bc4006",
  "#2cb2dd",
  "#654354",
  "#c1c640",
  "#eddfab",
  "#91108e",
  "#f8530d",
  "#050aa8",
  "#a33952",
  "#448df4",
  "#a1d125",
  "#d95270",
  "#a07971",
  "#1c3746",
  "#81a5e8",
  "#11d97a",
  "#c374bd",
  "#d0b67a",
  "#4396b0",
  "#f85fab",
  "#e9b716",
  "#c5feb9",
  "#0c6d32",
  "#fdee8f",
  "#92c7c7",
  "#f6bce7",
  "#495ebe",
  "#b6094d",
  "#15f023",
  "#ceaac1",
  "#263482",
];
const colorList: string[] = [];
for (let i = 0; i < 100; i++) {
  // randomize color
  // colorList.push('#' + Math.floor(Math.random()*16777215).toString(16))

  // static color
  colorList.push(staticColors[i % 50]);
}
const util = {
  getCharCodeFromString(str: string): number {
    let totalCodePoint = 0;
    for (let i = 0; i < str.length; i++) {
      totalCodePoint += str.charCodeAt(i);
    }

    return totalCodePoint;
  },

  getColorByIndex(index: number): string {
    return colorList[index];
  },

  serializeQuery(query: Record<string, any>) {
    const str = [];
    for (let [key, value] of Object.entries(query)) {
      str.push(`${key}=${value}`);
    }
    return str.join("&");
  },

  random,
};

export default util;
