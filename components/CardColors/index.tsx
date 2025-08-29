//@ts-nocheck
import useQuiverStore from "../../store";
import "./index.css";
import { motion as m } from "framer-motion";

const colors = [
  "oklch(57.7% 0.245 27.325)",
  "oklch(64.6% 0.222 41.116)",
  "oklch(76.9% 0.188 70.08)",
  "oklch(85.2% 0.199 91.936)",
  "oklch(76.8% 0.233 130.85)",
  "oklch(84.1% 0.238 128.85)",
  "oklch(72.3% 0.219 149.579)",
  "oklch(76.5% 0.177 163.223)",
  "oklch(77.7% 0.152 181.912)",
  "oklch(78.9% 0.154 211.53)",
  "oklch(74.6% 0.16 232.661)",
  "oklch(62.3% 0.214 259.815)",
  "oklch(54.6% 0.245 262.881)",
  "oklch(51.1% 0.262 276.966)",
  "oklch(54.1% 0.281 293.009)",
  "oklch(55.8% 0.288 302.321)",
  "oklch(59.1% 0.293 322.896)",
  "oklch(59.1% 0.293 322.896)",
  "oklch(59.2% 0.249 0.584)",
  "oklch(58.6% 0.253 17.585)",
  "oklch(64.5% 0.246 16.439)",
  "oklch(71.2% 0.194 13.428)",
  "oklch(44.6% 0.043 257.281)",
  "oklch(44.6% 0.03 256.802)",
  "oklch(43.9% 0 0)",
  "oklch(44.4% 0.011 73.639)",
  "#000",
];

const index: React.FC = () => {
  const userData = useQuiverStore((state) => state.userData);
  const setUserData = useQuiverStore((state) => state.setUserData);
  const setIsChangeCardColor = useQuiverStore(
    (state) => state.setIsChangeCardColor
  );

  return (
    <div
      className="cardColorOverlay"
      onClick={() => setIsChangeCardColor(false)}
    >
      <m.div
        initial={{ y: "40px", opacity: 0 }}
        animate={{ y: "0px", opacity: 1 }}
        className="colorsContainer"
        onClick={(e: any) => e.stopPropagation()}
      >
        <h1>
          CARD COLORS
          <i className="fa-solid fa-paintbrush"></i>
        </h1>
        <div className="colorsHolder">
          {colors.map((color) => {
            return (
              <m.div
                whileTap={{ scale: 1.2 }}
                className="colorContainer"
                style={{ background: color }}
                onClick={() => {
                  setUserData({ ...userData, card_color: color });
                }}
              ></m.div>
            );
          })}
        </div>
        <p className="info">*Click outside the form to close.</p>
      </m.div>
    </div>
  );
};

export default index;
