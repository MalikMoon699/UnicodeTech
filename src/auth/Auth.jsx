import React, { useEffect, useRef, useState } from "react";
import { IMAGES } from "../utils/constants";
import { useSearchParams } from "react-router";
import SignIn from "./SignIn";
import SignUp from "./SignUp";

const Auth = () => {
  const images = [IMAGES.auth1, IMAGES.auth2, IMAGES.auth3];
  const [formType, setFormType] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("formType");
    if (type === "signUp" || type === "signIn") {
      setFormType(type);
    } else {
      setFormType("signIn");
    }
  }, [searchParams]);

  return (
    <div className="signin-container">
      <div
        className={`carousel-auth-card signin ${formType === "signIn" ? "active" : ""}`}
      >
        <Carousel images={images} />
      </div>
      <div
        className={`carousel-auth-card signup ${formType === "signUp" ? "active" : ""}`}
      >
        <Carousel images={images} />
      </div>
      <div
        className={`auth-card signin ${formType === "signIn" ? "active" : ""}`}
      >
        <SignIn setFormType={setFormType} />
      </div>
      <div
        className={`auth-card signup ${formType === "signUp" ? "active" : ""}`}
      >
        <SignUp setFormType={setFormType} />
      </div>
    </div>
  );
};

export default Auth;

export const Carousel = ({ images }) => {
  const [index, setIndex] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.style.transform = `translateX(-${index * 100}%)`;
    }
  }, [index]);

  return (
    <div className="carousel-container">
      <div className="carousel" ref={carouselRef}>
        {images.map((img, i) => (
          <div key={i} className="card">
            <img src={img} alt={`slide-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
