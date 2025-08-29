//@ts-nocheck

import "./index.css";
import React, { useEffect, useState } from "react";
import { motion as m } from "framer-motion";
import axios from "axios";
import QuiverLogo from "../../src/assets/Frame 68.svg";
import { CA, TA, API_ENDPOINT, FEE_1, FEE_2, FEE_3 } from "../utils";
import useQuiverStore from "../../store";
import {
  formatDistanceToNow,
  parseISO,
  format,
  differenceInDays,
} from "date-fns";

import { useWriteContract } from "wagmi";
import { encodeFunctionData, parseAbi } from "viem";
import { parseUnits, zeroAddres } from "viem"; // to parse token amount correctly
import { QuiverPayManagerABI } from "../contract/abi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";

import { getConfig } from "../../config";
import { toast } from "react-toastify";
import { handleApprove, createOrder } from "../encodeFuncHelper";
import btnOverlay from "../../src/assets/btnOverlay.svg";
import btnOverlayW from "../../src/assets/btnOverlayW.svg";
import Loader from "../Loader";

const roundToThree = (num) => {
  return Math.round(num * 1000) / 1000;
};

const roundToTwo = (num) => {
  return Math.round(num * 100) / 100;
};

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
  const firstPart = address.slice(0, 4); // First 6 characters (e.g., 0x48Ea12)
  const lastPart = address.slice(-4); // Last 4 characters (e.g., 59f)
  const middlePart = "*****"; // The part we want to replace with stars

  const formattedAddress = `${firstPart}${middlePart}${lastPart}`;

  return formattedAddress;
}

const formatUtilityName = (input: string) => {
  return input
    .replace(/-/g, " ") // Replace all dashes with spaces
    .replace(/\belectric\b/i, "electricity") // Replace 'electric' with 'electricity' (whole word, case-insensitive)
    .toUpperCase(); // Convert to uppercase
};

