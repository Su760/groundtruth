import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Analyze from "./pages/Analyze";
import Reports from "./pages/Reports";
import Quiz from "./pages/Quiz";
import Learn from "./pages/Learn";
import Tracker from "./pages/Tracker";
import DesignSystem from "./pages/DesignSystem";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/design-system" element={<DesignSystem />} />
      </Routes>
    </BrowserRouter>
  );
}
