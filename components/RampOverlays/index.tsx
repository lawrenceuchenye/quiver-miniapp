//@ts-nocheck

import React, { useEffect, useState } from "react";
import "./index.css";
import axios from "axios";
import Logo from "../../src/assets/Frame 68.svg";
import { motion as m } from "framer-motion";
import { transferUSDC } from "../encodeFuncHelper";
import useQuiverStore from "../../store";
import { toast } from "react-toastify";
import Loader from "../Loader";
import { getClosestSent, getClosestText } from "../utils";
import btnOverlayW from "../../src/assets/btnOverlayW.svg";
import { API_ENDPOINT, hashStringSHA256 } from "../utils";
import { usePrivy } from "@privy-io/react-auth";
import { getNames } from "@coinbase/onchainkit/identity";
import { base } from "viem/chains";
import JSEncrypt from "jsencrypt";
import btnOverlay from "../../src/assets/btnOverlay.svg";

function sformatWalletAddress(address) {
  const session = localStorage.getItem("quiverUserSession");
  if (!session) {
    window.location.href = "/";
  }

  // Ensure the address is a valid Ethereum address
  if (
    typeof address !== "string" ||
    address.length !== 42 ||
    !address.startsWith("0x")
  ) {
    console.log("BAD ADDR");
  }

  // Format the address by keeping the first 6 and last 4 characters, replacing the middle part with '*****'
  const firstPart = address.slice(0, 6); // First 6 characters (e.g., 0x48Ea12)
  const lastPart = address.slice(-6); // Last 4 characters (e.g., 59f)
  const middlePart = "*****"; // The part we want to replace with stars

  const formattedAddress = `${firstPart}${middlePart}${lastPart}`;

  return formattedAddress;
}

const roundToThree = (num) => {
  return Math.floor(num * 1000) / 1000;
};

const roundToFour = (num) => {
  return Math.floor(num * 10000) / 10000;
};

interface Bank {
  name: string;
  type: string;
  code: string;
}

