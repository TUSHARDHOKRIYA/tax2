import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = "<p style='padding:20px;font-family:system-ui;'>Root element #root not found.</p>";
  throw new Error("Root #root not found");
}

// Show loading immediately so something is visible
rootEl.innerHTML = "<div style='min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui;color:#64748b;'>Loading app...</div>";

// Error boundary to catch render errors
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return React.createElement(
        "div",
        {
          style: {
            minHeight: "100vh",
            padding: "24px",
            fontFamily: "system-ui",
            background: "#fef2f2",
            color: "#991b1b",
          },
        },
        React.createElement("h2", { style: { margin: "0 0 12px 0" } }, "Something went wrong"),
        React.createElement("pre", {
          style: { whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontSize: "14px" },
        }, this.state.error.message),
        React.createElement("p", { style: { marginTop: "16px", fontSize: "14px" } }, "Check the browser console (F12) for more details.")
      );
    }
    return this.props.children;
  }
}

// Load App dynamically so we can catch import/runtime errors
import("./App.tsx")
  .then(({ default: App }) => {
    rootEl.innerHTML = "";
    createRoot(rootEl).render(
      React.createElement(AppErrorBoundary, null, React.createElement(App))
    );
  })
  .catch((err) => {
    const msg = err?.message || String(err);
    const stack = err?.stack ? "\n\n" + err.stack : "";
    rootEl.innerHTML =
      "<div style='min-height:100vh;padding:24px;font-family:system-ui;background:#fef2f2;color:#991b1b;'>" +
      "<h2 style='margin:0 0 12px 0;'>Failed to load app</h2>" +
      "<pre style='white-space:pre-wrap;word-break:break-word;margin:0;font-size:14px;'>" +
      escapeHtml(msg + stack) +
      "</pre>" +
      "<p style='margin-top:16px;font-size:14px;'>Check the browser console (F12) for more details.</p>" +
      "</div>";
  });

function escapeHtml(text: string) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
