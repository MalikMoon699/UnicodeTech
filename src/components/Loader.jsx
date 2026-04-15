import React from "react";
import { Spiral } from "ldrs/react";
import "ldrs/react/Spiral.css";

const Loader = ({
  size = "40",
  className = "loaderWrapper",
  color = "var(--primary)",
  speed = "1.75",
  stroke = "5",
  style = {
    height: "100%",
    width: "100%",
  },
}) => {
  return (
    <div className={className} style={style}>
      <Spiral size={size} speed={speed} stroke={stroke} color={color} />
    </div>
  );
};

export default Loader;