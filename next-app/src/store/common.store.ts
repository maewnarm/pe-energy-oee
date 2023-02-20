import { create } from "zustand";
import { ICommonState } from "./interface/common.interface";

export const CommonStore = create<ICommonState>((set, get) => ({
  isLoading: false,

  setIsLoading(isLoading: boolean) {
    set({ isLoading });
  },
}));
