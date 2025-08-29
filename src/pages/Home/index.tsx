//@ts-nocheck

import React from "react";
import "./index.css";
import { motion as m } from "framer-motion";
import Logos from "../../assets/logos.svg";
import Flow from "../../assets/flow.svg";
import Logo from "../../assets/Frame 68.svg";
import Arrow from "../../assets/arrow.svg";
import useQuiverStore from "../../../store";
import cardBg from "../../assets/cardBg.svg";

const Home: React.FC = () => {
  const setConnectClicked = useQuiverStore((state) => state.setConnectClicked);

  const connectUser = async () => {
    localStorage.removeItem("quiverUserSession");
    setConnectClicked(true);
  };

  return (
    <div className="parent-hmContainer">
      <div className="main-hmContainer">
        <div className="txt-container">
          <h1 className="hm-hero-txt">"Stables for everyday life."</h1>
          <p style={{ fontFamily: "Poppins" }}>
            Pay instantly. No off-ramp, no waiting. Data, Artime, and more all
            in one app, Keeping Your lights on with a single step.
          </p>
          <br />
          <m.button
            whileTap={{ scale: 1.2 }}
            style={{ fontFamily: "Poppins" }}
            onClick={() => connectUser()}
          >
            Start spending Now{" "}
            <i
              style={{ transform: "rotate(-45deg)" }}
              class="fa-solid fa-arrow-right"
            ></i>
          </m.button>
        </div>
      </div>

      <div className="serviceTime">
        <div className="logoDiv">
          <img src={Logos} />
        </div>
        <div className="infoDiv">
          <img src={Flow} />
          <h1>
            From Wallet To You in <br />
            <span>2 minutes</span>
          </h1>
          <p>~Quiver</p>
          <div className="servicesDiv">
            <i className="fa-solid fa-sim-card"></i>
            <i className="fa-solid fa-tv"></i>
            <i className="fa-solid fa-wifi"></i>
            <i className="fa-solid fa-bolt"></i>
            <i className="fa-solid fa-money-bill-transfer"></i>
          </div>
        </div>
        <div className="logoDiv">
          <img src={Logos} />
        </div>
      </div>
      <div className="contactDiv">
        <div
          className="ft"
          style={{
            background: `url(${cardBg}) no-repeat center center /
              cover,
             #000`,
          }}
        >
          <i className="fa-solid fa-charging-station"></i>
          <h3>All-in-one utility</h3>
          <p>
            Top up airtime,pay bills and shop,all from one app,with stablecoins.
          </p>
        </div>
        <div
          className="ft"
          style={{
            background: `url(${cardBg}) no-repeat center center /
              cover,
             #000`,
          }}
        >
          <i className="fas fa-credit-card"></i>
          <h3>Instant Payments</h3>
          <p>Send and Spend stablecoins easily.No delays,no middleman.</p>
        </div>
        <div
          className="ft"
          style={{
            background: `url(${cardBg}) no-repeat center center /
              cover,
             #000`,
          }}
        >
          <i className="fa-solid fa-globe"></i>
          <h3>Always accessible</h3>
          <p>No banks,no borders,just you and your stables anywhere.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
