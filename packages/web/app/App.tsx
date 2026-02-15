import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { FeedbackButton } from "./components/FeedbackButton";
import { OverlayProvider } from "./components/overlay/Overlay";
import { About } from "./pages/About";
import { BlogList } from "./pages/BlogList";
import { BlogPost } from "./pages/BlogPost";
import { FAQ } from "./pages/FAQ";
import { Home } from "./pages/Home";
import { Privacy } from "./pages/Privacy";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </Router>
      <FeedbackButton className="fixed bottom-6 right-6" />
      <OverlayProvider />
    </div>
  );
}

export default App;
