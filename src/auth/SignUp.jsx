import React, { useState } from "react";
import { Mail, ArrowRight, User, Lock } from "lucide-react";
import "../assets/style/Auth.css";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Loader from "../components/Loader";
import { Input } from "../components/CustomComponents";
import { useAuth } from "../context/AuthContext";

const SignUp = ({ setFormType }) => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validations = () => {
    if (name.trim() === "") {
      toast.error("Name is required.");
      return false;
    }
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

  const handleSignUp = async () => {
    if (!validations()) return;

    setLoading(true);

    try {
      await signUp({ name, email, password });
      setFormType("signIn");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-left">
      <div className="signin-left-inner">
        <h1>Create account</h1>
        <p className="signup-link">
          Already have an account?{" "}
          <span onClick={() => setFormType("signIn")}>Sign In</span> or{" "}
          <span onClick={() => navigate("/")}>GoBack</span>
        </p>

        <div className="form-card">
          <Input
            label="Full Name"
            value={name}
            setValue={setName}
            placeholder="Enter full name here..."
            type="inputIcon"
            InputType="text"
            Icon={User}
          />
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
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              <Loader color="#fff" size="18" stroke="2" height="17px" />
            ) : (
              <>
                Sign Up{" "}
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

export default SignUp;
