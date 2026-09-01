import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import CategoryDetail from './pages/CategoryDetail';
import SearchResults from './pages/SearchResults';
import ProviderProfile from './pages/ProviderProfile';
import ChatList from './pages/ChatList';
import ChatThread from './pages/ChatThread';
import Account from './pages/Account';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/category/:id" element={<CategoryDetail />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/provider/:id" element={<ProviderProfile />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:otherUserId" element={<ChatThread />} />
        <Route path="/account" element={<Account />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
