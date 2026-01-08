import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import api from "@/api"
import { useAuth } from "@/AuthContext";

// const BACKEND_URL = "http://127.0.0.1:8000";
const API = `${process.env.REACT_APP_WS_BASE_URL}`;

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { user, loading, login, logout } = useAuth();


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", { username, password }, { withCredentials: true });
      login(response.data.user)

      toast.success("تم تسجيل الدخول بنجاح");

    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل تسجيل الدخول");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold text-purple-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            VPerfumes
          </h1>
          <p className="text-gray-600 text-lg">نظام تتبع طلبات التوصيل</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-amber-200/50 animate-fade-in">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            تسجيل الدخول
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="username" className="text-gray-700 font-medium mb-2 block">
                اسم المستخدم
              </Label>
              <Input
                id="username"
                data-testid="login-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:border-amber-400 transition-colors"
                placeholder="أدخل اسم المستخدم"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium mb-2 block">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:border-amber-400 transition-colors"
                  placeholder="أدخل كلمة المرور"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "جارٍ تسجيل الدخول..." : "دخول"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