const OffRamp: React.FC = () => {
  const [pricingData, setPricingData] = useState<number | null>(null);
  const [targetID, setTargetID] = useState<null | string>(null);
  const [targetBank, setTargetBank] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [recvBank, setRecvBank] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [baseName, setBaseName] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const incrementRefreshCount = useQuiverStore(
    (state) => state.incrementRefreshCount
  );
  const { user } = usePrivy();
  const isPending = useQuiverStore((state) => state.isPending);
  const setIsPending = useQuiverStore((state) => state.setIsPending);
  const userData = useQuiverStore((state) => state.userData);
  const [isEVMTarget, setIsEVMTarget] = useState<boolean>(false);
  const setOffRampData = useQuiverStore((state) => state.setOffRampData);
  const [supportedBank, setSupportedBanks] = useState<null | Bank[]>(null);
  const setIsCheckPIN = useQuiverStore((state) => state.setIsCheckPIN);
  const usdcBal = useQuiverStore((state) => state.usdcBal);
  const setIsTransfer = useQuiverStore((state) => state.setIsTransfer);
  const isTxApproved = useQuiverStore((state) => state.isTxApproved);
  const setIsTxApproved = useQuiverStore((state) => state.setIsTxApproved);

  const getPrice = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_NGN_USDC_RATE_ENDPOINT}`
      );
      setPricingData(res.data.data);
    } catch (e) {}
  };

  const isEVMAddr = (input: string) => {
    const trimmed = input.trim();

    const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmed);
    const isBankAccount = /^\d{6,20}$/.test(trimmed); // Adjust range if needed

    if (isEvmAddress) return true;
    if (isBankAccount) return false;

    return false;
  };

  const obfuscateEmail = (email) => {
    const [local, domain] = email.split("@");
    const combined = local + domain;

    const prefix = combined.slice(0, 4); // First 4 characters
    const suffix = combined.slice(-4); // Last 6 characters (e.g. "il.com", "mail.com", etc.)

    return local;
  };

  const sendTx = () => {
    if (!isTxApproved && !userData?.is_pin_disabled) {
      setIsCheckPIN(true);
      return;
    }

    if (isEVMAddr(targetID)) {
      setIsEVMTarget(true);
    } else {
      setIsEVMTarget(false);
    }
    setIsProcessing(true);
  };

  const fetchSupportedBank = async () => {
    try {
      const res = await axios.get(
        "https://api.paycrest.io/v1/institutions/ngn"
      );
      setSupportedBanks(res.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getPrice();
    fetchSupportedBank();
  }, []);

  useEffect(() => {
    if (isPending == false) {
      setAmount(0);
    }
  }, [isPending]);

  const handlUserTx = async () => {
    const userEmail = obfuscateEmail(user?.email["address"]);

    if (isTxApproved || userData?.is_pin_disabled) {
      console.log("processimng");
      setIsTxApproved(false);
      if (isEVMTarget) {
        setIsProcessing(true);
        const res = await axios.post(
          `${API_ENDPOINT}/api/wallet_withdrawal_ops/`,
          {
            type: "transfer",
            amount: amount,
            from: userData?.walletAddr,
            to: targetID,
          }
        );
        setIsSuccess(res.data.success);
        if (res.data.success) {
          await axios.post(`${API_ENDPOINT}/api/create_tx/`, {
            type: "CashFlow",
            amount: -amount,
            from: userData?.walletAddr,
            to: targetID,
          });
          setIsProcessing(false);
          setIsPending(true);
        } else {
          setIsPending(false);
          setTimeout(() => {
            setIsProcessing(false);
            setIsTxApproved(false);
            setIsEVMTarget(false);
          }, 3000);
        }
      } else {
        if (!pricingData) {
          toast.info("LOADING RATES ", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
          setIsTxApproved(false);
          setIsProcessing(false);
          return;
        }

        if (amount < 1000) {
          toast.error(`AMOUNT TO LOW TO WITHDRAW MIN. NGN 1000`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
          setIsTxApproved(false);
          setIsProcessing(false);
          return;
        }

        if (usdcBal < roundToThree(amount / pricingData)) {
          toast.error(`FUND WALLET TO TRANSACT`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
          setIsTxApproved(false);
          setIsProcessing(false);
          return;
        }

        if (
          usdcBal <
          roundToThree(amount / pricingData) +
            roundToThree(amount / pricingData) * 0.02
        ) {
          toast.error(
            `INSUFFICIENT AMOUNT TO COVER FEE ${
              roundToThree(amount / pricingData) * 0.02
            }`,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
            }
          );
          setIsTxApproved(false);
          setIsProcessing(false);
          return;
        }

        setIsProcessing(true);
        const suggestedBank = getClosestText(targetBank, supportedBank)[0].data;
        const hashId = await hashStringSHA256(
          `${userData?.walletAddr} - ${targetID} - ${new Date()}`
        );
        setOffRampData({
          amount: roundToThree((amount + 1) / pricingData),
          token: "USDC",
          rate: pricingData,
          network: "base",
          recipient: {
            institution: suggestedBank.code,
            accountIdentifier: targetID,
            accountName: recvBank,
            memo: `from ${userEmail}`,
            providerId: "",
          },
          returnAddress: userData?.walletAddr,
          reference: hashId,
          bankName: targetBank,
        });
        setIsProcessing(false);
      }
    }
  };

  useEffect(() => {
    if (isProcessing || isTxApproved) {
      handlUserTx();
    }
    console.log("called");
  }, [isTxApproved, isProcessing]);

  const getBankInfo = async () => {
    if (supportedBank) {
      setIsVerifying(true);
      setRecvBank(null);
      const suggestedBank = getClosestText(targetBank, supportedBank)[0].data;
      setTargetBank(suggestedBank.name);
      const bankData = {
        institution: suggestedBank.code,
        accountIdentifier: targetID, // sample account identifier
      };

      try {
        const data = await axios.post(
          "https://api.paycrest.io/v1/verify-account",
          bankData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (data.data.data == "OK") {
          const data = await axios.post(
            "https://api.paycrest.io/v1/verify-account",
            bankData,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          setRecvBank(data.data.data.toLowercase);
        } else {
          console.log("not OK");
          console.log(recvBank);
          setRecvBank(data.data.data);
        }
        console.log(data.data.data);
        if (data.data.data == "OK") {
          setRecvBank("INVALID BANK DETAILS");
        }
      } catch (e) {
        setRecvBank("INVALID BANK DETAILS");
      }
      setIsVerifying(false);
      return -1;
    }
  };

  const resolveWalletAddrENS = async () => {
    console.log("Names");
    const addresses = [targetID];
    const names = await getNames({ addresses, chain: base });
    if (names[0]) {
      setBaseName(names[0]);
    }
  };

  useEffect(() => {
    setBaseName(null);
    if (targetID) {
      if (isEVMAddr(targetID)) {
        resolveWalletAddrENS();
      }
    }
    setRecvBank(null);
  }, [targetID]);

  return (
    <div className="rampOverlay" onClick={() => setIsTransfer(false)}>
      <m.div
        onClick={(e: any) => e.stopPropagation()}
        className="offRampContainer"
        initial={{ y: "40px", opacity: 0 }}
        animate={{ y: "0px", opacity: 1 }}
        transition={{
          delay: 0.4,
          duration: 0.6,
          stiffness: 100,
          damping: 5,
          type: "spring",
        }}
      >
        <div className="header">
          <img src={Logo} />
          <h1 style={{ fontWeight: "400" }}>TRANSFER</h1>
        </div>

        <input
          type="text"
          style={{ fontSize: "30px" }}
          placeholder="Wallet Address or Account Number"
          onBlur={targetBank && getBankInfo}
          onChange={(e) => {
            if (e.target.value == "") {
              setTargetBank(null);
              setIsVerifying(false);
              setRecvBank(null);
              setAmount(0);
            }
            setTargetID(e.target.value);
          }}
        />
        {targetID && isEVMAddr(targetID) && (
          <div className="ratesContainer">
            <div
              style={{
                fontFamily: "Poppins",
                margin: "25px 0",
              }}
            >
              <b style={{ textTransform: "uppercase" }}>Recipient:</b>{" "}
              <div className="walletAddressTag">
                <p>{baseName ? baseName : sformatWalletAddress(targetID)}</p>
              </div>
            </div>
            <div
              style={{
                fontFamily: "Poppins",
                position: "relative",
                left: "-8px",
              }}
            >
              {" "}
              <b style={{ textTransform: "uppercase" }}>Chain:</b>{" "}
              <div
                className="walletAddressTag"
                style={{
                  background: "oklch(88.2% 0.059 254.128)",
                  width: "100px",
                  margin: "0 35px",
                }}
              >
                <p>
                  <i className="fa-solid fa-stop"></i> BASE
                </p>
              </div>
            </div>
          </div>
        )}
        {targetID && !isEVMAddr(targetID) && (
          <input
            type="text"
            value={targetBank}
            onBlur={getBankInfo}
            placeholder="Bank Name"
            onChange={(e) => setTargetBank(e.target.value)}
          />
        )}

        <div className="amntContainer">
          <input
            type="number"
            placeholder="Amount"
            value={!Number.isNaN(amount) && amount}
            max={targetID && isEVMAddr(targetID) ? 100 : 100000}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
          />
          <h1>
            {targetID && isEVMAddr(targetID)
              ? "USDC"
              : !targetID
              ? "USDC"
              : "NGN"}
          </h1>
        </div>
        {targetBank && (
          <div
            className="accountOwner"
            style={{
              background:
                recvBank?.includes("INVALID") && "oklch(71.2% 0.194 13.428)",
              color: recvBank?.includes("INVALID") && "#fff",
            }}
          >
            <p>
              {isVerifying
                ? "VERIFYING..."
                : `${
                    recvBank
                      ? recvBank
                      : !isVerifying && recvBank == "OK"
                      ? "INVALID BANK DETAILS"
                      : "VERIFYING..."
                  }`}
            </p>
          </div>
        )}
        <div className="ratesContainer">
          {targetID && !isEVMAddr(targetID) && (
            <p
              style={{
                fontFamily: "Poppins",
              }}
            >
              1 USDC ~ NGN {pricingData}
            </p>
          )}
          <p
            style={{
              fontFamily: "Poppins",
            }}
          >
            <b>Balance:</b>
            <span
              style={{
                color:
                  usdcBal < roundToThree(amount / pricingData) &&
                  "oklch(64.5% 0.246 16.439)",
              }}
            >
              {usdcBal}
            </span>
            USDC
            {targetID &&
              !isEVMAddr(targetID) &&
              ` | Approx. ${
                Number.isNaN(roundToThree(amount / pricingData))
                  ? "0"
                  : roundToThree(amount / pricingData)
              } USDC`}
          </p>
        </div>
        <m.button
          style={{
            opacity:
              (isVerifying ||
                (targetID &&
                  !isEVMAddr(targetID) &&
                  recvBank?.includes("INVALID")) ||
                amount < 0 ||
                amount.toString().length < 0) &&
              "0.5",
            background: `url(${btnOverlayW}) no-repeat center center /
                        cover,
                      #000`,
            padding: "12px 8px",
          }}
          onClick={() =>
            !isProcessing && sendTx(targetID ? targetID : "0x", amount)
          }
          whileTap={{ scale: 1.3 }}
        >
          {isPending || isProcessing ? (
            <Loader />
          ) : isPending && !isSuccess ? (
            "INSUFFICIENT FUNDS"
          ) : (
            "Confirm"
          )}
        </m.button>

        <p
          style={{
            color: "oklch(70.4% 0.04 256.788)",
            fontFamily: "Poppins",
          }}
        >
          *Click outside the form to exit
        </p>
      </m.div>
    </div>
  );
};

