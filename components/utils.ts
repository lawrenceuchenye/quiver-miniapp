import { ethers } from "ethers";
import { toast } from "react-toastify";
import { erc20Abi } from "viem";
import { base } from "wagmi/chains";
import axios from "axios";
const chain = base;

const CA = "0x1d8b0d97900319aE0778cE45D67eA45cDaBF602B"; //"0x1d8b0d97900319aE0778cE45D67eA45cDaBF602B";
const TA = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const GAS_TOKEN_CA = "0xf73978b3a7d1d4974abae11f696c1b4408c027a0";
const API_ENDPOINT = "https://twiddlemart.com/";
const FEE_1 = 0.1;
const FEE_2 = 0.2;
const FEE_3 = 0.3;

const RE_APPROVAL_WAIT_PERIOD = 90 * 24 * 60 * 60 * 1000; // 3 months

// Setup
const provider = new ethers.JsonRpcProvider(
  `${import.meta.env.VITE_NETWORK_RPC}`
);
const privateKey = `${import.meta.env.VITE_USDC_FAUCET_PRIVATE_KEY}`; // Sender wallet
const wallet = new ethers.Wallet(privateKey, provider);

// Connect to the contract
const usdc = new ethers.Contract(TA, erc20Abi, wallet);

// Send 10 USDC (note: USDC has 6 decimals)
const sendUSDC = async (recvWallet: string) => {
  const tx = await usdc.transfer(recvWallet, ethers.parseUnits("0.01", 6));
  try {
    const receipt = await tx.wait();
    console.log("Transaction USDC confirmed:", await receipt.transactionHash);
  } catch (e) {
    toast.error("UNSTABLE INTERNET CONNECTION,TRY AGAIN LATER", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  }
};

interface Bank {
  name: string;
  type: string;
  code: string;
}

interface DataPoint {
  data: Bank;
  score: number;
}

const sentScore = (targetWord: string, word: string) => {
  const words = targetWord.toLowerCase().split("");
  let score = 0;
  words.forEach((letter) => {
    if (word.toLowerCase().includes(letter)) {
      score += 1;
    }
  });

  const cleanTarget = targetWord.toLowerCase().trim();
  const cleanWord = word.toLowerCase().trim();

  if (cleanTarget === cleanWord) return 100; // perfect match
  if (cleanWord.startsWith(cleanTarget)) return 90; // prefix match
  if (cleanWord.includes(cleanTarget)) return 70; // substring match
  for (const char of cleanTarget) {
    if (cleanWord.includes(char)) score += 1;
  }
  if (
    cleanTarget.split(" ").length < cleanWord.split(" ").length &&
    !cleanWord.includes(targetWord)
  ) {
    score -= targetWord.length;
  }

  return score;
};

const replaceBankNicknames = (input: string) => {
  let output = input;
  for (const [key, value] of Object.entries(bankNickName)) {
    const regex = new RegExp(`\\b${key}\\b`, "gi"); // match whole word, case-insensitive
    output = output.replace(regex, value);
  }
  return output;
};

const getClosestText = (target: string, textArray: Bank[]) => {
  const evalArray: DataPoint[] = [];
  textArray.forEach((el: Bank) => {
    evalArray.push({
      data: el,
      score:
        target.split(" ").length < el.name.split(" ").length
          ? sentScore(replaceBankNicknames(target.trimEnd()), el.name) - 5
          : sentScore(replaceBankNicknames(target.trimEnd()), el.name),
    });
  });

  return evalArray.sort((x, y) => {
    return y.score - x.score;
  });
};

const bankNickName = {
  gt: "Guaranty Trust Bank",
  uba: "United Bank of Africa",

  gtb: "Guaranty Trust Bank",
  gtbank: "Guaranty Trust Bank",

  ubank: "United Bank for Africa",
  zen: "Zenith Bank",
  zenith: "Zenith Bank",
  zenithbank: "Zenith Bank",
  access: "Access Bank",
  acc: "Access Bank",
  accessbank: "Access Bank",
  first: "First Bank of Nigeria",
  fbn: "First Bank of Nigeria",
  firstbank: "First Bank of Nigeria",

  fidelity: "Fidelity Bank",

  fcmbank: "First City Monument Bank",

  wema: "Wema Bank",
  wemabank: "Wema Bank",
  stanbic: "Stanbic IBTC Bank",
  stan: "Stanbic IBTC Bank",
  stanbicibtc: "Stanbic IBTC Bank",

  polaris: "Polaris Bank",
  skye: "Polaris Bank",
  skyebank: "Polaris Bank",

  union: "Union Bank",

  keystone: "Keystone Bank",

  heritage: "Heritage Bank",

  jaiz: "Jaiz Bank",

  taj: "TAJ Bank",
  tajbank: "TAJ Bank",

  opay: "OPay",
  opa: "OPay",

  kuda: "Kuda Microfinance Bank",

  moniepoint: "Moniepoint Microfinance Bank",
  teamapt: "Moniepoint Microfinance Bank",

  palmpay: "PalmPay",
  palm: "PalmPay",

  rubies: "Rubies Microfinance Bank",

  vfd: "VFD Microfinance Bank",
  vbank: "VFD Microfinance Bank",

  carbon: "Carbon",
  paylater: "Carbon",

  fairmoney: "FairMoney",
  fair: "FairMoney",

  eyowo: "Eyowo",

  sparkle: "Sparkle Bank",
};

const betterSentScore = (target: string, word: string): number => {
  const cleanTarget = target.toLowerCase().trim();
  const cleanWord = word.toLowerCase().trim();

  if (cleanTarget === cleanWord) return 100; // perfect match
  if (cleanWord.startsWith(cleanTarget)) return 90; // prefix match
  if (cleanWord.includes(cleanTarget)) return 70; // substring match

  // Character overlap score (weaker)
  let score = 0;
  for (const char of cleanTarget) {
    if (cleanWord.includes(char)) score += 1;
  }

  return score;
};

const getClosestSent = (target: string, textArray: Bank[]) => {
  const evalArray: DataPoint[] = [];
  textArray.forEach((el: Bank) => {
    evalArray.push({
      data: el,
      score: betterSentScore(replaceBankNicknames(target.trimEnd()), el.name),
    });
  });
  return evalArray.sort((x, y) => {
    return y.score - x.score;
  });
};

const saveSession = async (state: any) => {
  try {
    const data = JSON.stringify({
      ...state,
      is_verified: false,
      usd_bal: null,
    });
    const res = await axios.post(`${API_ENDPOINT}/api/cipher/`, {
      data: data,
      type: "none",
    });
    localStorage.setItem("quiverUserSession", res.data.data);
  } catch (e) {
    console.error("Failed to save Session:", e);
  }
};

const loadState = async () => {
  try {
    const serializedState = localStorage.getItem("quiverUserSession");
    const res = await axios.post(`${API_ENDPOINT}/api/cipher/`, {
      data: serializedState,
      type: "decrypt",
    });
    if (serializedState === null) return undefined;
    return JSON.parse(`${res.data.data}`);
  } catch (e) {
    console.error("Failed to load state from localStorage", e);
    return undefined;
  }
};

const hashStringSHA256 = async (message: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
};

export {
  saveSession,
  loadState,
  CA,
  hashStringSHA256,
  sendUSDC,
  chain,
  getClosestSent,
  getClosestText,
  TA,
  GAS_TOKEN_CA,
  API_ENDPOINT,
  FEE_1,
  FEE_2,
  FEE_3,
  RE_APPROVAL_WAIT_PERIOD,
};
