import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

import { Routes, Route, Navigate} from "react-router-dom";
import login from "./pages/login.jsx";
import Register from "./pages/Register.jsx";
import Gallery from "./pages/Gallery.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return(
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
    </Routes>
  )
}