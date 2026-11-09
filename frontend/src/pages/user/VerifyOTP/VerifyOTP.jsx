import React, { useEffect, useState } from "react";
import "./VerifyOTP.css";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signIn } from "../../../redux/slices/authSlice";
import Navbar from "../../../partials/navbar/navbar";
import axiosInstance from "../../../utils/axiosInstance";
import { Loader } from "lucide-react";

export default function VerifyOTP() {
  const [code, setCode] = useState(["", "", "", ""]);
  const [newError, setNewError] = useState("");
  const [timer, setTimer] = useState(119);
  const [isloading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const { email, newEmail, newPassword, type } = location.state;

  useEffect(() => {
    if (timer === 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prevTimer - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [timer]);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleChange = (index, value) => {
    if (value.length > 1) {
      return;
    }

    if (value && !/^[0-9]$/.test(value)) {
      return;
    }

    const updatedCode = [...code];

    updatedCode[index] = value;

    setCode(updatedCode);

    setNewError("");

    if (value && index < 3) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);

      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const previousInput = document.getElementById(`code-input-${index - 1}`);

      if (previousInput) {
        previousInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);

    e.preventDefault();

    const verificationCode = code.join("");

    console.log("OTP:", verificationCode);

    // OTP validation
    if (verificationCode.length !== 4) {
      setNewError("Please enter the 4-digit OTP");

      return;
    }

    try {
      const response = await axiosInstance.post(
        "http://localhost:2222/user/verifyOTP",
        {
          verificationCode,
          email: email,
          newEmail: newEmail,
          newPassword: newPassword,
          type: type,
        },
      );

      const token = response.data.token;

      if (response.data.success === true) {
        if (type == "signIn") {
          dispatch(
            signIn({
              token: token,
              role: "user",
            }),
          );
        }

        if (type == "forgottPassword") {
          return navigate("/user/resetPassword", {
            replace: true,
            state: { email: email },
          });
        }

    if (type === "verifyCurrentEmailForChange") {
    return navigate("/user/changeEmail", {
      replace: true,
      state:{currentEmail:email}
    });
  }

        navigate("/user/home", { replace: true })
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // RESEND OTP
  // =========================

  const handleResend = async () => {
    if (timer > 0) {
      return;
    }

    try {
      let resendEmail;

      if (type == "changeEmail") {
        resendEmail = newEmail;
      } else {
        resendEmail = email;
      }

      const response = await axios.post(
        "http://localhost:2222/user/generateOTP",
        {
          email: resendEmail,
        },
      );

      console.log("RESEND RESPONSE:", response.data);

      if (response.data.success === true) {
        // Reset timer
        setTimer(119);

        // Clear OTP
        setCode(["", "", "", ""]);

        // Clear error
        setNewError("");
      } else {
        setNewError(response.data.message || "Unable to resend OTP");
      }
    } catch (error) {
      setNewError(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <>
      {/* Navbar*/}

      <Navbar />

      {isloading && <Loader />}

      <div className="verify-wrapper">
        <div className="verify-card">
          <h1 className="verify-title">
            VERIFY YOUR
            <br />
            ACCOUNT
          </h1>

          <p className="verify-subtitle">
            Enter the 4-digit code sent to your email.
          </p>

          {newError && <p className="form-error">{newError}</p>}

          <form onSubmit={handleSubmit} className="verify-form">
            {/* OTP INPUTS */}

            <div className="code-container">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="code-input"
                />
              ))}
            </div>

            {/* VERIFY BUTTON */}

            <button type="submit" className="verify-button">
              VERIFY
            </button>
          </form>

          {/* FOOTER */}

          <div className="verify-footer">
            {timer > 0 ? (
              <p className="resend-text">
                RESEND CODE IN <span className="timer">{formattedTime}</span>
              </p>
            ) : (
              <button
                type="button"
                className="resend-button"
                onClick={handleResend}
              >
                RESEND CODE
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
