//@ts-nocheck

import React, { useEffect } from "react";
import QuiverLogo from "../../src/assets/Frame 68.svg";
import "./index.css";

import { motion as m } from "framer-motion";
import useQuiverStore from "../../store/";
import { usePrivy } from "@privy-io/react-auth";
import btnOverlayW from "../../src/assets/btnOverlayW.svg";
import { loadState } from "../utils";
import { useAccount, useConnect, useDisconnect } from "wagmi";

const Navbar: React.FC = () => {
  const setConnectClicked = useQuiverStore((state) => state.setConnectClicked);
  const setUserData = useQuiverStore((state) => state.setUserData);
  const userData = useQuiverStore((state) => state.userData);

  const { logout, login } = usePrivy();

  const disconnectUser = async () => {
    await logout();
    localStorage.removeItem("quiverUserSession");
    setUserData(null);
    //navigate("");
  };

  const connectUser = async () => {
    localStorage.removeItem("quiverUserSession");
    setConnectClicked(true);
  };

  useEffect(() => {
    if (localStorage.getItem("quiverUserSession")) {
    }
  }, []);

  return (
    <div className="qn-mainNavContainer">
      <div>
        <h3>
          <a
            style={{
              textDecoration: "none",
            }}
            href="mailto:quiver.reach.official@gmail.com"
          ></a>
        </h3>
      </div>
      <div className="logoContainer">
        <img src={QuiverLogo} />
        <h3 style={{ fontFamily: "Monoton" }}>Quiver</h3>
      </div>
      <div>
        <m.button
          style={{
            background: `url(${btnOverlayW}) no-repeat center center /
              cover,
            #000`,
          }}
          whileTap={{ scale: 1.2 }}
          onClick={() => (!userData ? connectUser() : disconnectUser())}
        >
          {userData ? "Disconnect" : "Connect"}{" "}
          <i className="fa-solid fa-wallet"></i>
        </m.button>
      </div>
    </div>
  );
};

const MobileNav: React.FC = () => {
  const setConnectClicked = useQuiverStore((state) => state.setConnectClicked);
  const setUserData = useQuiverStore((state) => state.setUserData);

  const userData = useQuiverStore((state) => state.userData);
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const disconnectUser = async () => {
    localStorage.removeItem("quiverUserSession");
    setUserData(null);
    disconnect();
  };

  const connectUser = async () => {
    connect({ connector: connectors[0] });
  };

  useEffect(() => {
    setUserData({
      walletAddr: address,
    });
  }, [address]);

  return (
    <>
      <div className="qn-mobileNavContainer">
        <div>
          <h1>
            <a
              style={{
                textDecoration: "none",
                fontSize: "26px",
                color: "#000",
                fontWeight: "400",
              }}
              href="mailto:quiver.reach.official@gmail.com"
            >
              Support?
            </a>
          </h1>
        </div>
        <m.button
          style={{
            background: `url(${btnOverlayW}) no-repeat center center /
              cover,
            #000`,
            fontSize: "16px",
          }}
          whileTap={{ scale: 1.2 }}
          onClick={() => (!isConnected ? connectUser() : disconnectUser())}
        >
          {isConnected ? "Disconnect" : "Connect"}{" "}
          <i className="fa-solid fa-wallet"></i>
        </m.button>
      </div>
    </>
  );
};

export { Navbar, MobileNav };
