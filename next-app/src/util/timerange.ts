import dayjs, { Dayjs } from "dayjs";

export const createIntervalTimestamp = (
  interval: number,
  intervalUnit: dayjs.ManipulateType = "m",
  start?: Dayjs,
  end?: Dayjs
): Dayjs[] => {
  let intervalTime: Dayjs[] = [];
  const startDate = start ? start : dayjs().startOf("day");
  const endData = end ? end : dayjs().endOf("day");
  for (let d = startDate; d <= endData; d = d.add(interval, intervalUnit)) {
    intervalTime.push(d);
  }
  return intervalTime;
};
