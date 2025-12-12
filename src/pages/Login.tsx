import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const buttonLabel = useMemo(() => (loading ? "Loading..." : "Login"), [loading]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // persist username optionally for UX parity
      if (remember) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      navigate("/");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <form onSubmit={handleSubmit}>
          <h2>Login</h2>

          {error && <div className="login-error">{error}</div>}

          <div className="input-box">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <i className="ri-mail-fill" aria-hidden="true" />
          </div>

          <div className="input-box">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <i
              className={showPassword ? "ri-eye-fill toggle-password" : "ri-eye-off-fill toggle-password"}
              onClick={() => setShowPassword((prev) => !prev)}
              role="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={0}
              onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowPassword((prev) => !prev);
                }
              }}
            />
          </div>

          <div className="remember">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <a href="#">Forgot Password?</a>
          </div>

          <div className="remember" style={{ justifyContent: "center", marginTop: "10px" }}>
            <span style={{ fontSize: "14px" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#fff", textDecoration: "underline" }}>
                Register
              </Link>
            </span>
          </div>

          <button type="submit" className="btnn" disabled={loading}>
            {buttonLabel}
          </button>

          <div className="button">
            <a href="#">
              <i className="ri-google-fill" /> Google
            </a>
            --
            <a href="#">
              <i className="ri-facebook-fill" /> Facebook
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
