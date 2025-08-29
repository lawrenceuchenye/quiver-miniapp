import React from "react";
import "./index.css";

const index: React.FC = () => {
  const navigateGetStarted = () => {
    window.location.href =
      "https://nutritious-yoke-fe0.notion.site/Get-Started-with-Quiver-23d7f08710c780868702e986b3b05eea";
  };

  const navigatePrivacyPolicy = () => {
    window.location.href =
      "https://nutritious-yoke-fe0.notion.site/Quiver-Privacy-Policy-23d7f08710c78059b7dee56dcc1cee80";
  };

  const navigateFAQ = () => {
    window.location.href =
      "https://nutritious-yoke-fe0.notion.site/Quiver-FAQ-23d7f08710c780ce9c2deeed9df8264d";
  };

  const navigateToX = () => {
    window.location.href = "https://x.com/useQuiver";
  };

  return (
    <div className="footBar">
      <div className="links">
        <h3 onClick={() => navigateGetStarted()}>Get Started</h3>
        <h3 onClick={() => navigateFAQ()}>FAQ</h3>
        <h3 onClick={() => navigatePrivacyPolicy()}>Privacy Policy</h3>
        <h3 onClick={() => navigateToX()}>X(twitter)</h3>
        <h3>Whatsapp</h3>
      </div>
      <div className="copyrightContainer">
        <h1>© 2025 QUIVER EDGE SERVICES LTD | RC:8707357</h1>
      </div>
    </div>
  );
};

export default index;
