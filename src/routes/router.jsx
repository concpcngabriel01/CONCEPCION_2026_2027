import { createBrowserRouter, Navigate } from "react-router";
import App from "../App";
import Dashboard from "../pages/Dashboard";
import Hobby from "../pages/Hobby";
import Profile from "../pages/Profile";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "dashboard",
    element: <App />, // App will serve as a parent blueprint of our pages.
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "profile/:pk",
        // <int:pk>/
        element: <Profile />,
      },
      {
        path: "hobby/:pk",
        // <int:pk>/
        element: <Hobby />,
      },
    ],
  },
]);