const index: React.FC<summaryProp> = ({ billInfo, serviceName }) => {
  const [copied, setIsCopied] = useState(false);
  const setIsViewTxDetailHistory = useQuiverStore(
    (state) => state.setIsViewTxDetailHistory
  );
  const setIsPay = useQuiverStore((state) => state.setIsPay);
  const incrementRefreshCount = useQuiverStore(
    (state) => state.incrementRefreshCount
  );
  const setBillInfo = useQuiverStore((state) => state.setBillInfo);

  const humanizeDate = (dateISO) => {
    const date = parseISO(dateISO);
    const daysDifference = differenceInDays(new Date(), date);

    if (daysDifference <= 7) {
      // Recent: show humanized
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      // Older: show as formatted date
      return format(date, "MMM d, yyyy"); // e.g., "Jul 1, 2025"
    }
  };

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
    <div
      className="overlays-Container"
      onClick={() => {
        setIsViewTxDetailHistory(false);
        setBillInfo(null);
      }}
    >
      <m.div
        initial={{ y: "40px", opacity: 0 }}
        animate={{ y: "0px", opacity: 1 }}
        transition={{
          delay: 0.4,
          duration: 0.6,
          stiffness: 100,
          damping: 5,
          type: "spring",
        }}
        className="summaryForm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sfHeader">
          <img src={QuiverLogo} />
          <h1
            style={{
              fontFamily: "Monoton",
              fontWeight: "400",
              marginBottom: "50px",
              position: "relative",
              top: "26px",
            }}
          >
            <span style={{ marginRight: "10px" }}>TRANSACTION</span> DETAILS
          </h1>
        </div>

        <div className="serviceHeader">
          <h1>Service</h1>
          <div className="ServiceDiv">
            {serviceName == "Airtime" && (
              <p style={{ fontFamily: "Poppins" }}>
                Airtime <i className="fa-solid fa-sim-card"></i>
              </p>
            )}
            {serviceName == "Data" && (
              <p style={{ fontFamily: "Poppins" }}>
                Data <i className="fa-solid fa-wifi"></i>
              </p>
            )}
            {serviceName == "Electricity" && (
              <p style={{ fontFamily: "Poppins" }}>
                Electricity <i className="fa-solid fa-bolt"></i>
              </p>
            )}
            {serviceName == "Tv" && (
              <p style={{ fontFamily: "Poppins" }}>
                TV <i className="fa-solid fa-tv"></i>
              </p>
            )}
            {serviceName == "CashFlow" && (
              <p style={{ fontFamily: "Poppins" }}>
                CashFlow <i className="fa-solid fa-money-bill-transfer"></i>
              </p>
            )}
            {serviceName == "Withdrawal" && (
              <p style={{ fontFamily: "Poppins" }}>
                Withdrawal <i className="fa-solid fa-money-bill-transfer"></i>
              </p>
            )}
          </div>
        </div>
        <div className="line"></div>
        <h3>Description</h3>
        <div className="line"></div>

        {serviceName == "CashFlow" && (
          <div className="billInfo">
            {parseFloat(billInfo.amount) < 0 ? (
              <>
                <div>
                  <h4>Recipient</h4>
                  <p>
                    {sformatWalletAddress(billInfo.toAddr)}{" "}
                    {copied ? (
                      <i
                        className="fa-solid fa-clipboard"
                        style={{ marginLeft: "8px" }}
                      ></i>
                    ) : (
                      <i
                        onClick={() => copyToClipboard(billInfo.toAddr)}
                        style={{ marginLeft: "8px", cursor: "pointer" }}
                        className="fa-solid fa-copy"
                      ></i>
                    )}
                  </p>
                </div>
                <div>
                  <h4>Amount</h4>
                  <p>{billInfo.amount} USDC</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h4>Sender</h4>
                  <p>
                    {sformatWalletAddress(billInfo.fromAddr)}{" "}
                    {copied ? (
                      <i
                        className="fa-solid fa-clipboard"
                        style={{ marginLeft: "8px" }}
                      ></i>
                    ) : (
                      <i
                        onClick={() => copyToClipboard(billInfo.fromAddr)}
                        style={{ marginLeft: "8px", cursor: "pointer" }}
                        className="fa-solid fa-copy"
                      ></i>
                    )}
                  </p>
                </div>
                <div>
                  <h4>Amount</h4>
                  <p>+{billInfo.amount} USDC</p>
                </div>
              </>
            )}
          </div>
        )}

        {serviceName == "Withdrawal" && (
          <div className="billInfo">
            <div>
              <h1>Recipient Bank</h1>
              <p>{billInfo.bank_name}</p>
            </div>
            <div>
              <h1>Recipient Name</h1>
              <p style={{ width: "55%", textAlign: "right" }}>
                {billInfo.recipient_name}
              </p>
            </div>
            <div>
              <h1>Recipient Account Number</h1>
              <p>{billInfo.recipient_account_number}</p>
            </div>
            <div>
              <h1>Token Amount</h1>
              <p>-{billInfo.usdc_amount} USDC</p>
            </div>
            <div>
              <h1>Fiat Amount</h1>
              <p>+{roundToTwo(billInfo.fiat_amount)} NGN</p>
            </div>
          </div>
        )}

        {serviceName == "Data" && (
          <div className="billInfo">
            <div>
              <h4>Network</h4>
              <p>{billInfo.network}</p>
            </div>
            <div>
              <h4>Number</h4>
              <p>{billInfo.phone_number}</p>
            </div>
            <div>
              <h4>{billInfo.plan}</h4>
              <p>
                NGN {billInfo.fiat_amount} ~{" "}
                {roundToThree(
                  billInfo.usdc_amount -
                    (billInfo.usdc_amount < 0.65
                      ? FEE_1
                      : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                      ? FEE_2
                      : FEE_3)
                )}{" "}
                USDC
              </p>
              <div style={{ textAlign: "right", width: "100%" }}>
                <p style={{ marginLeft: "auto", fontWeight: "200" }}>
                  {billInfo.bundle}
                </p>
              </div>
            </div>
            <div>
              <h4>Service Charge</h4>
              <p>
                {" "}
                {billInfo.usdc_amount < 0.65
                  ? FEE_1
                  : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                  ? FEE_2
                  : FEE_3}{" "}
                USDC
              </p>
            </div>
          </div>
        )}

        {serviceName == "Airtime" && (
          <div className="billInfo">
            <div>
              <h4>Network</h4>
              <p>{billInfo.network}</p>
            </div>
            <div>
              <h4>Number</h4>
              <p>{billInfo.phone_number}</p>
            </div>
            <div>
              <h4>Amount</h4>
              <p>
                NGN {billInfo.fiat_amount} ~{" "}
                {roundToThree(
                  billInfo.usdc_amount -
                    (billInfo.usdc_amount < 0.65
                      ? FEE_1
                      : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                      ? FEE_2
                      : FEE_3)
                )}{" "}
                USDC
              </p>
            </div>
            <div>
              <h4>Service Charge</h4>
              <p>
                {billInfo.usdc_amount < 0.65
                  ? FEE_1
                  : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                  ? FEE_2
                  : FEE_3}{" "}
                USDC
              </p>
            </div>
          </div>
        )}

        {serviceName == "Electricity" && (
          <div className="billInfo">
            {/* <div>
              <h4>Provider</h4>
              <p>{formatUtilityName(billInfo.provider)}</p>
            </div>*/}
            <div>
              <h4>Meter Owner</h4>
              <p>{billInfo.meter_owner}</p>
            </div>

            <div>
              <h4>Meter Number</h4>
              <p>{billInfo.meter_number}</p>
            </div>
            <div>
              <h4>Amount</h4>
              <p>
                NGN {billInfo.fiat_amount} ~{" "}
                {roundToThree(
                  billInfo.usdc_amount -
                    (billInfo.usdc_amount < 0.65
                      ? FEE_1
                      : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                      ? FEE_2
                      : FEE_3)
                )}{" "}
                USDC
              </p>
            </div>
            <div>
              <h4>Service Charge</h4>
              <p style={{ fontFamily: "Poppins" }}>
                {" "}
                <b>
                  {billInfo.usdc_amount < 0.65
                    ? FEE_1
                    : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                    ? FEE_2
                    : FEE_3}{" "}
                  USDC
                </b>
              </p>
            </div>
          </div>
        )}
        {serviceName == "Tv" && (
          <div className="billInfo">
            <div>
              <h4>Provider</h4>
              <p>{formatUtilityName(billInfo.provider)}</p>
            </div>
            <div>
              <h4>Cable Owner</h4>
              <p>{billInfo.cableOwner}</p>
            </div>
            <div style={{ textAlign: "right", width: "100%" }}>
              <p style={{ marginLeft: "auto", fontWeight: "200" }}>
                {billInfo.bouquet}
              </p>
            </div>
            <div>
              <h4>IUC Number</h4>
              <p>{billInfo.iucNumber}</p>
            </div>
            <div>
              <h4>Amount</h4>
              <p>
                NGN {billInfo.fiat_amount} ~{" "}
                {roundToThree(
                  billInfo.usdc_amount -
                    (billInfo.usdc_amount < 0.65
                      ? FEE_1
                      : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                      ? FEE_2
                      : FEE_3)
                )}{" "}
                USDC
              </p>
            </div>
            <div>
              <h4>Service Charge</h4>
              <p style={{ fontFamily: "Poppins" }}>
                {" "}
                {billInfo.usdc_amount < 0.65
                  ? FEE_1
                  : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                  ? FEE_2
                  : FEE_3}{" "}
                USDC
              </p>
            </div>
          </div>
        )}

        {serviceName == "Electricity" && (
          <>
            <div className="line"></div>
            <div className="meterOwner" style={{ paddingBottom: "15px" }}>
              <h1 style={{ position: "relative", top: "5px" }}>
                {billInfo.token} ~ {billInfo.units}{" "}
                <i className="fa-solid fa-bolt"></i>
              </h1>
            </div>
          </>
        )}
        <div className="line"></div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItem: "center",
          }}
        >
          <h3>Total </h3>
          <p style={{ fontFamily: "Poppins" }}>
            {roundToThree(
              parseFloat(
                billInfo.type == "CashFlow"
                  ? billInfo.amount
                  : billInfo.usdc_amount
              )
            )}{" "}
            USDC
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItem: "center",
          }}
        >
          <h3>Delivered</h3>
          <p style={{ fontFamily: "Poppins" }}>{humanizeDate(billInfo.date)}</p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItem: "center",
          }}
        >
          <h3>Ref. ID</h3>
          <p style={{ fontFamily: "Poppins" }}>{billInfo.orderId}</p>
        </div>
        <div className="line"></div>
        <p
          style={{
            marginTop: "10px",
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

export default index;
