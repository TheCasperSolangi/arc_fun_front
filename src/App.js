import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Invoices from "./scenes/invoices";
import Contacts from "./scenes/contacts";
import Bar from "./scenes/bar";
import Form from "./scenes/form";
import Line from "./scenes/line";
import Pie from "./scenes/pie";
import FAQ from "./scenes/faq";
import Geography from "./scenes/geography";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Calendar from "./scenes/calendar/calendar";
import Videos from "./scenes/vids";

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      await handleLogin();
    } else {
      setIsAuthenticated(true);
    }
  };

  const handleLogin = async () => {
    try {
      // Prompt for username
      const username = window.prompt('Please enter your username:');
      if (!username) {
        window.alert('Username is required');
        return handleLogin();
      }

      // Prompt for password
      const password = window.prompt('Please enter your password:');
      if (!password) {
        window.alert('Password is required');
        return handleLogin();
      }

      // Make API request to login
      const response = await fetch('https://api.arcdatum.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('tokencaspe', data.token);
        setIsAuthenticated(true);
        window.alert('Login successful!');
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      window.alert(`Login failed: ${error.message}`);
      const retry = window.confirm('Would you like to try again?');
      if (retry) {
        await handleLogin();
      } else {
        window.location.reload();
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="app">
            <main className="content">
              <h1>Loading...</h1>
            </main>
          </div>
        </ThemeProvider>
      </ColorModeContext.Provider>
    );
  }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <Sidebar isSidebar={isSidebar} />
          <main className="content">
            <Topbar setIsSidebar={setIsSidebar} />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/team" element={<Team />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/vids" element={<Videos />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;