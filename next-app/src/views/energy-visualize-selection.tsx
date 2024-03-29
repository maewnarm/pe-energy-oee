import { fetchEnergySetting } from "@/actions";
import DatePickerSection from "@/components/fields/DatePicker";
import Selection from "@/components/fields/Selection";
import { EnergySettingStore } from "@/store";
import moment from "moment";
import { FC, ReactNode, useEffect } from "react";

interface IProps {
  picker?: "date" | "month" | "year";
  hidePicker?: boolean;
  rightSection?: ReactNode;
  datePickerLabel?: string;
}

const EnergyVisualizeSelection: FC<IProps> = ({
  picker = "date",
  hidePicker,
  rightSection,
  datePickerLabel = "",
}: IProps) => {
  const {
    productList,
    productLineList,
    selectedProduct,
    selectedProductLine,
    selectedDate,
    setSelectedProduct,
    setSelectedProductLine,
    setSelectedDate,
  } = EnergySettingStore();

  useEffect(() => {
    const controller = new AbortController();
    fetchEnergySetting({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setSelectedProductLine("");
  }, [selectedProduct]);

  return (
    <div className="grid gap-4 grid-cols-3">
      <Selection
        label="Product:"
        value={selectedProduct}
        itemList={productList()}
        onSelect={setSelectedProduct}
      />

      <Selection
        label="Line:"
        value={selectedProductLine}
        itemList={productLineList()}
        onSelect={setSelectedProductLine}
      />

      <div className="flex flex-col justify-center">
        {!hidePicker && (
          <DatePickerSection
            datePickerLabel={datePickerLabel}
            picker={picker}
            value={moment(selectedDate)}
            onChange={(value, dateString) => setSelectedDate(dateString)}
          />
        )}
        {rightSection && rightSection}
      </div>
    </div>
  );
};

export default EnergyVisualizeSelection;
