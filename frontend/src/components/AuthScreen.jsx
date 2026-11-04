import { useState } from "react";
import { Icon } from "./Icons.jsx";

export default function AuthScreen({ mode, onModeChange, onLogin, onRegister }) {
  const isRegister = mode === "register";
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) {
        await onRegister(values);
        setValues({ name: "", email: values.email, password: "" });
      } else {
        await onLogin(values);
      }
    } catch (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setError("");
    onModeChange(nextMode);
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <div className="auth-layout">
        <section className="auth-story">
          <div className="auth-brand"><div className="brand-mark"><Icon name="spark" /></div><span>smart<span className="brand-accent">spend</span></span></div>
          <div className="auth-copy">
            <p className="eyebrow">MONEY, MADE CLEAR</p>
            <h1>A calmer way to understand your money.</h1>
            <p>Keep every transaction in view, spot your spending patterns, and make your next move with confidence.</p>
          </div>
          <div className="auth-proof">
            <div className="proof-avatars"><span>J</span><span>M</span><span>A</span><span>+</span></div>
            <div><strong>Clarity over complexity.</strong><span>Your finances, beautifully organized.</span></div>
          </div>
          <span className="auth-copyright">© {new Date().getFullYear()} SmartSpend · Made for mindful money</span>
        </section>

        <section className="auth-form-side">
          <div className="auth-card">
            <div className="auth-card-icon"><Icon name={isRegister ? "user" : "spark"} size={21} /></div>
            <p className="eyebrow">{isRegister ? "START YOUR JOURNEY" : "WELCOME BACK"}</p>
            <h2>{isRegister ? "Create your account" : "Sign in to SmartSpend"}</h2>
            <p className="auth-intro">{isRegister ? "A clearer picture of your spending starts here." : "Your finances are right where you left them."}</p>

            <form onSubmit={submit} className="auth-form">
              {isRegister && <label className="form-field"><span>Full name</span><input autoComplete="name" value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="Alex Morgan" maxLength={100} required /></label>}
              <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" required /></label>
              <label className="form-field"><span>Password</span><input type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={values.password} onChange={(event) => update("password", event.target.value)} placeholder={isRegister ? "At least 8 characters" : "Enter your password"} minLength={isRegister ? 8 : undefined} maxLength={128} required /></label>
              {error && <div className="form-error"><Icon name="alert" size={16} /><span>{error}</span></div>}
              <button className="button button-primary auth-submit" disabled={submitting}>{submitting ? <span className="button-spinner" /> : <>{isRegister ? "Create account" : "Sign in"} <Icon name="arrow" /></>}</button>
            </form>

            <div className="auth-switch">{isRegister ? "Already have an account?" : "New to SmartSpend?"}<button onClick={() => switchMode(isRegister ? "login" : "register")}>{isRegister ? "Sign in" : "Create an account"}</button></div>
            <div className="auth-security"><Icon name="shield" size={15} /> Your data is encrypted and private</div>
          </div>
        </section>
      </div>
    </main>
  );
}
