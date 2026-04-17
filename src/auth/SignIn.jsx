import React, { useState } from "react";
import { Mail, ArrowRight, Lock } from "lucide-react";
import "../assets/style/Auth.css";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Loader from "../components/Loader";
import { Input } from "../components/CustomComponents";
import { useAuth } from "../context/AuthContext";

const SignIn = ({ setFormType }) => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validations = () => {
    if (email.trim() === "") {
      toast.error("Email is required.");
      return false;
    }
    if (password.trim() === "") {
      toast.error("Password is required.");
      return false;
    }
    if (password.length < 8) {
      toast.error("password must be at least 8 characters required!");
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validations()) return;
    setLoading(true);
    try {
      await signIn({ email, password });
      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      if (err.message !== "No show") toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="signin-left">
      <div className="signin-left-inner">
        <h1>Welcome back</h1>
        <p className="signup-link">
          Don't have an account?{" "}
          <span onClick={() => setFormType("signUp")}>Sign up for free</span> or{" "}
          <span onClick={() => navigate("/")}>GoBack</span>
        </p>

        <div className="form-card">
          <Input
            label="Email"
            value={email}
            setValue={setEmail}
            placeholder="Enter email here..."
            type="inputIcon"
            InputType="text"
            Icon={Mail}
          />
          <Input
            label="Password"
            value={password}
            setValue={setPassword}
            placeholder="Enter password here..."
            type="inputIcon"
            InputType="password"
            Icon={Lock}
          />
          <label>
            <input style={{ marginRight: "4px" }} type="checkbox" />
            Remember me
          </label>
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              <Loader color="#fff" size="18" stroke="2" height="17px" />
            ) : (
              <>
                Sign In{" "}
                <span className="icon">
                  <ArrowRight size={16} />
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
