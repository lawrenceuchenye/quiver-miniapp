import React from "react";
import "./index.css";

interface LoaderProps {
  inverted: boolean;
}

const index: React.FC<LoaderProps> = ({ inverted = false }) => {
  return (
    <div className="loader">
      <div style={{ background: inverted ? "#000" : "#fff" }}></div>
      <div style={{ background: inverted ? "#000" : "#fff" }}></div>
      <div style={{ background: inverted ? "#000" : "#fff" }}></div>
      <div style={{ background: inverted ? "#000" : "#fff" }}></div>
      <div style={{ background: inverted ? "#000" : "#fff" }}></div>
      <div style={{ background: inverted ? "#000" : "#fff" }}></div>
      <div style={{ background: inverted ? "#000" : "#fff" }}></div>
    </div>
  );
};

export default index;
