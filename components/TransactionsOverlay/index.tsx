//@ts-nocheck

import "./index.css";
import React, { useEffect, useState } from "react";
import { motion as m } from "framer-motion";
import axios from "axios";
import QuiverLogo from "../../src/assets/Frame 68.svg";
import { CA, TA, API_ENDPOINT, FEE_1, FEE_2, FEE_3 } from "../utils";
import useQuiverStore from "../../store";

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

const maskMiddle = (text) => {
  const length = text.length;

  // Handle very short strings
  if (length < 4) {
    const maskCount = Math.floor(length / 2);
    return text.slice(0, length - maskCount) + "*".repeat(maskCount);
  }

  // Calculate mask length (40% of total)
  const maskLength = Math.floor(length * 0.4);
  const startLength = Math.floor((length - maskLength) / 2);
  const endLength = length - (startLength + maskLength);

  const start = text.slice(0, startLength);
  const masked = "*".repeat(maskLength);
  const end = text.slice(length - endLength);

  return start + masked + end;
};

const isValidNigerianNumber = (number) => {
  // Remove spaces and dashes
  const cleaned = number.replace(/[\s-]/g, "");

  // Regex for local format (e.g. 08012345678)
  const localRegex = /^0(70|80|81|90|91|71)\d{8}$/;

  // Regex for international format (e.g. +2348012345678 or 2348012345678)
  const intlRegex = /^(\+?234)(70|80|81|90|91|71)\d{8}$/;

  return localRegex.test(cleaned) || intlRegex.test(cleaned);
};

const detectNetwork = (phoneNumber: string) => {
  const prefix = phoneNumber.slice(0, 4); // assumes number is in local format like 0803xxxxxxx

  const mtn = [
    "0803",
    "0806",
    "0703",
    "0706",
    "0813",
    "0816",
    "0810",
    "0814",
    "0903",
    "0906",
    "0913",
    "0916",
  ];
  const glo = ["0805", "0807", "0705", "0811", "0815", "0905", "0915"];
  const airtel = [
    "0802",
    "0808",
    "0708",
    "0812",
    "0902",
    "0901",
    "0907",
    "0912",
  ];
  const nineMobile = ["0809", "0817", "0818", "0909", "0908", "0918"];

  if (mtn.includes(prefix)) return "MTN NG";
  if (glo.includes(prefix)) return "GLO NG";
  if (airtel.includes(prefix)) return "AIRTEL NG";
  if (nineMobile.includes(prefix)) return "9MOBILE NG";

  if (!isValidNigerianNumber(phoneNumber) && phoneNumber.length > 10) {
    return "INVALID NUMBER";
  }

  return "";
};

interface Props {
  type: string | null;
}

interface Bundle {
  price: number;
  title: string;
}

interface Bouquet {
  code: string;
  title: string;
  price: string;
}

// Define your ERC20 contract's ABI
const erc20Abi = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)", // ✅ added
]);

