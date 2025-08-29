import { create } from "zustand";
import { loadState, saveSession } from "../components/utils";

let persistedState = await loadState();

interface UserData {
  walletAddr: string;
  role: string;
  reg_date: string;
  is_verified: boolean;
  email: string;
  pinHash: string | null;
  is_pin_active: boolean;
  is_pin_disabled: boolean;
  card_color: string | null;
}

interface Airtime {
  network: string | null;
  amount: number | null;
  phone_number: string | null;
  usdc_amount: string | null;
  fiat_amount: number | null;
  issuer_address: string | undefined;
  orderId: number;
  type: null | string;
}

interface Data {
  network: string | null;
  phone_number: string | null;
  plan: string | null;
  amount: number | null;
  usdc_amount: string | null;
  fiat_amount: number | null;
  issuer_address: string | undefined;
  orderId: number;
  data_plan: null | string;
  code: string;
  type: null | string;
}

interface Electricity {
  provider: string | null;
  meter_number: string | null;
  meter_owner: string | null;
  meter_address: string | null;
  meter_type: string | null;
  amount: number | null;
  usdc_amount: string | null;
  fiat_amount: number;
  issuer_address: string | undefined;
  type: null | string;
}

interface Cable {
  provider: string | null;
  iucNumber: string | null;
  code: string | null;
  cable_owner: string | null;
  amount: number | null;
  usdc_amount: string | null;
  fiat_amount: number;
  issuer_address: string | undefined;
  bouquet: string | null;
  type: null | string;
}

interface recvBank {
  //bankCode,account number,
  institution: string;
  accountIdentifier: string;
  accountName: string;
  memo: string;
  providerId: string;
}

interface offRampData {
  //token amount
  amount: number;
  token: string;
  rate: number;
  network: string;
  recipient: recvBank;
  returnAddress: string;
  reference: string;
  bankName: string;
}

interface QuiverState {
  userData: UserData | null;
  billBatch: (Airtime | Data | Electricity | Cable | null)[];
  connectClicked: boolean;
  isPay: boolean;
  isViewTxHistory: boolean;
  billType: string | null;
  billInfo: null | Airtime | Data | Electricity | Cable;
  isStake: boolean;
  isStaked: boolean;
  reFreshCount: number;
  usdcBal: number;
  isTransfer: boolean;
  kernelClient: any | null | number;
  offRampData: null | offRampData;
  isSettings: boolean;
  txHistory: any[] | null;
  totalTxColumns: number;
  isViewTxDetailHistory: boolean;
  isPending: boolean;
  isViewBal: boolean;
  isViewKYCForm: boolean;
  isCheckPIN: boolean;
  isTxApproved: boolean;
  isDisablingPIN: boolean;
  isChangeCardColor: boolean;
  setBillBatch: (
    _batch: (Airtime | Data | Electricity | Cable | null)[]
  ) => void;
  setIsChangeCardColor: (_isChangeCardColor: boolean) => void;
  setIsDisablingPIN: (txApproved: boolean) => void;
  setIsTxApproved: (txApproved: boolean) => void;
  setCheckPIN: (checkpin: boolean) => void;
  setIsKYCForm: (_isViewKYCForm: boolean) => void;
  setIsViewBal: (viewState: boolean) => void;
  setIsPending: (isPendingStatus: boolean) => void;
  setIsViewTxDetailHistory: (isViewState: boolean) => void;
  setTotalTxColumns: (txColumns: number) => void;
  setTxHistory: (txHistoryData: any[]) => void;
  setIsViewTxHistory: (isView: boolean) => void;
  setIsSettings: (settingsState: boolean) => void;
  setOffRampData: (data: offRampData | null) => void;
  setIsTransfer: (_isTransfer: boolean) => void;
  setUSDCBal: (bal: number) => void;
  incrementRefreshCount: () => void;
  setConnectClicked: (clickState: boolean) => void;
  setUserData: (data: null | UserData) => void;
  setIsPay: (isPay: boolean, billType: string) => void;
  setBillInfo: (bill: null | Airtime | Data | Electricity) => void;
  setIsStake: (isStake: boolean) => void;
  setIsStaked: (isStaked: boolean) => void;
}

