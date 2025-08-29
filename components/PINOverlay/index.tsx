//@ts-nocheck

import "./index.css";
import React, { useEffect } from "react";
import { useRef, useState } from "react";
import { motion as m } from "framer-motion";
import btnOverlay from "../../src/assets/btnOverlay.svg";
import Loader from "../Loader";

import { toast } from "react-toastify";
import { API_ENDPOINT } from "../utils";
import axios from "axios";
import useQuiverStore from "../../store/";

const SetUpPIN: React.FC = () => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pin, setPIN] = useState<string | null>(null);
  const userData = useQuiverStore((state) => state.userData);
  const setUserData = useQuiverStore((state) => state.setUserData);

  const handleChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, ""); // Only numbers
    if (inputsRef.current[index]) {
      inputsRef.current[index]!.value = cleanValue;
    }

    // Move to next box on change
    if (cleanValue && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    triggerOnChange();
  };

  const getPINHash = async () => {
    if (pin?.length == 4) {
      setIsProcessing(true);
      try {
        const res = await axios.post(`${API_ENDPOINT}/api/cipher/`, {
          data: pin,
          type: "none",
        });
        setUserData({ ...userData, pinHash: res.data.data });
        setIsProcessing(false);
      } catch (e) {
        console.error(e);
      }
    }
  };
  // Combine all inputs into PIN
  const triggerOnChange = async () => {
    const pin_ = inputsRef.current.map((input) => input?.value || "").join("");
    setPIN(pin_);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      (e.key === "Backspace" || e.key === "Delete") &&
      !inputsRef.current[index]?.value &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const length = 4;

  useEffect(() => {
    console.log(pin);
  }, []);

  return (
    <div className="overlayPINContainer">
      <m.div
        className="pinForm"
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
          SETUP PIN <i className="fa-solid fa-key"></i>
        </h1>
        <div className="pinInputHolder">
          {Array.from({ length }).map((_, index) => (
            <input
              key={index}
              inputMode="numeric"
              maxLength={1}
              pattern="[0-9]*"
              ref={(el) => (inputsRef.current[index] = el)}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>
        <m.h1
          onClick={() => pin?.length == 4 && getPINHash()}
          whileTap={{ scale: 1.2 }}
          className="confirm-btn"
          style={{
            opacity: pin?.length != 4 && "0.5",
            background: `url(${btnOverlay}) no-repeat center center /
              cover,
             oklch(72.3% 0.219 149.579)`,
          }}
        >
          {!isProcessing ? "SET PIN" : <Loader />}
        </m.h1>
      </m.div>
    </div>
  );
};

const ConfirmPIN: React.FC = () => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const userData = useQuiverStore((state) => state.userData);
  const [pin, setPIN] = useState<string | null>(null);
  const setUserData = useQuiverStore((state) => state.setUserData);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, ""); // Only numbers
    if (inputsRef.current[index]) {
      inputsRef.current[index]!.value = cleanValue;
    }

    // Move to next box on change
    if (cleanValue && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    triggerOnChange();
  };

  // Combine all inputs into PIN
  const triggerOnChange = async () => {
    const pin_ = inputsRef.current.map((input) => input?.value || "").join("");
    setPIN(pin_);
  };

  const setUserPin = async () => {
    setIsProcessing(true);
    try {
      const res = await axios.post(`${API_ENDPOINT}/api/set_pin/`, {
        data: {
          sessionHash: localStorage.getItem("quiverUserSession"),
          pin: pin,
          email: userData?.email,
        },
      });
      setIsProcessing(false);
      if (!res.data.success) {
        toast.error(`INCORRECT PIN,CANCEL OR RETRY `, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } else {
        toast.success(`PIN CREATED SUCESSFULLY`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        setUserData({ ...userData, is_pin_active: res.data.success });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      (e.key === "Backspace" || e.key === "Delete") &&
      !inputsRef.current[index]?.value &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const length = 4;

  useEffect(() => {
    console.log(pin);
  }, []);

  return (
    <div className="overlayPINContainer">
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
        className="pinForm"
      >
        <h1>
          CONFIRM PIN <i className="fa-solid fa-key"></i>
        </h1>
        <m.div
          className="cancel-icon"
          whileTap={{ scale: 1.2 }}
          onClick={() => setUserData({ ...userData, pinHash: null })}
        >
          <i className="fa fa-times"></i>
        </m.div>

        <div className="pinInputHolder">
          {Array.from({ length }).map((_, index) => (
            <input
              key={index}
              inputMode="numeric"
              maxLength={1}
              pattern="[0-9]*"
              ref={(el) => (inputsRef.current[index] = el)}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>
        <m.h1
          onClick={() => pin?.length == 4 && setUserPin()}
          whileTap={{ scale: 1.2 }}
          className="confirm-btn"
          style={{
            opacity: !pin?.length == 4 && "0.5",
            background: `url(${btnOverlay}) no-repeat center center /
              cover,
             oklch(72.3% 0.219 149.579)`,
          }}
        >
          {!isProcessing ? "CONFIRM PIN" : <Loader />}
        </m.h1>
      </m.div>
    </div>
  );
};

const CheckPIN: React.FC = () => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const userData = useQuiverStore((state) => state.userData);
  const setIsCheckPIN = useQuiverStore((state) => state.setIsCheckPIN);
  const [pin, setPIN] = useState<string | null>(null);
  const setUserData = useQuiverStore((state) => state.setUserData);
  const [isProcessing, setIsProcessing] = useState(false);
  const setIsPay = useQuiverStore((state) => state.setIsPay);
  const billInfo = useQuiverStore((state) => state.billInfo);
  const setOffRampData = useQuiverStore((state) => state.setOffRampData);
  const setIsTxApproved = useQuiverStore((state) => state.setIsTxApproved);
  const isDisablingPIN = useQuiverStore((state) => state.isDisablingPIN);
  const setIsDisablingPIN = useQuiverStore((state) => state.setIsDisablingPIN);

  const handleChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, ""); // Only numbers
    if (inputsRef.current[index]) {
      inputsRef.current[index]!.value = cleanValue;
    }

    // Move to next box on change
    if (cleanValue && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    triggerOnChange();
  };

  // Combine all inputs into PIN
  const triggerOnChange = async () => {
    const pin_ = inputsRef.current.map((input) => input?.value || "").join("");
    setPIN(pin_);
  };

  const setUserPin = async () => {
    setIsProcessing(true);
    try {
      const res = await axios.post(`${API_ENDPOINT}/api/check_pin/`, {
        data: {
          pin: pin,
          email: userData?.email,
        },
      });
      setIsProcessing(false);
      if (!res.data.success) {
        toast.error(`INCORRECT PIN`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } else {
        if (!isDisablingPIN) {
          toast.success(`TRANSACTION APPROVED`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
        } else {
          toast.success(`CHANGE APPROVED`, {
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

        setIsCheckPIN(false);
        setIsTxApproved(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      (e.key === "Backspace" || e.key === "Delete") &&
      !inputsRef.current[index]?.value &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const length = 4;

  return (
    <div className="overlayPINContainer">
      <m.div
        className="pinForm"
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
          Transaction PIN <i className="fa-solid fa-key"></i>
        </h1>
        <m.div
          className="cancel-icon"
          whileTap={{ scale: 1.2 }}
          onClick={() => {
            setIsPay(false, billInfo?.type);
            setOffRampData(null);
            setIsCheckPIN(false);
            setIsTxApproved(false);
            setIsDisablingPIN(false);
          }}
        >
          <i className="fa fa-times"></i>
        </m.div>

        <div className="pinInputHolder">
          {Array.from({ length }).map((_, index) => (
            <input
              key={index}
              inputMode="numeric"
              maxLength={1}
              pattern="[0-9]*"
              ref={(el) => (inputsRef.current[index] = el)}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>
        <m.h1
          onClick={() => pin?.length == 4 && setUserPin()}
          whileTap={{ scale: 1.2 }}
          className="confirm-btn"
          style={{
            opacity: !pin?.length == 4 && "0.5",
            background: `url(${btnOverlay}) no-repeat center center /
              cover,
             oklch(72.3% 0.219 149.579)`,
          }}
        >
          {!isProcessing ? "CONFIRM" : <Loader />}
        </m.h1>
      </m.div>
    </div>
  );
};

export { SetUpPIN, ConfirmPIN, CheckPIN };
