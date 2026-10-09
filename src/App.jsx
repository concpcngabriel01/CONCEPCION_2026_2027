import { useState } from "react";
import { Link, Outlet } from "react-router";
import PopupLogin from "./components/popups/PopupLogin";

export default function App() {
  const [isLoginVisible, setLoginVisible] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header Navigation */}
      {isLoginVisible && (
        <PopupLogin
          isLoginVisible={isLoginVisible}
          setLoginVisible={setLoginVisible}
        />
      )}

      <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-6 py-4">
        <h1 className="m-0 text-xl font-bold">MY PORTFOLIO</h1>

        <nav aria-label="Main navigation">
          <ul className="m-0 flex list-none gap-3 p-0">
            <li><Link className="rounded px-3 py-2 text-white no-underline transition-colors duration-200 ease-in-out hover:bg-slate-700" to="/dashboard#about-me">About me</Link></li>
            <li><Link className="rounded px-3 py-2 text-white no-underline transition-colors duration-200 ease-in-out hover:bg-slate-700" to="/dashboard/hobby/1">Billiards</Link></li>
            <li><Link className="rounded px-3 py-2 text-white no-underline transition-colors duration-200 ease-in-out hover:bg-slate-700" to="/dashboard/hobby/2">Gym</Link></li>
            <li><Link className="rounded px-3 py-2 text-white no-underline transition-colors duration-200 ease-in-out hover:bg-slate-700" to="/dashboard/hobby/3">Playing guitar</Link></li>
          </ul>
        </nav>
      </header>

      {/* 
      URL: localhost:5173/dashboard/
      Outlet Component == 
      */}

      <Outlet />
    </main>
  );
}