const useQuiverStore = create<QuiverState>((set) => ({
  userData: null,
  connectClicked: false,
  isTransfer: false,
  billType: null,
  isPay: false,
  billInfo: [null],
  isStake: false,
  isStaked: false,
  usdcBal: 0,
  reFreshCount: 0,
  offRampData: null,
  isSettings: false,
  isViewTxHistory: false,
  txHistory: null,
  totalTxColumns: 0,
  isPending: false,
  isViewTxDetailHistory: false,
  isViewBal: true,
  isViewKYCForm: false,
  isCheckPIN: false,
  isTxApproved: false,
  isDisablingPIN: false,
  isChangeCardColor: false,
  setBillBatch: (_batch: (Airtime | Data | Electricity | Cable)[]) => {
    set(() => ({ billBatch: _batch }));
  },
  setIsChangeCardColor: (_isChangeCardColor: boolean) => {
    set(() => ({ isChangeCardColor: _isChangeCardColor }));
  },
  setIsDisablingPIN: (_isDisabling: boolean) => {
    set(() => ({ isDisablingPIN: _isDisabling }));
  },
  setIsTxApproved: (_txApproved: boolean) => {
    set(() => ({ isTxApproved: _txApproved }));
  },
  setIsCheckPIN: (_checkPIN: boolean) => {
    set(() => ({ isCheckPIN: _checkPIN }));
  },
  setIsViewKYCForm: (_isViewKYCForm: boolean) => {
    set(() => ({ isViewKYCForm: _isViewKYCForm }));
  },
  setIsViewBal: (isViewBal: boolean) => {
    set(() => ({ isViewBal: isViewBal }));
  },
  setIsPending: (isPendingStatus: boolean) => {
    set(() => ({ isPending: isPendingStatus }));
  },
  setIsViewTxDetailHistory: (isViewState: boolean) => {
    set(() => ({ isViewTxDetailHistory: isViewState }));
  },
  setTotalTxColumns: (txColumns: number) => {
    set(() => ({ totalTxColumns: txColumns }));
  },
  setTxHistory: (txHistoryData: any[]) => {
    set(() => ({ txHistory: txHistoryData }));
  },
  setIsViewTxHistory: (isView: boolean) => {
    set(() => ({ isViewTxHistory: isView }));
  },
  setIsSettings: (settingsState: boolean) => {
    set(() => ({ isSettings: settingsState }));
  },
  setOffRampData: (data: offRampData | null) => {
    set(() => ({ offRampData: data }));
  },
  setIsTransfer: (_isTransfer: boolean) => {
    set(() => ({ isTransfer: _isTransfer }));
  },
  setUSDCBal: (bal: number) => {
    set(() => ({ usdcBal: bal }));
  },
  incrementRefreshCount: () => {
    set((state) => ({ reFreshCount: state.reFreshCount + 1 }));
  },
  setKernelClient: (kernelCl: any | number) => {
    set(() => ({ kernelClient: kernelCl }));
  },
  setIsStake: (isStake: boolean) => {
    set(() => ({ isStake: isStake }));
  },
  setIsStaked: (isStaked: boolean) => {
    set(() => ({ isStaked: isStaked }));
  },
  setConnectClicked: (clickState: boolean) => {
    set(() => ({ connectClicked: clickState }));
  },
  setUserData: (data: UserData | null) => {
    set(() => ({ userData: data }));
  },
  setIsPay: (isPay: boolean, billType: string | null) => {
    set(() => ({ isPay: isPay, billType: billType }));
  },
  setBillInfo: (bill: Airtime | Data | Electricity) => {
    set(() => ({ billInfo: bill, billType: bill?.type }));
  },
  ...persistedState,
}));

useQuiverStore.subscribe((state) => {
  if (state.userData) {
    saveSession(state);
  }
});

export default useQuiverStore;
