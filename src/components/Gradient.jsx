import { useState } from "react";

export default function Gradient({ gradient }) {
  const [copyActive, setCopyActive] = useState(false);
  const copy = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(gradient);
    setCopyActive(true);
    setTimeout(() => setCopyActive(false), 2000);
  };
  return (
    <div className="gradient mb-3 px-2 d-flex align-items-center shadow-sm" style={{ "--gradient": gradient }}>
      <div className={`copy mx-auto shadow-sm ${copyActive ? "active" : ""}`} onClick={copy}>
        <div className="text-bold text-x-large text-center my-2">Copy To Clipboard</div>
        <div className="gradient-code p-2" title="Click to Copy">
          <code>{gradient}</code>
        </div>
      </div>
    </div>
  );
}
