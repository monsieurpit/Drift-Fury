import "./styles/index.css";
import * as ReactDOM from "react-dom/client";
import { App } from "./App.jsx";
import { LANG } from "./i18n.js";

document.documentElement.lang = LANG;
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
