//@ts-nocheck
import React, { useEffect, useState } from "react";
import "./index.css";
import { motion as m } from "framer-motion";
import useQuiverStore from "../../store";
import axios from "axios";
import { API_ENDPOINT } from "../utils";
import Loader from "../Loader";
import {
  formatDistanceToNow,
  parseISO,
  format,
  differenceInDays,
} from "date-fns";

interface TxContent {
  type: string;
  txInfo: any;
  txType: string;
  amount: number;
}

const roundToTwo = (num) => {
  return Math.floor(num * 100) / 100;
};

const Tx: React.FC<TxContent> = ({ type, amount, txInfo, txType }) => {
  const setBillInfo = useQuiverStore((state) => state.setBillInfo);
  const setIsViewTxDetailHistory = useQuiverStore(
    (state) => state.setIsViewTxDetailHistory
  );

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

  return (
    <div className="txHolder" key={txInfo.orderId}>
      <div
        className="purchaseTag"
        style={{
          background: "oklch(96.7% 0.001 286.375)",
          color: "#000",
        }}
      >
        {type == "Electricity" && (
          <i
            style={{ transform: "rotate(5deg)" }}
            className="fa-solid fa-bolt"
          ></i>
        )}
        {type == "Airtime" && (
          <i
            style={{ transform: "rotate(0deg)" }}
            className="fa-solid fa-sim-card"
          ></i>
        )}
        {type == "Data" && (
          <i
            style={{ transform: "rotate(0deg)" }}
            className="fa-solid fa-wifi"
          ></i>
        )}
        {type == "Tv" && (
          <i
            style={{ transform: "rotate(0deg)" }}
            className="fa-solid fa-tv"
          ></i>
        )}
        {type == "Withdrawal" && (
          <i
            style={{ transform: "rotate(0deg)" }}
            className="fa-solid fa-money-bill-transfer"
          ></i>
        )}
        {(type == "Deposit" || type == "Transfer") && (
          <i
            style={{
              fontSize: "24px",
              transform:
                type == "Deposit" ? "rotate(135deg)" : "rotate(-45deg)",
            }}
            className="fa-solid fa-arrow-right"
          ></i>
        )}
      </div>
      <div className="snipInfo">
        <p>
          <b>{type.charAt(0).toUpperCase() + type.slice(1)}</b>
        </p>
        <p>{humanizeDate(txInfo.date)}</p>
      </div>
      <div className="contentContainer">
        <div
          className="amountContainer"
          style={{
            color:
              amount < 0
                ? "oklch(63.7% 0.237 25.331)"
                : "hsl(166, 72.00%, 47.60%)",
            border:
              amount < 0
                ? "3px dashed rgba(251, 44, 54,1)"
                : "3px dashed rgba(34, 209, 169,1)",
            background: "transparent",
          }}
        >
          <h1>
            {`${
              amount > 0
                ? `+$${roundToTwo(amount)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                : `-$${
                    -1 *
                    roundToTwo(amount)
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }`
            }`}{" "}
          </h1>
        </div>
        <m.i
          onClick={() => {
            setBillInfo(txInfo);
            setIsViewTxDetailHistory(true);
          }}
          class="fa-solid fa-circle-exclamation"
          whileTap={{ scale: 1.3 }}
        ></m.i>
      </div>
    </div>
  );
};

const index: React.FC = () => {
  const userData = useQuiverStore((state) => state.userData);
  const setIsViewTxHistory = useQuiverStore(
    (state) => state.setIsViewTxHistory
  );
  const [txHistoryTemp, setTxHistory] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pageNumber, setPageNumber] = useState<number>(0);
  const totalTxColumns = useQuiverStore((state) => state.totalTxColumns);
  const [tempIndx, setTempIndx] = useState<boolean>(false);

  const updateTxHistory = async () => {
    setIsLoading(true);
    const data = await axios.post(
      `${API_ENDPOINT}/api/get_wallet_tx_details/`,
      {
        walletAddr: userData?.walletAddr,
        page_number: pageNumber,
      }
    );
    setTxHistory(data.data?.history);
    setIsLoading(false);
  };

  useEffect(() => {
    updateTxHistory();
  }, [pageNumber]);

  return (
    <div className="txHistoryOverlay" onClick={() => setIsViewTxHistory(false)}>
      <m.div
        onClick={(e: any) => e.stopPropagation()}
        className="historyContainer"
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
        <h1>
          Transactions
          <i className="fas fa-history"></i>
        </h1>
        <div className="txHolderContainer">
          {isLoading && (
            <div style={{ padding: "10px" }}>
              {" "}
              <Loader inverted={true} />
            </div>
          )}
          {(txHistoryTemp == null || txHistoryTemp.length < 1) &&
            !isLoading && (
              <div className="empty-tx-history">
                <p>
                  Nothing to see here. <i className="fa-solid fa-box-open"></i>
                </p>
              </div>
            )}
          {txHistoryTemp &&
            !isLoading &&
            txHistoryTemp.map((txPacket, index) => {
              return (
                <Tx
                  type={
                    txPacket.type == "CashFlow"
                      ? parseFloat(txPacket?.amount) < 0
                        ? "Transfer"
                        : "Deposit"
                      : txPacket.type
                  }
                  key={index}
                  amount={
                    txPacket.type == "CashFlow"
                      ? parseFloat(txPacket.amount) < 0
                        ? parseFloat(txPacket.amount)
                        : parseFloat(txPacket.amount)
                      : -parseFloat(txPacket.usdc_amount)
                  }
                  txInfo={txPacket}
                />
              );
            })}
        </div>
        <div className="paginationContainer">
          {Array.from({ length: totalTxColumns < 7 ? totalTxColumns : 7 }).map(
            (_, index) => {
              const start =
                pageNumber <= 3
                  ? 0
                  : pageNumber >= totalTxColumns - 4
                  ? totalTxColumns - 7
                  : pageNumber - 3;

              const pageIndex = start + index;

              // Ensure pageIndex stays in bounds
              if (pageIndex < 0 || pageIndex >= totalTxColumns) return null;

              return (
                <m.button
                  whileTap={{ scale: 1.3 }}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setPageNumber(pageIndex)}
                  key={pageIndex}
                  className={pageIndex === pageNumber ? "active" : "btn"}
                >
                  {pageIndex + 1}
                </m.button>
              );
            }
          )}
        </div>
      </m.div>
    </div>
  );
};

export default index;
