//@ts-nocheck

import React, { useEffect, useState } from "react";
import "./index.css";
import QuiverLogo from "../../src/assets/Frame 68.svg";
import { motion as m } from "framer-motion";
import { getName } from "@coinbase/onchainkit/identity";
import useQuiverStore from "../../store";
import { QuiverPayManagerABI } from "../contract/abi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { parseAbi } from "viem";
import { getConfig } from "../../config"; // your import path may vary
import { CA, TA, chain } from "../utils";
import btnOverlayW from "../../src/assets/btnOverlayW.svg";
import { toast } from "react-toastify";
import cardBg from "../../src/assets/cardBg.svg";
//import { useLocation, useNavigate } from "react-router-dom";

const abbreviateNumber = (value, decimals = 2) => {
  if (value === 0) return "0";
  if (value < 1000) return value.toFixed(decimals);

  const suffixes = ["", "k", "M", "B", "T"];
  const tier = Math.floor(Math.log10(value) / 3);

  const scaled = value / Math.pow(10, tier * 3);
  return scaled.toFixed(decimals) + suffixes[tier];
};

const formatWalletAddress = (address) => {
  // Ensure the address is a valid Ethereum address
  if (
    typeof address !== "string" ||
    address.length !== 42 ||
    !address.startsWith("0x")
  ) {
    console.log("BAD ADDR");
  }

  // Format the address by keeping the first 6 and last 4 characters, replacing the middle part with '*****'
  const firstPart = address.slice(0, 10); // First 6 characters (e.g., 0x48Ea12)
  const lastPart = address.slice(-10); // Last 4 characters (e.g., 59f)
  const middlePart = "********"; // The part we want to replace with stars

  const formattedAddress = `${firstPart}${middlePart}${lastPart}`;

  return formattedAddress;
};

function sformatWalletAddress(address) {
  // Ensure the address is a valid Ethereum address
  if (
    typeof address !== "string" ||
    address.length !== 42 ||
    !address.startsWith("0x")
  ) {
    console.log(address, "recieved Addr");
    console.log("BAD ADDR");
  }

  // Format the address by keeping the first 6 and last 4 characters, replacing the middle part with '*****'
  const firstPart = address.slice(0, 4); // First 6 characters (e.g., 0x48Ea12)
  const lastPart = address.slice(-4); // Last 4 characters (e.g., 59f)
  const middlePart = "****"; // The part we want to replace with stars

  const formattedAddress = `${firstPart}${middlePart}${lastPart}`;

  return formattedAddress;
}

const roundToTwo = (num) => {
  return Math.floor(num * 100) / 100;
};

const erc20Abi = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)", // ✅ added
]);

