import { sdk } from "@farcaster/frame-sdk";
//import { useAccount, useConnect, useSignMessage } from "wagmi";

import { useEffect, useState } from "react";
import { Navbar, MobileNav } from "../components/Navbar";

//import Home from "./pages/Home";
import UserDashboard from "./pages/UserDashboard";

import { Send, Summary } from "../components/TransactionsOverlay";

import "./App.css";
import useQuiverStore from "../store";
import FootBar from "../components/FootBar";
import { OffRamp, OffRampSummary } from "../components/RampOverlays";
import Settings from "../components/Settings";
import TransactionHistory from "../components/TransactionHistory";
import TransactionDetail from "../components/TransactionDetail";
import KYCOverlay from "../components/KYCOverlay";
import CardColors from "../components/CardColors";
//import BatchComponent from "../components/BatchComponent";
import Bimg from "../src/assets/bimg.svg";
const SplashScreen = () => {
  return (
    <div className="splashScreen">
      <h3>QUIVER</h3>
      <p>"Stables for everyday life"</p>
      <div className="servicesDiv">
        <i className="fa-solid fa-sim-card"></i>
        <i className="fa-solid fa-tv"></i>
        <i className="fa-solid fa-wifi"></i>
        <i className="fa-solid fa-bolt"></i>
        <i className="fa-solid fa-money-bill-transfer"></i>
      </div>
      <img src={Bimg} />
      <img className="img-2" src={Bimg} />
    </div>
  );
};

function App() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const isPay = useQuiverStore((state) => state.isPay);
  const billType = useQuiverStore((state) => state.billType);
  const billInfo = useQuiverStore((state) => state.billInfo);
  const isTransfer = useQuiverStore((state) => state.isTransfer);
  const offRampData = useQuiverStore((state) => state.offRampData);
  const isSettings = useQuiverStore((state) => state.isSettings);
  const isViewTxHistory = useQuiverStore((state) => state.isViewTxHistory);
  const isViewKYCForm = useQuiverStore((state) => state.isViewKYCForm);
  const isViewTxDetailHistory = useQuiverStore(
    (state) => state.isViewTxDetailHistory
  );
  const isChangeCardColor = useQuiverStore((state) => state.isChangeCardColor);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1200 ? true : false);
  }, []);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1200 ? true : false);

    const init = async () => {
      // Simulate some async setup (fetch profile, settings, etc.)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      sdk.actions.ready(); // tell Farcaster splash to close
      setIsReady(true); // show your app
    };

    init();
  }, []);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <>
      <Navbar />
      <div style={{ overflowX: "hidden" }}>
        <UserDashboard />
      </div>
      {(isPay || billInfo) && !isViewTxDetailHistory && (
        <Send type={billType} />
      )}
      {billInfo && isPay && (
        <Summary billInfo={billInfo} serviceName={billType} />
      )}

      {isViewTxDetailHistory && (
        <TransactionDetail billInfo={billInfo} serviceName={billType} />
      )}
      {isMobile && <MobileNav />}
      {isTransfer && <OffRamp />}
      {offRampData && <OffRampSummary />}
      {isSettings && <Settings />}
      {isViewTxHistory && <TransactionHistory />}
      {isViewKYCForm && <KYCOverlay />}
      {isChangeCardColor && <CardColors />}
      {/* <BatchComponent />*/}
      <FootBar />
    </>
  );
}

/*
function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  if (isConnected) {
    return (
      <>
        <div>Connected account:</div>
        <div>{address}</div>
        <SignButton />
      </>
    );
  }

  return (
    <button type="button" onClick={() => connect({ connector: connectors[0] })}>
      Connect
    </button>
  );
}

function SignButton() {
  const { signMessage, isPending, data, error } = useSignMessage();

  return (
    <>
      <button
        type="button"
        onClick={() => signMessage({ message: "hello world" })}
        disabled={isPending}
      >
        {isPending ? "Signing..." : "Sign message"}
      </button>
      {data && (
        <>
          <div>Signature</div>
          <div>{data}</div>
        </>
      )}
      {error && (
        <>
          <div>Error</div>
          <div>{error.message}</div>
        </>
      )}
    </>
  );
}
*/
export default App;