const Send: React.FC<Props> = ({ type }) => {
  const [supportedNetworkProviders, setSupportedNetworkProviders] = useState<
    string[] | null
  >(null);
  const userData = useQuiverStore((state) => state.userData);
  const billBatch = useQuiverStore((state) => state.billBatch);
  const setBillBatch = useQuiverStore((state) => state.setBillBatch);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [pricingData, setPricingData] = useState<number | null>(null);
  const [fiatAmountToSend, setFiatAmountToSend] = useState(
    type == "Electricity" ? 1000 : 100
  );

  const [selectorIndex, setSelectorIndex] = useState<number>(0);
  //DATA SPECIFIC FIELDS
  const [activeNetwork, setActiveNetwork] = useState<string | null>("MTN NG");
  const [activeBundleDuration, setActiveBundleDuration] =
    useState<string>("DAILY");
  const [dataBundles, setDataBundles] = useState<Bundle[] | null>(null);
  const [supportedBundleDurations, setSupportedBundleDurations] = useState<
    string[] | null
  >(null);
  const [activeDataBundle, setActiveDataBundle] = useState<Bundle | null>(null);

  //ELECTRICITY SPECIFIC
  const [meterNumber, setMeterNumber] = useState<null | string>(null);
  const [meterOwner, setMeterOwner] = useState<null | string>(null);
  const [electricityProviders, setElectricityProviders] = useState<
    string[] | null
  >(null);
  const [activeElectricityProvider, setActiveElectricityProvider] = useState<
    string | null
  >(null);
  const [activeMeterType, setActiveMeterType] = useState<string>("PREPAID");
  const [verifiedMeterOwner, setVerifiedMeterOwner] = useState<any | null>(
    null
  );

  // CABLE SPECIFIC
  const [cableProviders, setCableProviders] = useState<string[] | null>(null);
  const [cableProviderBouquets, setCableProviderBouquets] = useState<
    Bouquet[] | null
  >();
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeCableProvider, setActiveCableProvider] =
    useState<string>("DStv");
  const [activeCableProviderBouquet, setActiveCableProviderBouquet] =
    useState<Bouquet | null>(null);
  const [iucNumber, setIUCNumber] = useState<string | null>(null);
  const [verifiedCableOwner, setVerifiedCableOwner] = useState<any | null>(
    null
  );
  const setBillInfo = useQuiverStore((state) => state.setBillInfo);
  const setIsPay = useQuiverStore((state) => state.setIsPay);

  const [usdcBal, setUSDCBal] = useState<number | null>(null);

  const getUSDBal = async () => {
    const usdc_Bal: string = await readContract(getConfig, {
      address: TA,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userData?.walletAddr],
    });
    setUSDCBal(parseFloat(usdc_Bal) / 10 ** 6);
  };

  const handleChange = async (event: any) => {
    if (!pricingData) {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_NGN_USDC_RATE_ENDPOINT}`
        );
        setPricingData(res.data.data);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const getPrice = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_NGN_USDC_RATE_ENDPOINT}`
      );
      setPricingData(res.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  const bundlePackagePick = (bundle_index) => {
    const bundle_info = dataBundles[bundle_index];
    setFiatAmountToSend(bundle_info.price);
    setActiveDataBundle(bundle_info);
  };

  var requestOptions = {
    method: "GET",
    redirect: "follow",
  };

  const to_str = (val: any) => {
    return `${val}`;
  };

  const populateFields = async () => {
    const res = await axios.get(`${API_ENDPOINT}/api/get_network_providers/`);
    setSupportedNetworkProviders(res.data.providers);
    setActiveNetwork(res.data.providers[0].title);
    setSupportedBundleDurations(res.data.durations);
    if (type == "Electricity") {
      const res_electricity = await axios.get(
        `${API_ENDPOINT}/api/get_electricity_providers/`
      );
      setElectricityProviders(res_electricity.data.data);
      setActiveElectricityProvider(res_electricity.data.data[0].slug);
    }

    if (type == "Tv") {
      const res_cable = await axios.get(
        `${API_ENDPOINT}/api/get_cable_providers/`
      );
      setCableProviders(res_cable.data.providers);
      setActiveCableProvider(res_cable.data.providers[0].title);
      const res_cable_bouquet = await axios.post(
        `${API_ENDPOINT}/api/get_cable_provider_bouquets/`,
        {
          provider: res_cable.data.providers[0].title,
        }
      );
      setCableProviderBouquets(res_cable_bouquet.data.bouquets);
      setActiveCableProviderBouquet(res_cable_bouquet.data.bouquets[0]);
    }
  };

  useEffect(() => {
    getUSDBal();
    getPrice();
    populateFields();
  }, []);

  const getActiveBundles = async () => {
    if (type == "Data") {
      const res = await axios.post(`${API_ENDPOINT}/api/get_data_bundles/`, {
        activeNetwork: activeNetwork,
        activeBundleDuration: activeBundleDuration,
      });
      setDataBundles(res.data.bundles);
      setSelectorIndex(0);
      setFiatAmountToSend(res.data.bundles[0].price);
      setActiveDataBundle(res.data.bundles[0]);
    }
  };

  const getMeterOwner = async () => {
    if (type == "Electricity") {
      setIsVerifying(true);
      setVerifiedMeterOwner(null);
      const res = await axios.post(`${API_ENDPOINT}/api/get_meter_owner/`, {
        activeElectricityProvider: activeElectricityProvider,
        activeMeterType: activeMeterType,
        meterNumber: meterNumber,
      });
      setVerifiedMeterOwner(res.data);

      if (res.data.success) {
        setTimeout(() => {
          setIsVerifying(false);
          setMeterOwner(res.data.data.customerName);
        }, 3000);
      } else {
        setTimeout(() => {
          setIsVerifying(false);
        }, 7500);
      }
    }
  };

  const getCableOwner = async () => {
    if (type == "Tv") {
      setVerifiedCableOwner(null);
      if (iucNumber?.length > 9) {
        setIsVerifying(true);
        const res = await axios.post(`${API_ENDPOINT}/api/get_cable_owner/`, {
          activeCableProvider: activeCableProvider,
          iucNumber: iucNumber,
        });
        setVerifiedCableOwner(res.data);
        setIsVerifying(false);
      }
    }
  };

  const getActiveProviderBouquets = async () => {
    if (type == "Tv") {
      setVerifiedCableOwner(null);
      const res_cable_bouquet = await axios.post(
        `${API_ENDPOINT}/api/get_cable_provider_bouquets/`,
        {
          provider: activeCableProvider,
        }
      );
      if (res_cable_bouquet?.data) {
        setCableProviderBouquets(res_cable_bouquet?.data?.bouquets);
        setActiveCableProviderBouquet(res_cable_bouquet?.data?.bouquets[0]);
        setFiatAmountToSend(res_cable_bouquet?.data?.bouquets[0]?.price);
      }
    }
  };

  useEffect(() => {
    getActiveBundles();
  }, [activeNetwork, activeBundleDuration]);

  useEffect(() => {
    getMeterOwner();
  }, [activeElectricityProvider, activeMeterType, meterNumber]);

  useEffect(() => {
    getActiveProviderBouquets();
  }, [activeCableProvider]);

  useEffect(() => {
    if (type == "Tv") {
      setFiatAmountToSend(activeCableProviderBouquet?.price);
    }
  }, [activeCableProviderBouquet]);

  useEffect(() => {
    getCableOwner();
  }, [iucNumber]);

  return (
    <div
      className="overlay-Container"
      onClick={() => {
        setIsPay(false, null);
        setBillInfo(null);
      }}
    >
      <m.div
        className="connectForm"
        initial={{ y: "40px", opacity: 0 }}
        animate={{ y: "0px", opacity: 1 }}
        transition={{
          delay: 0.4,
          duration: 0.6,
          stiffness: 100,
          damping: 5,
          type: "spring",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="header">
          <h1 style={{ fontFamily: "Monoton", fontWeight: "400" }}>
            {type}

            {type == "Airtime" && (
              <i
                className="fa-solid fa-sim-card"
                style={{ marginLeft: "20px" }}
              ></i>
            )}

            {type == "Data" && (
              <i
                className="fa-solid fa-wifi"
                style={{ marginLeft: "20px" }}
              ></i>
            )}
            {type == "Tv" && (
              <i className="fa-solid fa-tv" style={{ marginLeft: "10px" }}></i>
            )}
            {type == "Electricity" && (
              <i
                className="fa-solid fa-bolt"
                style={{ marginLeft: "20px" }}
              ></i>
            )}
          </h1>
        </div>
        <h1 style={{ fontWeight: "600", fontSize: "24px" }}>CURRENCY</h1>
        <div className="currency-header">
          <select name="currencies" onClick={handleChange}>
            <option value="usdc">USDC</option>
          </select>
          <div>
            <p>
              <b>BALANCE:</b> <i>{usdcBal ? roundToThree(usdcBal) : "****"}</i>
            </p>
          </div>
        </div>
        <div className="txData">
          <div style={{ display: "flex", alignItems: "center" }}>
            <p>NGN</p>
            {type != "Data" && type != "Tv" ? (
              <input
                type="number"
                min="100"
                max="10000"
                placeholder="NGN 100.00 - NGN 10,000.00"
                value={fiatAmountToSend}
                onChange={(e) => {
                  setFiatAmountToSend(e.target.value);
                }}
              />
            ) : (
              <input
                type="number"
                min="100"
                max="10000"
                placeholder="NGN 100.00 - NGN 10,000.00"
                value={fiatAmountToSend}
                readOnly
              />
            )}
          </div>

          <div className="estimate">
            <p>
              <b>Approx.</b>{" "}
              {pricingData
                ? roundToThree(
                    fiatAmountToSend
                      ? fiatAmountToSend / pricingData
                      : 100 / pricingData
                  )
                : "0"}{" "}
              USDC
            </p>
          </div>
        </div>
        <p>1 USDC ~ NGN {pricingData}</p>
        {type == "transfer-wallet" && (
          <div className="recWalletAddress">
            <input type="text" placeholder="Reciever's Wallet Address" />
          </div>
        )}

        {type == "Airtime" && (
          <div className="airtime-container">
            <select onChange={(e) => setActiveNetwork(e.target.value)}>
              {supportedNetworkProviders &&
                supportedNetworkProviders.map((network, index) => {
                  return (
                    <option key={index} value={network.title}>
                      {network.title}
                    </option>
                  );
                })}
            </select>
            <input
              type="number"
              placeholder="PHONE NUMBER"
              onChange={(e) => setPhoneNumber(`${e.target.value}`)}
            />
          </div>
        )}

        {type == "Data" && (
          <div className="data-container">
            <div className="data-header">
              <select onChange={(e) => setActiveNetwork(e.target.value)}>
                {supportedNetworkProviders &&
                  supportedNetworkProviders.map((network, index) => {
                    return (
                      <option key={index} value={network.title}>
                        {network.title}
                      </option>
                    );
                  })}
              </select>

              <select onChange={(e) => setActiveBundleDuration(e.target.value)}>
                {supportedBundleDurations &&
                  supportedBundleDurations.map((duration, index) => {
                    return (
                      <option key={index} value={duration}>
                        {duration}
                      </option>
                    );
                  })}
              </select>
            </div>

            <select
              className="plans"
              value={selectorIndex}
              onChange={(e) => {
                bundlePackagePick(e.target.value);
                setSelectorIndex(e.target.selectedIndex);
              }}
            >
              {dataBundles &&
                dataBundles.map((bundle, index) => {
                  return (
                    <option key={index} value={index}>
                      {bundle.title}
                    </option>
                  );
                })}
            </select>
            <input
              type="number"
              placeholder="PHONE NUMBER"
              onChange={(e) => setPhoneNumber(`${e.target.value}`)}
            />
          </div>
        )}

        {type == "Electricity" && (
          <div className="data-container">
            <div style={{ display: "flex" }}>
              <select
                onChange={(e) => setActiveElectricityProvider(e.target.value)}
              >
                {electricityProviders &&
                  electricityProviders.map((provider, index) => {
                    return (
                      <option value={provider.slug} key={index}>
                        {provider.title}
                      </option>
                    );
                  })}
              </select>
              <select
                style={{ marginLeft: "18px" }}
                onChange={(e) => setActiveMeterType(e.target.value)}
              >
                <option value={"PREPAID"}>PREPAID</option>
                <option value={"POSTPAID"}>POSTPAID</option>
              </select>
            </div>
            <input
              type="number"
              placeholder="METER NUMBER"
              onChange={(e) => setMeterNumber(`${e.target.value}`)}
            />
            {((meterNumber?.length > 9 && activeMeterType == "POSTPAID") ||
              (meterNumber?.length > 10 && activeMeterType == "PREPAID")) && (
              <div
                className="meterOwner"
                style={{
                  background:
                    !verifiedMeterOwner?.success &&
                    !isVerifying &&
                    "oklch(71.2% 0.194 13.428)",
                  color: !verifiedMeterOwner?.success && !isVerifying && "#fff",
                }}
              >
                <h1 style={{ position: "relative", top: "5px" }}>
                  {verifiedMeterOwner && !verifiedMeterOwner?.success
                    ? isVerifying
                      ? "VERIFYING..."
                      : "INVALID DETAILS"
                    : verifiedMeterOwner?.success
                    ? `${
                        verifiedMeterOwner?.data.customerName == undefined
                          ? "NETWORK BUSY,TRY AGAIN LATER!!"
                          : verifiedMeterOwner?.data.customerName
                      }`
                    : "VERIFYING..."}
                </h1>

                {verifiedMeterOwner?.success && (
                  <h1>
                    {!verifiedMeterOwner?.success
                      ? isVerifying
                        ? ""
                        : "INVALID DETAILS"
                      : verifiedMeterOwner?.success
                      ? `${verifiedMeterOwner?.data.customerAddress}`
                      : "VERIFYING..."}
                  </h1>
                )}
              </div>
            )}
          </div>
        )}

        {type == "Tv" && (
          <div className="data-container">
            <div style={{ display: "flex" }}>
              <select onChange={(e) => setActiveCableProvider(e.target.value)}>
                {cableProviders &&
                  cableProviders.map((provider) => {
                    return (
                      <option value={provider.title}>{provider.title}</option>
                    );
                  })}
              </select>
              <select
                style={{ marginLeft: "18px" }}
                onChange={(e) =>
                  setActiveCableProviderBouquet(
                    cableProviderBouquets &&
                      cableProviderBouquets[e.target.value]
                  )
                }
              >
                {cableProviderBouquets &&
                  cableProviderBouquets.map((bouquet, index) => {
                    return (
                      <option key={index} value={index}>
                        {bouquet.title}
                      </option>
                    );
                  })}
              </select>
            </div>
            <input
              type="number"
              placeholder="IUC NUMBER"
              onChange={(e) => setIUCNumber(`${e.target.value}`)}
            />
            {iucNumber?.length > 9 && (
              <div
                className="meterOwner"
                style={{
                  background:
                    !verifiedCableOwner?.success &&
                    !isVerifying &&
                    "oklch(71.2% 0.194 13.428)",
                  color: !verifiedCableOwner?.success && !isVerifying && "#fff",
                }}
              >
                <h1 style={{ position: "relative", top: "5px" }}>
                  {!verifiedCableOwner?.success
                    ? isVerifying
                      ? "VERIFYING..."
                      : "INVALID DETAILS"
                    : verifiedCableOwner?.success
                    ? `${verifiedCableOwner?.data?.customerName}`
                    : "VERIFYING..."}
                </h1>
              </div>
            )}
          </div>
        )}

        {detectNetwork(`${phoneNumber}`) != "" && (
          <div className="netDetector">
            <h2>{detectNetwork(`${phoneNumber}`)} DETECTED</h2>
          </div>
        )}

        <m.button
          whileTap={{ scale: 1.2 }}
          style={{
            opacity:
              !isValidNigerianNumber(phoneNumber ? phoneNumber : " ") &&
              phoneNumber?.length > 10 &&
              "0.5",
            background: `url(${btnOverlayW}) no-repeat center center /
                cover,
               #000`,
          }}
          onClick={() => {
            if (!pricingData) {
              toast.info("LOADING RATES ", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
              });
              return;
            }
            if (
              (!isValidNigerianNumber(phoneNumber ? phoneNumber : "") &&
                (type == "Data" || type == "Airtime")) ||
              (meterOwner == null && type == "Electricity") ||
              (iucNumber == null && type == "Tv")
            ) {
              return;
            }
            setBillInfo(
              type == "Airtime"
                ? {
                    network: activeNetwork,
                    fiat_amount: fiatAmountToSend,
                    usdc_amount: to_str(
                      roundToThree(
                        fiatAmountToSend
                          ? fiatAmountToSend / pricingData
                          : 100 / pricingData
                      )
                    ),
                    amount: fiatAmountToSend,
                    issuer_address: userData?.walletAddr,
                    phone_number: to_str(phoneNumber),
                    type: type,
                  }
                : type == "Data"
                ? {
                    data_plan: activeDataBundle.title,
                    network: activeNetwork,
                    plan: activeBundleDuration,
                    fiat_amount: fiatAmountToSend,
                    usdc_amount: to_str(
                      roundToThree(fiatAmountToSend / pricingData)
                    ),
                    amount: fiatAmountToSend,
                    issuer_address: userData?.walletAddr,
                    phone_number: to_str(phoneNumber),
                    code: activeDataBundle.code,
                    type: type,
                  }
                : type == "Tv"
                ? {
                    provider: activeCableProvider,
                    cable_owner: verifiedCableOwner?.data?.customerName,
                    code: activeCableProviderBouquet?.code,
                    iucNumber: iucNumber,
                    fiat_amount: fiatAmountToSend,
                    usdc_amount: to_str(
                      roundToThree(fiatAmountToSend / pricingData)
                    ),
                    amount: fiatAmountToSend,
                    issuer_address: userData?.walletAddr,
                    bouquet: activeCableProviderBouquet?.title,
                    type: type,
                  }
                : {
                    provider: activeElectricityProvider,
                    meter_number: meterNumber,
                    meter_owner: meterOwner,
                    meter_type: activeMeterType,
                    meter_address: verifiedMeterOwner?.data?.customerAddress,
                    fiat_amount: fiatAmountToSend,
                    usdc_amount: to_str(
                      roundToThree(fiatAmountToSend / pricingData)
                    ),
                    amount: fiatAmountToSend,
                    issuer_address: userData?.walletAddr,
                    type: type,
                  }
            );
            getUSDBal();
          }}
        >
          CONFIRM
        </m.button>
        {/*<m.button
          whileTap={{ scale: 1.2 }}
          className="batch-btn"
          style={{ fontFamily: "rowdies" }}
          onClick={() => {
            if (!pricingData) {
              toast.info("LOADING RATES ", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
              });
              return;
            }
            if (
              (!isValidNigerianNumber(phoneNumber ? phoneNumber : "") &&
                (type == "Data" || type == "Airtime")) ||
              (meterOwner == null && type == "Electricity") ||
              (iucNumber == null && type == "Tv")
            ) {
              return;
            }
            setIsPay(true, type);
            if (!billBatch) {
              setBillBatch([
                type == "Airtime"
                  ? {
                      network: activeNetwork,
                      fiat_amount: fiatAmountToSend,
                      usdc_amount: to_str(
                        roundToThree(
                          fiatAmountToSend
                            ? fiatAmountToSend / pricingData
                            : 100 / pricingData
                        )
                      ),
                      amount: fiatAmountToSend,
                      issuer_address: userData?.walletAddr,
                      phone_number: to_str(phoneNumber),
                      type: type,
                    }
                  : type == "Data"
                  ? {
                      data_plan: activeDataBundle.title,
                      network: activeNetwork,
                      plan: activeBundleDuration,
                      fiat_amount: fiatAmountToSend,
                      usdc_amount: to_str(
                        roundToThree(fiatAmountToSend / pricingData)
                      ),
                      amount: fiatAmountToSend,
                      issuer_address: userData?.walletAddr,
                      phone_number: to_str(phoneNumber),
                      code: activeDataBundle.code,
                      type: type,
                    }
                  : type == "Tv"
                  ? {
                      provider: activeCableProvider,
                      cable_owner: verifiedCableOwner?.data?.customerName,
                      code: activeCableProviderBouquet?.code,
                      iucNumber: iucNumber,
                      fiat_amount: fiatAmountToSend,
                      usdc_amount: to_str(
                        roundToThree(fiatAmountToSend / pricingData)
                      ),
                      amount: fiatAmountToSend,
                      issuer_address: userData?.walletAddr,
                      bouquet: activeCableProviderBouquet?.title,
                      type: type,
                    }
                  : {
                      provider: activeElectricityProvider,
                      meter_number: meterNumber,
                      meter_owner: meterOwner,
                      meter_type: activeMeterType,
                      meter_address: verifiedMeterOwner?.data?.customerAddress,
                      fiat_amount: fiatAmountToSend,
                      usdc_amount: to_str(
                        roundToThree(fiatAmountToSend / pricingData)
                      ),
                      amount: fiatAmountToSend,
                      issuer_address: userData?.walletAddr,
                      type: type,
                    },
              ]);
              toast.success("BILL BATCHED SUCCESSFULLY", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
              });
              getUSDBal();
              return;
            }
            setBillBatch([
              ...billBatch,
              type == "Airtime"
                ? {
                    network: activeNetwork,
                    fiat_amount: fiatAmountToSend,
                    usdc_amount: to_str(
                      roundToThree(
                        fiatAmountToSend
                          ? fiatAmountToSend / pricingData
                          : 100 / pricingData
                      )
                    ),
                    amount: fiatAmountToSend,
                    issuer_address: userData?.walletAddr,
                    phone_number: to_str(phoneNumber),
                    type: type,
                  }
                : type == "Data"
                ? {
                    data_plan: activeDataBundle.title,
                    network: activeNetwork,
                    plan: activeBundleDuration,
                    fiat_amount: fiatAmountToSend,
                    usdc_amount: to_str(
                      roundToThree(fiatAmountToSend / pricingData)
                    ),
                    amount: fiatAmountToSend,
                    issuer_address: userData?.walletAddr,
                    phone_number: to_str(phoneNumber),
                    code: activeDataBundle.code,
                    type: type,
                  }
                : type == "Tv"
                ? {
                    provider: activeCableProvider,
                    cable_owner: verifiedCableOwner?.data?.customerName,
                    code: activeCableProviderBouquet?.code,
                    iucNumber: iucNumber,
                    fiat_amount: fiatAmountToSend,
                    usdc_amount: to_str(
                      roundToThree(fiatAmountToSend / pricingData)
                    ),
                    amount: fiatAmountToSend,
                    issuer_address: userData?.walletAddr,
                    bouquet: activeCableProviderBouquet?.title,
                    type: type,
                  }
                : {
                    provider: activeElectricityProvider,
                    meter_number: meterNumber,
                    meter_owner: meterOwner,
                    meter_type: activeMeterType,
                    meter_address: verifiedMeterOwner?.data?.customerAddress,
                    fiat_amount: fiatAmountToSend,
                    usdc_amount: to_str(
                      roundToThree(fiatAmountToSend / pricingData)
                    ),
                    amount: fiatAmountToSend,
                    issuer_address: userData?.walletAddr,
                    type: type,
                  },
            ]);
            toast.success("BILL BATCHED SUCCESSFULLY", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: false,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
            });
            getUSDBal();
          }}
        >
          {!billBatch ? "CREATE BATCH" : "ADD TO BATCH"}
          <i className="fa-solid fa-boxes-stacked"></i>
        </m.button>*/}

        <p style={{ color: "oklch(70.4% 0.04 256.788)" }}>
          *Click outside the form to exit
        </p>
      </m.div>
    </div>
  );
};

interface Airtime {
  network: string | null;
  amount: number | null;
  phone_number: string | null;
  usdc_amount: string | null;
  fiat_amount: number | null;
  issuer_address: string | undefined;
}

interface Data {
  network: string | null;
  phone_number: string | null;
  plan: string | null;
  amount: number | null;
  usdc_amount: string | null;
  fiat_amount: number | null;
  issuer_address: string | undefined;
  data_plan: null | string;
  code: string;
}

interface Electricity {
  provider: string | null;
  meter_number: string | null;
  meter_owner: string | null;
  meter_address: string | null;
  meter_type: string | null;
  amount: number | null;
  usdc_amount: string | null;
  fiat_amount: number;
  issuer_address: string | undefined;
}

interface Cable {
  provider: string | null;
  iucNumber: string | null;
  code: string | null;
  cable_owner: string | null;
  amount: number | null;
  usdc_amount: string | null;
  fiat_amount: number;
  issuer_address: string | undefined;
  bouquet: string | null;
}

interface summaryProp {
  billInfo: Airtime | Data | Electricity | Cable;
  serviceName: string | null;
}

const formatUtilityName = (input: string) => {
  return input
    .replace(/-/g, " ") // Replace all dashes with spaces
    .replace(/\belectric\b/i, "electricity") // Replace 'electric' with 'electricity' (whole word, case-insensitive)
    .toUpperCase(); // Convert to uppercase
};

const Summary: React.FC<summaryProp> = ({ billInfo, serviceName }) => {
  const setIsPay = useQuiverStore((state) => state.setIsPay);
  const isTxApproved = useQuiverStore((state) => state.isTxApproved);
  const setIsCheckPIN = useQuiverStore((state) => state.setIsCheckPIN);
  const setIsTxApproved = useQuiverStore((state) => state.setIsTxApproved);

  const incrementRefreshCount = useQuiverStore(
    (state) => state.incrementRefreshCount
  );

  const userData = useQuiverStore((state) => state.userData);
  const [orderStatus, setOrderStatus] = useState<any | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRequestTransfer, setIsRequestTransfer] = useState<boolean>(false);

  const amountToApprove = parseUnits(
    `${
      billInfo.usdc_amount
        ? roundToThree(
            parseFloat(billInfo.usdc_amount) +
              (billInfo.usdc_amount < 0.65
                ? FEE_1
                : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                ? FEE_2
                : FEE_3)
          )
        : 0
    }`,
    6
  );

  let txInterval;

  const createOrder_ = async () => {
    if (!userData?.is_pin_disabled) {
      setIsTxApproved(false);
      setIsCheckPIN(true);
      return;
    }
    setIsProcessing(true);
  };

  const orderUtilBill = async () => {
    setOrderStatus(null);
    const balance = await readContract(getConfig(), {
      address: TA,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userData?.walletAddr],
    });

    if (balance < amountToApprove) {
      toast.error("FUND WALLET TO TRANSACT", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      setIsProcessing(false);
      return;
    }

    if (!isRequestTransfer) {
      try {
        incrementRefreshCount();
        const res = await axios.post(`${API_ENDPOINT}/api/create_tx/`, {
          ...billInfo,
          usdc_amount: roundToThree(
            parseFloat(billInfo.usdc_amount) +
              (billInfo.usdc_amount < 0.65
                ? FEE_1
                : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                ? FEE_2
                : FEE_3)
          ),
          fiat_amount: parseFloat(billInfo.fiat_amount),
          type: serviceName,
          code: billInfo.code,
        });
        setOrderStatus(res.data);
        if (res.data.success) {
          incrementRefreshCount();
        }
        console.log(res);
        setIsTxApproved(false);
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (isTxApproved) {
      setIsProcessing(true);
    }

    if (isTxApproved && isProcessing) {
      console.log(isTxApproved);
      orderUtilBill();
      setIsTxApproved(false);
    }

    if (userData?.is_pin_disabled && isProcessing) {
      orderUtilBill();
      setIsTxApproved(false);
    }
  }, [isTxApproved, isProcessing]);

  return (
    <div
      className="overlays-Container"
      onClick={() =>
        (!orderStatus || isProcessing) && setIsPay(false, serviceName)
      }
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
          <h1 style={{ fontFamily: "Monoton", fontWeight: "400" }}>Summary</h1>
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
          </div>
        </div>
        <div className="line"></div>
        <h3>Description</h3>
        <div className="line"></div>

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
                NGN {billInfo.fiat_amount} ~ {billInfo.usdc_amount} USDC
              </p>
              <div style={{ textAlign: "right", width: "100%" }}>
                <p style={{ marginLeft: "auto", fontWeight: "200" }}>
                  {billInfo.data_plan}
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
                NGN {billInfo.fiat_amount} ~ {billInfo.usdc_amount} USDC
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
            <div>
              <h4>Provider</h4>
              <p>{formatUtilityName(billInfo.provider)}</p>
            </div>
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
                NGN {billInfo.fiat_amount} ~ {billInfo.usdc_amount} USDC
              </p>
            </div>
            <div>
              <h4>Service</h4>
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
        {serviceName == "Tv" && (
          <div className="billInfo">
            <div>
              <h4>Provider</h4>
              <p>{formatUtilityName(billInfo.provider)}</p>
            </div>
            <div>
              <h4>Cable Owner</h4>
              <p>{billInfo.cable_owner}</p>
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
                NGN {billInfo.fiat_amount} ~ {billInfo.usdc_amount} USDC
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
              parseFloat(billInfo.usdc_amount) +
                (billInfo.usdc_amount < 0.65
                  ? FEE_1
                  : billInfo.usdc_amount > 0.65 && billInfo.usdc_amount < 9
                  ? FEE_2
                  : FEE_3)
            )}{" "}
            USDC
          </p>
        </div>
        {orderStatus?.success && serviceName == "Electricity" && (
          <>
            <div className="line"></div>
            <div className="meterOwner" style={{ paddingBottom: "15px" }}>
              <h1 style={{ position: "relative", top: "5px" }}>
                {orderStatus.data.token} ~ {orderStatus.data.unit}{" "}
                <i className="fa-solid fa-bolt"></i>
              </h1>
            </div>
          </>
        )}

        <div className="btn-container">
          <m.button
            style={{
              background: !orderStatus
                ? `url(${btnOverlayW}) no-repeat center center /
                cover,
              #000`
                : !orderStatus.success
                ? `url(${btnOverlay}) no-repeat center center /
                cover,
              oklch(57.7% 0.245 27.325)`
                : `url(${btnOverlay}) no-repeat center center /
                cover,
                oklch(72.3% 0.219 149.579)`,
              padding: "12px 8px",
            }}
            whileTap={{ scale: 1.2 }}
            onClick={() =>
              (!orderStatus || !orderStatus.success) && createOrder_()
            }
          >
            {isProcessing ? (
              orderStatus ? (
                orderStatus.success ? (
                  <p>
                    {`${serviceName}`} PURCHASE SUCCESSFUL
                    <i className="fa-solid fa-circle-check"></i>
                  </p>
                ) : (
                  <p>
                    TRANSACTION FAILED,RETRY
                    <i className="fa-solid fa-undo"></i>
                  </p>
                )
              ) : (
                <Loader />
              )
            ) : (
              <p>
                Pay <i className="fa-solid fa-money-bill"></i>
              </p>
            )}
          </m.button>
        </div>
        {!isProcessing && !orderStatus && (
          <p
            style={{
              color: "oklch(70.4% 0.04 256.788)",
              fontFamily: "Poppins",
            }}
          >
            *Click outside the form to exit
          </p>
        )}
      </m.div>
    </div>
  );
};

export { Send, Summary };
