import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import ManageClasses from "./components/ManageClasses";
import ViewClasses from "./components/ViewClasses";
import Calendar from "./components/Calendar";
import Ranking from "./components/Ranking";
import Profile from "./components/Profile";
import StravaRedirect from "./components/StravaRedirect";
import EditProfile from './components/EditProfile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/classes" element={<ViewClasses />} />
        <Route path="/manage-classes" element={<ManageClasses />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/strava-redirect" element={<StravaRedirect />} />
        <Route path="/edit-profile" element={<EditProfile />} />
      </Routes>
    </Router>
  );
}

export default App;