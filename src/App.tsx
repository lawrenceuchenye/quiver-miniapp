import { sdk } from "@farcaster/frame-sdk";
import { useAccount, useConnect, useSignMessage } from "wagmi";

import { useEffect, useState } from "react";
import { Navbar, MobileNav } from "../components/Navbar";
import ConnectOverlay from "../components/ConnectOverlay";

import Home from "./pages/Home";
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

import { SetUpPIN, ConfirmPIN, CheckPIN } from "../components/PINOverlay";

function App() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const userData = useQuiverStore((state) => state.userData);
  const connectClicked = useQuiverStore((state) => state.connectClicked);
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
  const isCheckPIN = useQuiverStore((state) => state.isCheckPIN);
  const isTxApproved = useQuiverStore((state) => state.isTxApproved);
  const isDisablingPIN = useQuiverStore((state) => state.isDisablingPIN);
  const isChangeCardColor = useQuiverStore((state) => state.isChangeCardColor);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1200 ? true : false);
  }, []);

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ overflowX: "hidden" }}>
        <Home />
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
      {connectClicked && <ConnectOverlay />}
      {isTransfer && <OffRamp />}
      {offRampData && !isCheckPIN && <OffRampSummary />}
      {isSettings && <Settings />}
      {isViewTxHistory && <TransactionHistory />}
      {isViewKYCForm && <KYCOverlay />}
      {userData?.email && !userData.is_pin_active && <SetUpPIN />}
      {userData?.pinHash && !userData.is_pin_active && <ConfirmPIN />}
      {isCheckPIN && billInfo && isPay && <CheckPIN />}
      {isCheckPIN && offRampData && <CheckPIN />}
      {isCheckPIN && !isTxApproved && <CheckPIN />}
      {isDisablingPIN && !isTxApproved && <CheckPIN />}
      {isChangeCardColor && <CardColors />}
      {/* <BatchComponent />*/}
      <FootBar />
    </>
  );
}

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

export default App;