const OffRampSummary: React.FC = () => {
  const offRampData = useQuiverStore((state) => state.offRampData);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [offRampSuccess, setOffRampSuccess] = useState<boolean | null>(null);

  const incrementRefreshCount = useQuiverStore(
    (state) => state.incrementRefreshCount
  );
  const setOffRampData = useQuiverStore((state) => state.setOffRampData);

  const hashRecipt = async (recipient) => {
    const response = await axios.get("https://api.paycrest.io/v1/pubkey");
    console.log(response);
    const publicKey = await response.data.data;
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    const encrypted = encrypt.encrypt(JSON.stringify(recipient));
    if (!encrypted) {
      throw new Error("Failed to encrypt recipient data");
    }
    return encrypted;
  };
  var intervalId;

  const offRamp = async () => {
    setIsProcessing(true);
    const res = await axios.post(`${API_ENDPOINT}/api/wallet_withdrawal_ops/`, {
      type: "withdrawal",
      data: {
        info: offRampData,
        encryptedRecipient: await hashRecipt(offRampData?.recipient),
      },
    });
    incrementRefreshCount();
    console.log(res.data.info[1]);
    intervalId = setInterval(async () => {
      const res_ = await axios.post(`${API_ENDPOINT}/api/get_order_status/`, {
        orderId: res.data.info[1],
        id: res.data.wo_id,
      });
      console.log(res_);
      if (res_.data.data.isFulfilled) {
        setOffRampSuccess(true);
        setIsProcessing(false);
        clearInterval(intervalId);
      } else {
        if (res_.data.data.isRefunded) {
          setOffRampSuccess(false);
          setIsProcessing(false);
          clearInterval(intervalId);
        }
      }
    }, 7000);
  };

  return (
    <div className="offRampSummaryOverlay" onClick={() => setOffRampData(null)}>
      <m.div
        className="offRampContainer"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: "40px", opacity: 0 }}
        animate={{ y: "0px", opacity: 1 }}
        transition={{
          delay: 0.4,
          duration: 0.6,
          stiffness: 100,
          damping: 5,
          type: "spring",
        }}
      >
        <div className="header">
          <img src={Logo} />
          <h1>SUMMARY</h1>
        </div>
        <div className="line"></div>
        <div className="section-1">
          <div>
            <h3>RECIPIENT</h3>
          </div>
          <div>
            <p>{offRampData?.recipient.accountName}</p>
            <p>
              <span>
                <b>{offRampData?.bankName.toUpperCase()}</b>
              </span>{" "}
              |<span>{offRampData?.recipient.accountIdentifier}</span>
            </p>
          </div>
        </div>
        <div className="line"></div>
        <div className="section-1">
          <div>
            <h3>TOKEN AMOUNT</h3>
          </div>
          <div>
            <p>
              {roundToThree(offRampData?.amount)} {offRampData?.token}
            </p>
            <p>
              <span>1 USDC ~ NGN {offRampData?.rate}</span>
            </p>
          </div>
        </div>
        <div className="line"></div>
        <div className="section-1">
          <div>
            <h3>FIAT AMOUNT</h3>
          </div>
          <div>
            <p>NGN {roundToThree(offRampData?.amount * offRampData?.rate)}</p>
          </div>
        </div>
        <div className="line"></div>
        <div className="section-1">
          <div>
            <h3>FEE</h3>
          </div>
          <div>
            <p>{roundToFour(offRampData?.amount * 0.02)} USDC</p>
          </div>
        </div>
        <m.button
          whileTap={{ scale: 1.3 }}
          style={{
            background: offRampSuccess
              ? `url(${btnOverlay}) no-repeat center center / cover, oklch(72.3% 0.219 149.579),
            padding: 16px 8px`
              : `url(${
                  offRampSuccess == null ? btnOverlayW : btnOverlay
                }) no-repeat center center /
                        cover,
                      ${
                        offRampSuccess == null
                          ? "#000"
                          : "oklch(57.7% 0.245 27.325)"
                      }`,
            fontSize: "15px",
          }}
          onClick={() => offRamp()}
        >
          {!isProcessing ? (
            <>
              {offRampSuccess != null ? (
                offRampSuccess ? (
                  <p>
                    Withdrawal Successful{" "}
                    <i className="fa-solid fa-check-circle"></i>
                  </p>
                ) : (
                  <p>
                    Withdrawal Failed,Retry <i className="fa-solid fa-undo"></i>{" "}
                  </p>
                )
              ) : (
                <p>
                  Continue <i className="fa-solid fa-arrow-right"></i>
                </p>
              )}
            </>
          ) : (
            <Loader />
          )}
        </m.button>
      </m.div>
    </div>
  );
};
export { OffRamp, OffRampSummary };
