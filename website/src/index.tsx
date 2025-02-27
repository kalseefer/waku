import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "waku/router/client";

import "./index.css";

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <Router />
  </StrictMode>
);
