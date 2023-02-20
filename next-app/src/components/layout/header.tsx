import { CommonStore } from "@/store/common.store";
import { message } from "antd";
import { useRouter } from "next/router";
import { FC, useEffect } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

interface IProps {
  title: string;
  backable?: boolean;
}

const Header: FC<IProps> = ({ title, backable }: IProps) => {
  const router = useRouter();
  const isLoading = CommonStore((state) => state.isLoading);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (isLoading) {
      messageApi.open({
        type: "loading",
        content: "Loading data ...",
        duration: 0,
      });
    } else {
      message.destroy();
    }
  }, [isLoading]);

  return (
    <>
      {contextHolder}
      <div className="w-full flex items-center p-4 shadow shadow-zinc-500">
        {backable && (
          <AiOutlineArrowLeft
            className="mr-4 cursor-pointer"
            size={18}
            onClick={() => router.back()}
          />
        )}
        <div className="text-xl font-bold">{title}</div>
      </div>
    </>
  );
};

export default Header;
