//@ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import useQuiverStore from "../../store";
import "./index.css";
import axios from "axios";
import { API_ENDPOINT } from "../utils";
import { motion as m } from "framer-motion";
import { toJpeg } from "html-to-image"; // ✅

const roundToTwo = (num) => {
  return Math.round(num * 100) / 100;
};

const colors = ["#FF7A00", "#00BFFF", "#FFD700", "#6A0DAD", "#2ECC71"];
const MAX_BILLS_OVERFLOW = 100;
interface ServiceStatProps {
  serviceName: string;
  Icon: any;
  color: string;
  amount: number;
}

const ServiceStats: React.FC<ServiceStatProps> = ({
  serviceName,
  Icon,
  color,
  amount,
}) => {
  const userData = useQuiverStore((state) => state.userData);
  const refreshCount = useQuiverStore((state) => state.refreshCount);
  const [percentage, setPercentage] = useState(0);

  // const percentage=(amount/MAX_BILLS_OVERFLOW)*100;

  const getStats = async () => {
    switch (serviceName) {
      case "Airtime":
        const resa = await axios.post(
          `${API_ENDPOINT}/api/wallet_airtime_tx/`,
          { walletAddr: userData?.walletAddr }
        );
        setPercentage((resa.data.data.length / MAX_BILLS_OVERFLOW) * 100);
        break;
      case "Data":
        const resdt = await axios.post(`${API_ENDPOINT}/api/wallet_data_tx/`, {
          walletAddr: userData?.walletAddr,
        });
        setPercentage((resdt.data.data.length / MAX_BILLS_OVERFLOW) * 100);
        break;
      case "Electricity":
        const rese = await axios.post(
          `${API_ENDPOINT}/api/wallet_electricity_tx/`,
          { walletAddr: userData?.walletAddr }
        );
        setPercentage((rese.data.data.length / MAX_BILLS_OVERFLOW) * 100);
        break;
      case "Tv":
        const restv = await axios.post(
          `${API_ENDPOINT}/api/wallet_electricity_tx/`,
          { walletAddr: userData?.walletAddr }
        );
        setPercentage((restv.data.data.length / MAX_BILLS_OVERFLOW) * 100);
        break;
      case "CashFlow":
        const restcf = await axios.post(
          `${API_ENDPOINT}/api/wallet_cashflow_tx/`,
          { walletAddr: userData?.walletAddr }
        );
        setPercentage((restcf.data.data.length / MAX_BILLS_OVERFLOW) * 100);
        break;
      default:
        console.log("Nothing");
    }
  };

  useEffect(() => {
    getStats();
  }, [refreshCount]);

  return (
    <div className="serviceStatContainer">
      <div
        className="bar"
        style={{
          background: `${color}`,
          width: `${percentage > 100 ? 100 : percentage}%`,
        }}
      ></div>
      <h1>
        {serviceName} {Icon}
      </h1>
    </div>
  );
};

const Overview: React.FC = () => {
  const [isExportStats, setIsExportStats] = useState<boolean>(false);
  const [userTxVolume, setUserTxVolume] = useState(null);
  const [userTotalTxs, setUserTotalTxs] = useState<number>(0);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const reFreshCount = useQuiverStore((state) => state.reFreshCount);
  const userData = useQuiverStore((state) => state.userData);
  const setIsViewTxHistory = useQuiverStore(
    (state) => state.setIsViewTxHistory
  );
  const setTxHistory = useQuiverStore((state) => state.setTxHistory);
  const setTotalTxColumns = useQuiverStore((state) => state.setTotalTxColumns);
  const componentRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    setIsExportStats(true);

    try {
      if (componentRef.current) {
        const node = componentRef.current;
        const scale = window.devicePixelRatio || 2;
        const padding = 40;

        const style = {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${node.offsetWidth + padding * 2}px`,
          height: `${node.offsetHeight + padding * 2}px`,
        };

        const param = {
          quality: 0.95,
          boxShadow: `0px ${4 * scale}px ${16 * scale}px rgba(0, 0, 0, 0.1)`,
          backgroundColor: "#f7f7f7",
          width: node.offsetWidth * scale,
          height: node.offsetHeight * scale,
          style,
        };

        const dataUrl = await toJpeg(node, param);

        const blob = await (await fetch(dataUrl)).blob();
        const objectUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = objectUrl;
        a.download = "overview.jpg";
        document.body.appendChild(a);
        a.click();
        // Cleanup
        URL.revokeObjectURL(objectUrl);
        a.remove();
      }
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExportStats(false);
    }
  };

  const getUserTxInfo = async () => {
    const data = await axios.post(
      `${API_ENDPOINT}/api/get_wallet_tx_details/`,
      {
        walletAddr: userData?.walletAddr,
        page_number: 4,
      }
    );
    setTotalTxColumns(data.data?.totalHistoryDataColumns);
    setTxHistory(data.data?.history);
    setUserTxVolume(data.data?.volume);
    setUserTotalTxs(data.data?.totalTxs);
  };

  useEffect(() => {
    getUserTxInfo();
    if (window.innerWidth > 1200) {
      setIsDesktop(true);
    }
  }, [reFreshCount]);

  return (
    <div ref={componentRef} style={{ padding: "40", textAlign: "center" }}>
      <div className="ovContainer" style={{ textAlign: "left" }}>
        <div className="overview-header">
          <h1>#Overview</h1>
          <p>
            ${roundToTwo(userTxVolume)} ~ {userTotalTxs} Tansactions
          </p>
        </div>
        <div className="insideOvContainer">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <p>Spend Stats</p>

            {isDesktop && (
              <button
                className="exportButton"
                style={{ marginTop: 20 }}
                onClick={handleExport}
              >
                {!isExportStats ? (
                  <>
                    {" "}
                    <i class="fa-solid fa-camera"></i> Share
                  </>
                ) : (
                  "#TryQuiver"
                )}
              </button>
            )}
          </div>
          <ServiceStats
            serviceName="Airtime"
            Icon={
              <i
                className="fa-solid fa-sim-card"
                style={{ color: `${colors[0]}` }}
              ></i>
            }
            color={colors[0]}
            amount={50}
          />
          <ServiceStats
            serviceName="Data"
            Icon={
              <i
                className="fa-solid fa-wifi"
                style={{ color: `${colors[1]}` }}
              ></i>
            }
            color={colors[1]}
            amount={30}
          />
          <ServiceStats
            serviceName="Electricity"
            Icon={
              <i className="fas fa-bolt" style={{ color: `${colors[2]}` }}></i>
            }
            color={colors[2]}
            amount={10}
          />
          <ServiceStats
            serviceName="Tv"
            Icon={
              <i
                className="fa-solid fa-tv"
                style={{ color: `${colors[3]}` }}
              ></i>
            }
            color={colors[3]}
            amount={70}
          />

          <ServiceStats
            serviceName="CashFlow"
            Icon={
              <i
                className="fa-solid fa-money-bill-transfer"
                style={{ color: `${colors[4]}` }}
              ></i>
            }
            color={colors[4]}
            amount={40}
          />
        </div>
        {!isExportStats && (
          <div
            className="moreContainer"
            onClick={() => setIsViewTxHistory(true)}
          >
            <p>View transaction history</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
