import { Divider, Input, Tooltip } from "antd";
import { FC } from "react";

interface IProps {
  totalLine1Text: string;
  totalLine1: number;
  perUnitText?: string;
  perUnit?: number;
  totalLine2Text: string;
  totalLine2: number;
  targetAxisY: number;
  onTargetAxisYChange: (value: number) => void;
  targetAxisY1: number;
  onTargetAxisY1Change: (value: number) => void;
  convertDescription?: string;
}

const ChartDetail: FC<IProps> = ({
  totalLine1Text,
  totalLine1,
  perUnitText,
  perUnit,
  totalLine2,
  totalLine2Text,
  targetAxisY,
  onTargetAxisYChange,
  targetAxisY1,
  onTargetAxisY1Change,
  convertDescription,
}: IProps) => {
  return (
    <div className="flex flex-col h-full justify-center">
      <div className="text-base font-bold text-center my-4">Summary data</div>
      <div className="my-2">
        <div className="text-sm font-bold">Total</div>
        <div className="flex text-sm justify-end font-bold items-center">
          <Tooltip title={totalLine1}>
            <div className="text-end truncate text-gray-600 bg-gray-200 text-3xl px-2">
              {totalLine1.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </div>
          </Tooltip>
        </div>
        <div className="ml-1 text-xs flex justify-end">{totalLine1Text}</div>
      </div>
      <div className="my-2">
        <div className="text-sm font-bold">Total / piece</div>
        <div className="flex text-sm justify-end font-bold items-center">
          <Tooltip title={perUnit}>
            <div className="text-end truncate text-gray-600 bg-gray-200 text-3xl px-2">
              {perUnit?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ||
                0}
            </div>
          </Tooltip>
        </div>
        <div className="ml-1 text-xs flex justify-end">{perUnitText}</div>
      </div>
      <div className="my-2">
        <div className="text-sm font-bold">CO 2 emission</div>
        <div className="text-sm">{`[${convertDescription || ""}]`}</div>
        <div className="flex text-sm justify-end font-bold items-center">
          <Tooltip title={totalLine2}>
            <div className="text-end truncate text-gray-600 bg-gray-200 text-3xl px-2">
              {totalLine2.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </div>
          </Tooltip>
        </div>
        <div className="ml-1 text-xs flex justify-end">{totalLine2Text}</div>
      </div>
      <Divider type="horizontal" />
      <div className="text-base font-bold text-center">Target limit line</div>
      <div className="text-sm font-bold">Power consumption</div>
      <Input
        value={targetAxisY}
        onChange={(e) => onTargetAxisYChange(+e.target.value)}
        type="number"
        suffix="kWh"
      />
      <div className="text-sm font-bold">Power consumption per unit</div>
      <Input
        value={targetAxisY1}
        onChange={(e) => onTargetAxisY1Change(+e.target.value)}
        type="number"
        suffix="Wh/pc."
      />
    </div>
  );
};

export default ChartDetail;
