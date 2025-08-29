//@ts-nocheck

import React, { useEffect, useState } from "react";
import "./index.css";
import { motion as m } from "framer-motion";
import useQuiverStore from "../../store";
import { toast } from "react-toastify";
import axios from "axios";
import { API_ENDPOINT } from "../utils";

const index: React.FC = () => {
  const setIsSettings = useQuiverStore((state) => state.setIsSettings);
  const [isChecked, setIsChecked] = useState<boolean>(false); // set to true if you want it checked by default
  const userData = useQuiverStore((state) => state.userData);
  const isDisablingPIN = useQuiverStore((state) => state.isDisablingPIN);
  const setUserData = useQuiverStore((state) => state.setUserData);
  const setIsTxApproved = useQuiverStore((state) => state.setIsTxApproved);
  const setIsDisablingPIN = useQuiverStore((state) => state.setIsDisablingPIN);
  const isTxApproved = useQuiverStore((state) => state.isTxApproved);

  const setPINDisabledStatus = () => {
    if (!isTxApproved) {
      setIsDisablingPIN(true);
    }
  };

  const setIsChangeCardColor = useQuiverStore(
    (state) => state.setIsChangeCardColor
  );

  const approveChange = async () => {
    const res = await axios.post(
      `${API_ENDPOINT}/api/set_pin_disable_status/`,
      {
        disabled: !userData?.is_pin_disabled,
        email: userData?.email,
      }
    );
    setUserData({ ...userData, is_pin_disabled: !userData?.is_pin_disabled });

    setIsTxApproved(false);
    setIsDisablingPIN(false);
  };

  useEffect(() => {
    if (isTxApproved) {
      approveChange();
    }
  }, [isTxApproved]);

  return (
    <div
      className="settingsOverlay"
      onClick={() => {
        setIsSettings(false);
        setIsTxApproved(false);
        setIsDisablingPIN(false);
      }}
    >
      <m.div
        onClick={(e: any) => e.stopPropagation()}
        className="settingsContainer"
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
          Settings
          <i className="fa-solid fa-gear" whileTap={{ scale: 1.2 }}></i>
        </h1>
        <div className="settingsContentContainer">
          <div
            style={{
              textTransform: "capitalize",
              fontFamily: "Poppins",
              margin: "15px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <p>Request Pin Reset</p>
            <m.h2
              className="setupPIN"
              whileTap={{ scale: 1.2 }}
              style={{ borderRadius: "15px" }}
            >
              <a
                style={{ textDecoration: "none" }}
                href="mailto:quiver.reach.official@gmail.com"
              >
                Reset <i className="fa-solid fa-key"></i>
              </a>
            </m.h2>
          </div>
          <div className="line"></div>
          <div
            style={{
              textTransform: "capitalize",
              fontFamily: "Poppins",
              margin: "15px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <p>Disable Pin</p>
            <m.h2
              style={{
                background:
                  userData?.is_pin_disabled && "oklch(64.5% 0.246 16.439)",
                border:
                  userData?.is_pin_disabled &&
                  "4px solid oklch(81% 0.117 11.638)",
                color: userData?.is_pin_disabled && "#fff",
                borderRadius: "15px",
              }}
              className="setupPIN"
              whileTap={{ scale: 1.2 }}
              onClick={() => setPINDisabledStatus()}
            >
              <a style={{ textDecoration: "none" }}>
                {userData?.is_pin_disabled ? "Disabled" : "Disable"}{" "}
                <i className="fa-solid fa-ban"></i>
              </a>
            </m.h2>
          </div>
          <div className="line"></div>
          <div
            style={{
              textTransform: "capitalize",
              fontFamily: "Poppins",
              margin: "15px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <p>Card Color</p>
            <m.h2
              className="setupPIN"
              whileTap={{ scale: 1.2 }}
              style={{ borderRadius: "15px" }}
              onClick={() => setIsChangeCardColor(true)}
            >
              <a style={{ textDecoration: "none" }}>
                Pick Color <i className="fas fa-eye-dropper"></i>
              </a>
            </m.h2>
          </div>
          {/* <div className="line"></div>
          <div
            style={{
              textTransform: "capitalize",
              fontFamily: "Poppins",
              margin: "15px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <p>Chat mode</p>
            <m.h2
              className="setupPIN"
              whileTap={{ scale: 1.2 }}
              style={{ borderRadius: "15px" }}
            >
              <a
                style={{ textDecoration: "none" }}
                href="mailto:quiver.reach.official@gmail.com"
              >
                Always on <i className="fa-solid fa-fire"></i>
              </a>
            </m.h2>
          </div>*/}

          <p
            style={{
              color: "oklch(70.4% 0.04 256.788)",
              textTransform: "lowercase",
              fontFamily: "Poppins",
            }}
          >
            *Click outside the form to exit
          </p>
        </div>
      </m.div>
    </div>
  );
};

export default index;
