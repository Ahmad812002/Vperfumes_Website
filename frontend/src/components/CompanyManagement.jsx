import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowRight, Trash2, Building2, KeyRound, Copy, Check } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// const BACKEND_URL = "http://127.0.0.1:8000"
const API = `${BACKEND_URL}/api`;

// const getAuthHeader = () => ({
//   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
// });

export default function CompanyManagement({ onBack }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPasswordData, setNewPasswordData] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      // const response = await axios.get(`${API}/companies`, getAuthHeader());
      const response = await axios.get(`${API}/companies`, { withCredentials: true });
      setCompanies(response.data);
    } catch (error) {
      toast.error("فشل في تحميل الشركات");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCompany) return;

    try {
      // await axios.delete(
      //   `${API}/companies/${selectedCompany.id}`,
      //   getAuthHeader()
      // );
      await axios.delete(`${API}/companies/${selectedCompany.id}`, { withCredentials: true });
      toast.success(`تم حذف شركة ${selectedCompany.company_name} بنجاح`);
      setDeleteDialogOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في حذف الشركة");
    }
  };

  const handleResetPassword = async (company) => {
    try {
      // const response = await axios.post(
      //   `${API}/companies/${company.id}/reset-password`,
      //   {},
      //   getAuthHeader()
      // );

      const response = await axios.post(`${API}/companies/${company.id}/reset-password`, { withCredentials: true });
      setNewPasswordData(response.data);
      setResetPasswordDialogOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في إعادة تعيين كلمة المرور");
    }
  };

  const handleCopyPassword = () => {
    if (newPasswordData) {
      navigator.clipboard.writeText(newPasswordData.new_password);
      toast.success("تم نسخ كلمة المرور");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-md border-b border-amber-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              data-testid="back-button"
              variant="ghost"
              className="flex items-center gap-2 hover:bg-purple-50"
            >
              <ArrowRight className="w-5 h-5" />
              رجوع
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-purple-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                إدارة الشركات
              </h1>
              <p className="text-sm text-gray-600 mt-1">عرض وإدارة جميع شركات التوصيل</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-purple-900" />
            <div>
              <p className="text-sm text-gray-600">إجمالي الشركات</p>
              <p className="text-3xl font-bold text-purple-900">{companies.length}</p>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="companies-table">
              <thead>
                <tr className="bg-gradient-to-r from-purple-900 to-purple-700 text-white">
                  <th className="px-4 py-4 text-right text-sm font-semibold">اسم الشركة</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">اسم المستخدم</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">تاريخ الإنشاء</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center text-gray-500">
                      لا توجد شركات
                    </td>
                  </tr>
                ) : (
                  companies.map((company, idx) => (
                    <tr
                      key={company.id}
                      data-testid={`company-row-${idx}`}
                      className="border-b border-gray-200 hover:bg-purple-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 font-semibold text-purple-900">
                          <Building2 className="w-4 h-4" />
                          {company.company_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{company.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {company.created_at
                          ? new Date(company.created_at).toLocaleDateString("ar-EG")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            data-testid={`reset-password-${idx}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(company)}
                            className="hover:bg-blue-100 text-blue-600"
                          >
                            <KeyRound className="w-4 h-4 ml-1" />
                            إعادة تعيين كلمة المرور
                          </Button>
                          <Button
                            data-testid={`delete-company-${idx}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(company)}
                            className="hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>ملاحظة:</strong> عند حذف شركة، سيتم حذف حساب الدخول فقط. الطلبات ستبقى محفوظة في النظام للأرشفة والتحليل.
          </p>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">تأكيد حذف الحساب</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف حساب شركة <strong>{selectedCompany?.company_name}</strong>؟
              <br />
              <span className="text-blue-600 font-semibold mt-2 block">
                ملاحظة: سيتم حذف حساب الدخول فقط. جميع الطلبات ستبقى محفوظة في النظام.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel data-testid="cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete"
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">كلمة المرور الجديدة</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">تم إعادة تعيين كلمة المرور بنجاح لشركة:</p>
                  <p className="font-bold text-purple-900 text-lg">{newPasswordData?.company_name}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">اسم المستخدم:</p>
                  <p className="font-mono font-bold text-gray-900 text-lg mb-4">{newPasswordData?.username}</p>
                  
                  <p className="text-sm text-gray-600 mb-2">كلمة المرور الجديدة:</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-purple-900 text-xl flex-1" data-testid="new-password-display">
                      {newPasswordData?.new_password}
                    </p>
                    <Button
                      onClick={handleCopyPassword}
                      size="sm"
                      variant="outline"
                      className="hover:bg-purple-100"
                      data-testid="copy-password-button"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    ⚠️ <strong>مهم:</strong> احفظ هذه البيانات في مكان آمن. لن يمكنك رؤية كلمة المرور مرة أخرى.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse">
            <AlertDialogAction
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setNewPasswordData(null);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              فهمت، أغلق
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
