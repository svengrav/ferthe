import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { BlogList } from "./pages/BlogList";
import { BlogPost } from "./pages/BlogPost";
import { Home } from "./pages/Home";
import { Privacy } from "./pages/Privacy";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </Router>
  );
}

export default App;
