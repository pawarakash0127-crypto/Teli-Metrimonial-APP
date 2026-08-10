import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Profile from './pages/Profile';
import ProfileDetails from './pages/ProfileDetails';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import { AuthProvider } from './contexts/AuthContext';
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<ProfileDetails />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/admin/edit/:id" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <footer className="bg-maroon text-gold/80 py-12 border-t-4 border-gold/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center gap-6">
                <div className="font-serif font-bold text-2xl text-gold">
                  नाशिक तेली समाज
                </div>
                <div className="h-px w-32 bg-gold/20"></div>
                <p className="text-sm font-medium tracking-wide">
                  &copy; {new Date().getFullYear()} Nashik Teli Samaj Matrimony. All rights reserved.
                </p>
                <p className="text-xs opacity-60 italic">
                  Preserving Traditions, Building Futures
                </p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
