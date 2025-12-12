import type { FormEvent, KeyboardEvent } from "react";
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const buttonLabel = useMemo(() => (loading ? "Creating Account..." : "Register"), [loading]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    // Client-side validation
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (username.trim().length < 3 || username.trim().length > 30) {
      setError("Username must be between 3 and 30 characters");
      return;
    }

    if (password.length < 6 || password.length > 24) {
      setError("Password must be between 6 and 24 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      // Redirect to chat after successful registration
      navigate("/");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <form onSubmit={handleSubmit}>
          <h2>Register</h2>

          {error && <div className="login-error">{error}</div>}

          <div className="input-box">
            <input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={30}
            />
            <i className="ri-user-fill" aria-hidden="true" />
          </div>

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
              autoComplete="new-password"
              minLength={6}
              maxLength={24}
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

          <div className="input-box">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              maxLength={24}
            />
            <i
              className={showConfirmPassword ? "ri-eye-fill toggle-password" : "ri-eye-off-fill toggle-password"}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              role="button"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              tabIndex={0}
              onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowConfirmPassword((prev) => !prev);
                }
              }}
            />
          </div>

          <div className="remember" style={{ justifyContent: "center", marginTop: "10px" }}>
            <span style={{ fontSize: "14px" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#fff", textDecoration: "underline" }}>
                Login
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

