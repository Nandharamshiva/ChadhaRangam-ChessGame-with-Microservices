import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import GameMode from "./pages/GameMode";
import TimeControl from "./pages/TimeControl";
import Matchmaking from "./pages/Matchmaking";
import Game from "./pages/Game";
import BotGame from "./pages/BotGame";
import LocalGame from "./pages/LocalGame";
import Profile from "./pages/Profile";
import Tutorials from "./pages/Tutorials";
import Themes from "./pages/Themes";
import Settings from "./pages/Settings";
import { isAuthenticated } from "./auth/auth";

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/mode"
          element={
            <RequireAuth>
              <GameMode />
            </RequireAuth>
          }
        />
        <Route
          path="/time-control/:mode"
          element={
            <RequireAuth>
              <TimeControl />
            </RequireAuth>
          }
        />
        <Route
          path="/matchmaking/:mode/:time"
          element={
            <RequireAuth>
              <Matchmaking />
            </RequireAuth>
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <RequireAuth>
              <Game />
            </RequireAuth>
          }
        />
        <Route
          path="/bot/:time"
          element={
            <RequireAuth>
              <BotGame />
            </RequireAuth>
          }
        />
        <Route
          path="/bot"
          element={
            <RequireAuth>
              <BotGame />
            </RequireAuth>
          }
        />
        <Route
          path="/local/:time"
          element={
            <RequireAuth>
              <LocalGame />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/tutorials"
          element={
            <RequireAuth>
              <Tutorials />
            </RequireAuth>
          }
        />
        <Route
          path="/themes"
          element={
            <RequireAuth>
              <Themes />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
