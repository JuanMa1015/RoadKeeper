import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Recordatorios from "./pages/Recordatorios";
import Mantenimientos from "./pages/Mantenimientos";
import Reportes from "./pages/Reportes";
import Formulario from "./pages/Formulario";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recordatorios" element={<Recordatorios />} />
        <Route path="/mantenimientos" element={<Mantenimientos />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/formulario" element={<Formulario />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
