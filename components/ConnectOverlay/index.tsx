//@ts-nocheck

import React, { useState, useEffect } from "react";
import "./index.css";
import { motion as m } from "framer-motion";
import useQuiverStore from "../../store";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { API_ENDPOINT } from "../utils";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom } from "viem";
import Loader from "../Loader";

import btnOverlayW from "../../src/assets/btnOverlayW.svg";
import btnOverlay from "../../src/assets/btnOverlay.svg";

const index: React.FC = () => {
  const [walletReadyBtnHit, setWalletReadyBtnHit] = useState(false);
  const [walletIsActive, setWalletIsActive] = useState<boolean>(true);
  const setConnectClicked = useQuiverStore((state) => state.setConnectClicked);
  const setUserData = useQuiverStore((state) => state.setUserData);
  const [embeddedWallet, setEmbeddedWallet] = useState<any | null>(null);
  const [triggered, setIsTriggered] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const [connectBtnHit, setConnectBtnHit] = useState<boolean>(false);
  const navigate = useNavigate();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const location = useLocation();
  const { wallets } = useWallets();

  const ensureWallet = async () => {
    if (user && !user.wallet) {
      await user.createWallet();
      // 🔑 Create embedded wallet
    }
  };

  const embeddedWalletSuccess = async (embeddedWallet: any) => {
    // Get the provider for the embeded wallet, we will use in the next section
    if (!embeddedWallet) {
      setConnectClicked(true);
      return;
    }

    const privyProvider = await embeddedWallet.getEthereumProvider();

    // Construct a Kernel
    // account
    // Pass your `smartAccountSigner` to the validator

    const userEmail = user?.email["address"];

    await axios
      .post(`${API_ENDPOINT}/api/create_user/`, {
        walletAddr: privyProvider?.address,
        email: userEmail,
      })
      .then(function (response) {
        setConnectClicked(false);
        if (response.data.success) {
          setUserData({
            walletAddr: response.data.user_data.walletaddress,
            role: response.data.user_data.role,
            reg_date: response.data.user_data.reg_date,
            is_verified: response.data.user_data.isVerified,
            is_pin_active: response.data.user_data.isPinActive,
            is_pin_disabled: response.data.user_data.disablePin,
            email: userEmail,
            card_color: "oklch(37.1% 0 0)",
          });
          navigate("/home");
        }
      })
      .catch(function (error) {
        console.log(error);
      });

    setConnectBtnHit(true);
  };

  const connectWallet = async (role: string) => {
    setRole(role);
    const embeddedWallet_ = await wallets.find(
      (wallet) => wallet.walletClientType === "privy"
    );

    if (!embeddedWallet_) {
      try {
        await login();
        await ensureWallet();
        embeddedWalletSuccess(embeddedWallet_);
      } catch (e) {
        setRole(null);
      }

      return;
    }
    embeddedWalletSuccess(embeddedWallet_);
  };

  const connectDoubleCall = async () => {
    await connectWallet(localStorage.getItem("role"));

    if (!authenticated) {
      await new Promise((res) => {
        connectWallet(role);
      });
    }

    setConnectBtnHit(true);
  };

  useEffect(() => {
    /*if (localStorage.getItem("quiverUserSession")) {
      setWalletIsActive(false);
      setTimeout(() => {
        setWalletIsActive(true);
      }, 4500);
    }*/
  }, []);

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
          {(!authenticated || !localStorage.getItem("role")) && (
            <div className="roleBtnContainer">
              <m.h1
                style={{
                  background: `url(${btnOverlayW}) no-repeat center center /
      cover,
    #000`,
                }}
                onClick={() => !connectBtnHit && connectWallet("REG_USER")}
                whileTap={{ scale: 1.2 }}
              >
                Spend Stables <i className="fa-solid fa-credit-card"></i>
              </m.h1>
            </div>
          )}

          {!(!localStorage.getItem("role") || !authenticated) && (
            <div>
              <div className="roleBtnContainer">
                <div className="setDiv">
                  <h2>
                    {!authenticated
                      ? "Wallet Ready"
                      : walletIsActive
                      ? "Sign in"
                      : "Recovering Wallet"}
                  </h2>
                  <i className="fa-solid fa-wallet" />
                </div>
                {(!connectBtnHit || !localStorage.getItem("role")) && (
                  <m.h1
                    style={{
                      background: `url(${btnOverlay}) no-repeat center center /
      cover,
     oklch(72.3% 0.219 149.579)`,
                      opacity: !walletIsActive && "0.5",
                    }}
                    onClick={() => {
                      !connectBtnHit && walletIsActive && connectDoubleCall();
                    }}
                    whileTap={{ scale: 1.2 }}
                  >
                    {role ? "Tap to Launch" : "Tap to Sign in"}
                    <i style={{ scale: 1.2 }} class="fa-solid fa-rocket"></i>
                  </m.h1>
                )}

                {connectBtnHit && localStorage.getItem("quiverUserSession") && (
                  <m.h1
                    style={{
                      background: `url(${btnOverlay}) no-repeat center center /
      cover,
     oklch(72.3% 0.219 149.579)`,
                    }}
                    onClick={() => !connectBtnHit && connectWallet(role)}
                    whileTap={{ scale: 1.2 }}
                  >
                    <Loader />
                  </m.h1>
                )}
              </div>
            </div>
          )}
          {!authenticated && (
            <p className="info">*Click outside the form to close.</p>
          )}
        </div>
      </m.div>
    </div>
  );
};

export default index;
