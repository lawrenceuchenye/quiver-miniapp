//@ts-nocheck

import React, { useEffect, useState } from "react";
import "./index.css";
import { motion as m } from "framer-motion";
import useQuiverStore from "../../store";
import { toast } from "react-toastify";
import axios from "axios";
import { API_ENDPOINT } from "../utils";

const index: React.FC = () => {
  const billBatch = useQuiverStore((state) => state.billBatch);

  return (
    <div className="settingsOverlay">
      <m.div
        onClick={(e: any) => e.stopPropagation()}
        className="billsContainer"
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
        <div className="billsHeader">
          <h1>
            BATCHED BILLS
            <i className="fa-solid fa-charging-station"></i>
          </h1>
        </div>

        <div>
          {billBatch?.map((bill) => {
            return (
              <>
                <div className="bill-summary">
                  {bill?.type == "Airtime" && (
                    <p style={{ fontFamily: "Poppins" }}>
                      <i
                        style={{ marginRight: "10px" }}
                        className="fa-solid fa-sim-card"
                      ></i>
                      Airtime{" "}
                    </p>
                  )}
                  {bill?.type == "Data" && (
                    <p style={{ fontFamily: "Poppins" }}>
                      <i
                        style={{ marginRight: "10px" }}
                        className="fa-solid fa-wifi"
                      ></i>
                      Data{" "}
                    </p>
                  )}
                  {bill?.type == "Electricity" && (
                    <p style={{ fontFamily: "Poppins" }}>
                      <i
                        className="fa-solid fa-bolt"
                        style={{ marginRight: "10px" }}
                      ></i>
                      Electricity{" "}
                    </p>
                  )}
                  {bill?.type == "Tv" && (
                    <p style={{ fontFamily: "Poppins" }}>
                      <i
                        className="fa-solid fa-tv"
                        style={{ marginRight: "10px" }}
                      ></i>
                      TV{" "}
                    </p>
                  )}

                  <p>
                    {bill?.usdc_amount} USDC ~ {bill?.fiat_amount} NGN{" "}
                    <m.i
                      className="fa-solid fa-eye"
                      whileTap={{ scale: 0.8 }}
                      style={{ marginLeft: "15px" }}
                    ></m.i>
                    <m.i
                      className="fa-solid fa-trash"
                      whileTap={{ scale: 0.8 }}
                      style={{ marginLeft: "8px" }}
                    ></m.i>
                  </p>
                </div>
                <div className="line"></div>
              </>
            );
          })}
        </div>
        <button></button>
        <p
          style={{
            color: "oklch(70.4% 0.04 256.788)",
            textTransform: "lowercase",
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
