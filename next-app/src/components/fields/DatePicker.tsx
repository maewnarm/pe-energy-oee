import { DatePicker } from "antd";
import { PickerProps } from "antd/lib/date-picker/generatePicker";
import { Moment } from "moment";
import { FC } from "react";

interface IProps {
  orientation?: "vertical" | "horizontal";
  datePickerLabel?: string;
}

const DatePickerSection: FC<IProps & PickerProps<Moment>> = ({
  orientation = "vertical",
  datePickerLabel = "",
  ...props
}: IProps & PickerProps<Moment>) => {
  return (
    <div className={`flex ${orientation === "vertical" ? "flex-col" : ""}`}>
      <div className="text-lg font-bold">{datePickerLabel}</div>
      <DatePicker {...props} allowClear={false} />
    </div>
  );
};

export default DatePickerSection;
