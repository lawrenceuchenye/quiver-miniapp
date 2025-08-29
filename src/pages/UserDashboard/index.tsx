//@ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import "./index.css";

import { API_ENDPOINT } from "../../../components/utils";
import UserOverview from "../../../components/UserOverview";
import UserFinanceInfo from "../../../components/UserFinanceInfo";
import { JsonRpcProvider, Contract, formatUnits } from "ethers";
import { TA } from "../../../components/utils";
import { erc20Abi } from "viem";
import { toast } from "react-toastify";
import useQuiverStore from "../../../store";
import axios from "axios";
import { usePrivy } from "@privy-io/react-auth";

import { set } from "date-fns";

const Dashboard: React.FC = () => {
  const userData = useQuiverStore((state) => state.userData);
  const setUserData = useQuiverStore((state) => state.setUserData);
  const incrementRefreshCount = useQuiverStore(
    (state) => state.incrementRefreshCount
  );
  const setIsPending = useQuiverStore((state) => state.setIsPending);
  const setIsViewKYCForm = useQuiverStore((state) => state.setIsViewKYCForm);
  const { user } = usePrivy();
  const setConnectClicked = useQuiverStore((state) => state.setConnectClicked);
  const [processedTxs, setProcessedTxs] = useState<string[]>([]);

  const lastProcessedBlockRef = useRef<number>(0);

  // USDC Transfer event signature

  const roundToTwo = (num) => {
    return Math.round(num * 100) / 100;
  };

  const setUSDCBalListener = (targetAddress: string) => {
    const provider = new JsonRpcProvider(`${import.meta.env.VITE_NETWORK_RPC}`);
    const contract = new Contract(TA, erc20Abi, provider);

    let previousBalance: bigint;
    let txHashes = JSON.parse(localStorage.getItem("txHashSession")) || [];

    async function pollBalance() {
      try {
        const currentBalance: bigint = await contract.balanceOf(targetAddress);
        if (previousBalance !== undefined) {
          const diff = currentBalance - previousBalance;
          if (diff > 0n) {
            const filter = contract.filters.Transfer(null, targetAddress);
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = currentBlock;
            const events = await contract.queryFilter(
              filter,
              fromBlock,
              currentBlock + 1
            );

            for (const event of events) {
              if (!processedTxs.includes(event.transactionHash)) {
                console.log(event.transactionHash);
                setProcessedTxs([...processedTxs, event.transactionHash]);
                useQuiverStore.getState().incrementRefreshCount();
                toast.success(`${formatUnits(diff, 6)} USDC DEPOSITED`, {
                  position: "top-right",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "colored",
                });
                const sentAmnt: bigint = event?.args[2];
                await axios.post(`${API_ENDPOINT}/api/create_tx/`, {
                  type: "CashFlow",
                  amount: formatUnits(sentAmnt, 6),
                  from: event?.args[0],
                  to: userData?.walletAddr,
                });
              } else {
                console.log(processedTxs);
                return;
              }
            }
          } else if (diff < 0n) {
            useQuiverStore.getState().incrementRefreshCount();
            toast.error(`${formatUnits(diff * -1n, 6)} USDC DEBITTED`, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
            });
            setIsPending(false);
          }
        } else {
          console.log(
            `🔍 Initial balance: ${formatUnits(currentBalance, 6)} tokens`
          );
        }
        previousBalance = currentBalance;
      } catch (error) {
        console.log("Error polling balance!!!");
      }
    }
    return setInterval(pollBalance, 5000); // Poll every 2.5s
  };

  const isVerified = async () => {
    const res = await axios.post(`${API_ENDPOINT}/api/is_verified/`, {
      email: userData.email,
    });

    if (res.data.success) {
      setUserData({ ...userData, is_verified: true });
      setIsViewKYCForm(false);
    } else {
      setUserData({ ...userData, is_verified: false });
      setIsViewKYCForm(true);
    }
  };

  useEffect(() => {
    const intervalId = setUSDCBalListener(
      userData?.walletAddr ? userData?.walletAddr : "0x"
    );

    isVerified();
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!userData) {
      setConnectClicked(true);
      //navigate("");
    }
    if (!userData?.is_verified) {
      setIsViewKYCForm(true);
    }
  }, []);

  return (
    <div className="userDashboard">
      <UserOverview />
      <UserFinanceInfo />
    </div>
  );
};

export default Dashboard;
