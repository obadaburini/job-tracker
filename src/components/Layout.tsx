import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-body">
        <Sidebar />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}