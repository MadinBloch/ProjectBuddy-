import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error.message || "Something went wrong." };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "32px 20px", fontFamily: "sans-serif", color: "#111827", background: "#fff" }}>
          <h2 style={{ margin: "0 0 12px" }}>Something went wrong</h2>
          <p style={{ margin: 0, opacity: 0.8 }}>{this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