const UserMoneyCard: React.FC = () => {
  const setIsSettings = useQuiverStore((state) => state.setIsSettings);
  const userData = useQuiverStore((state) => state.userData);
  const reFreshCount = useQuiverStore((state) => state.reFreshCount);
  const [usdcBal, setUSDCBal] = useState<number | null>();
  const [gasTokenBal, setGasTokenBal] = useState<number | null>();
  const [copied, setIsCopied] = useState(false);
  const isViewBal = useQuiverStore((state) => state.isViewBal);
  const setIsViewBal = useQuiverStore((state) => state.setIsViewBal);
  const billInfo = useQuiverStore((state) => state.billInfo);
  const setUSDCBal_ = useQuiverStore((state) => state.setUSDCBal);
  const billBatch = useQuiverStore((state) => state.billBatch);

  const truncateBaseName = (name: string) => {
    return name.length < 30 ? name : name.slice(0, 18) + "...";
  };

  const getUSDBal = async () => {
    const usdc_Bal: string = await readContract(getConfig, {
      address: TA,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userData?.walletAddr],
    });

    setUSDCBal(roundToTwo(parseFloat(usdc_Bal) / 10 ** 6));
    setUSDCBal_(roundToTwo(parseFloat(usdc_Bal) / 10 ** 6));
  };

  useEffect(() => {
    getUSDBal();
    console.log(billBatch);
  }, [billInfo, reFreshCount, billBatch]);

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 600);
      })
      .catch((err) => {
        setIsCopied(false);
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <m.div
      className="cardContainer"
      style={{
        background: `url(${cardBg}) no-repeat center center /
              cover,
             ${userData?.card_color ? userData?.card_color : "#000"}`,
      }}
    >
      <div className="cardInfo-1">
        <h3 style={{ fontWeight: "600" }}>
          {usdcBal && isViewBal
            ? `${roundToTwo(usdcBal)}`
            : usdcBal == 0
            ? "0"
            : "****"}{" "}
          USDC
        </h3>

        <h3 style={{ textTransform: "uppercase" }}>Base</h3>
      </div>
      <h2 style={{ fontSize: "15px" }}>
        {userData?.walletAddr
          ? formatWalletAddress(userData?.walletAddr)
          : "Connect Wallet"}{" "}
        {copied ? (
          <i
            className="fa-solid fa-clipboard"
            style={{ marginLeft: "8px" }}
          ></i>
        ) : (
          <i
            onClick={() => copyToClipboard(userData?.walletAddr)}
            style={{ marginLeft: "8px" }}
            className="fa-solid fa-copy"
          ></i>
        )}
      </h2>

      <div className="cardInfo-2" style={{ textTransform: "uppercase" }}></div>

      <div className="enbTokenHolder">
        <p>
          <m.i
            class="fa-solid fa-bell"
            whileTap={{ scale: 1.2 }}
            onClick={() => {
              toast.error("ONLY USDC ON BASE SUPPORTED", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
              });
            }}
          ></m.i>
        </p>
        {/*<p>
            <m.i class="fa-solid fa-box" whileTap={{ scale: 1.2 }}></m.i>
            <h1 className="batch-n">{billBatch?.length}</h1>
          </p>*/}
        <p>
          <m.i
            className="fa-solid fa-gear"
            whileTap={{ scale: 1.2 }}
            onClick={() => setIsSettings(true)}
          ></m.i>
        </p>

        <p onClick={() => setIsViewBal(!isViewBal)}>
          {!isViewBal ? (
            <m.i className="fa-solid fa-eye" whileTap={{ scale: 1.2 }}></m.i>
          ) : (
            <m.i
              className="fa-solid fa-eye-slash"
              whileTap={{ scale: 1.2 }}
            ></m.i>
          )}
        </p>
      </div>
    </m.div>
  );
};

const colors = ["#FF7A00", "#00BFFF", "#FFD700", "#6A0DAD", "#2ECC71"];
interface ServiceProps {
  serviceName: string;
  Icon: any;
  color: string;
  isDisabled: boolean;
}

const Service: React.FC<ServiceProps> = ({
  color,
  Icon,
  serviceName,
  isDisabled = false,
}) => {
  const setIsPay = useQuiverStore((state) => state.setIsPay);

  return (
    <div className="serviceContainer">
      <m.div
        onClick={() => setIsPay(true, serviceName)}
        whileTap={{ scale: 1.2 }}
        className="serviceIconContainer"
        style={{ background: `${color}`, opacity: `${isDisabled && "0.3"}` }}
      >
        {Icon}
      </m.div>
      <h3 style={{ fontFamily: "Poppins", fontWeight: "400" }}>
        {serviceName}
      </h3>
    </div>
  );
};

const UserActionsContainer: React.FC = () => {
  const setIsTransfer = useQuiverStore((state) => state.setIsTransfer);

  return (
    <div className="userActionsContainer">
      <div className="btnContainer">
        <m.button
          whileTap={{ scale: 1.2 }}
          style={{ background: "#000" }}
          onClick={() => {
            toast.success(`ONRAMP COMING SOON`, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
            });
          }}
        >
          <div>
            Fund Wallet <i className="fa-solid fa-arrow-right"></i>
          </div>
        </m.button>
        <m.button whileTap={{ scale: 1.2 }} onClick={() => setIsTransfer(true)}>
          Transfer <i className="fa-solid fa-arrow-right"></i>
        </m.button>
      </div>
      <div className="servicesContainer">
        <Service
          serviceName="Airtime"
          color={colors[0]}
          Icon={<i className="fa-solid fa-sim-card"></i>}
        />
        <Service
          serviceName="Data"
          color={colors[1]}
          Icon={<i className="fa-solid fa-wifi"></i>}
        />
        <Service
          serviceName="Tv"
          color={colors[3]}
          Icon={<i className="fa-solid fa-tv"></i>}
        />
        <Service
          serviceName="Electricity"
          color={colors[2]}
          Icon={<i className="fa-solid fa-bolt"></i>}
        />
      </div>
    </div>
  );
};

const index: React.FC = () => {
  return (
    <div className="infoHolder">
      <div className="uf-Header"></div>
      <div>
        <div className="utilsContainer">
          <UserMoneyCard />
          <UserActionsContainer />
        </div>
      </div>
    </div>
  );
};

export default index;
