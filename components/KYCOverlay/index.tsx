//@ts-nocheck

import React, { useState, useEffect } from "react";
import "./index.css";
import { motion as m } from "framer-motion";
import useQuiverStore from "../../store";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { useConnect, useDisconnect, Connector } from "wagmi";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { API_ENDPOINT, RE_APPROVAL_WAIT_PERIOD } from "../utils";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom } from "viem";
import { base } from "viem/chains"; // or base, polygon, etc.
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  getERC20PaymasterApproveCall,
  gasTokenAddresses,
} from "@zerodev/sdk";
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { http, createPublicClient, zeroAddress, parseUnits } from "viem";
import { parseAccount } from "viem/accounts";
import { providerToSmartAccountSigner } from "permissionless";
import { handleApprove } from "../encodeFuncHelper";
import { TA, sendUSDC, chain } from "../utils";
import Loader from "../Loader";

import btnOverlayW from "../../src/assets/btnOverlayW.svg";
import btnOverlay from "../../src/assets/btnOverlay.svg";
import { toast } from "react-toastify";

const index: React.FC = () => {
  const setUserData = useQuiverStore((state) => state.setUserData);

  const [triggered, setIsTriggered] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [ninNumber, setNinNumber] = useState<string | null>(null);
  const [connectBtnHit, setConnectBtnHit] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  const navigate = useNavigate();

  const { user } = usePrivy();
  const location = useLocation();

  const KycUser = async () => {
    setIsProcessing(true);
    const res = await axios.post(`${API_ENDPOINT}/api/verify_user/`, {
      fullName: fullName,
      ninNumber: ninNumber,
      email: user?.email["address"],
    });
    setIsSuccess(res.data.success);
    if (!res.data.success) {
      toast.error(`KYC VERIFICATION FAILED`, {
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

    setIsProcessing(false);
  };

  return (
    <div
      className="overlayContainer"
      onClick={() => location.pathname != "/home" && setConnectClicked(false)}
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
        className="connectForm"
        style={{ bottom: "0px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="roleContainer">
          <div>
            <div className="roleBtnContainer">
              <div className="setDiv">
                <h2>{"KYC  REQUIRED"}</h2>

                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              {!isProcessing && (
                <>
                  {!isSuccess && (
                    <div className="infoContainer">
                      <input
                        type="text"
                        placeholder="FULL NAME"
                        onChange={(e) => setFullName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="NIN NUMBER"
                        onChange={(e) => setNinNumber(e.target.value)}
                      />
                    </div>
                  )}
                  <m.h1
                    style={{
                      background: `url(${btnOverlay}) no-repeat center center /
      cover,
     oklch(72.3% 0.219 149.579)`,
                    }}
                    onClick={() => {
                      KycUser();
                    }}
                    whileTap={{ scale: 1.2 }}
                  >
                    {isSuccess ? "KYC Successful" : "Tap to KYC"}
                    {isSuccess ? (
                      <i class="fa-solid fa-circle-check"></i>
                    ) : (
                      <i style={{ scale: 1.2 }} class="fa-solid fa-rocket"></i>
                    )}
                  </m.h1>
                </>
              )}

              {isProcessing && (
                <>
                  <p style={{ margin: "20px 10%" }}>Estimated 5 ~ 10 mins</p>
                  <m.h1
                    style={{
                      background: `url(${btnOverlay}) no-repeat center center /
      cover,
     oklch(72.3% 0.219 149.579)`,
                    }}
                    whileTap={{ scale: 1.2 }}
                  >
                    <Loader />
                  </m.h1>
                </>
              )}
            </div>
          </div>
        </div>
      </m.div>
    </div>
  );
};

export default index;
