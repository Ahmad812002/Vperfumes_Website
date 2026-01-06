import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  LogOut,
  Plus,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Settings,
} from "lucide-react";
import api from "@/api";
import { useAuth } from "@/AuthContext";
import { fromTheme } from "tailwind-merge";
import VITE_WS_BASE_URL from "../"

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// const BACKEND_URL = "http://127.0.0.1:8000";
const BACKEND_URL = process.env.REACT_APP_API_BASE_URL;
const API = `${BACKEND_URL}/api`;
// const WS_BASE = "ws://127.0.0.1:8000";
const WS_BASE = process.env.REACT_APP_WS_BASE_URL;

// const getAuthHeader = () => ({
//   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
// });

export default function CompanyDashboard({ onSettings }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    order_number: "",
    customer_name: "",
    customer_phone: "",
    delivery_area: "",
    order_price: "",
    delivery_cost: "",
    status: "جاري",
    order_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const wsRef = useRef(null);

  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (user.role !== "company") {
      logout();
      return;
    }
    let ws;

    fetchOrders();
    fetchStats();

    ws = new WebSocket(`${WS_BASE}/ws/orders/${user.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS connected for company:", user.id);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_order") {
        toast.warning("هنالك طلب جديد")
        setOrders((prev) => [data.order, ...prev]);
      }
    };

    ws.onerror = (e) => {
      console.error("WS error", e);
    };

    ws.onclose = () => {
      console.log("WS closed");
    };


    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, logout]);

  const fetchOrders = async () => {
    try {
      // const response = await axios.get(`${API}/orders`, getAuthHeader());
      // after using cookies delete getAuthHeader()
      const response = await api.get(`/orders`, { withCredentials: true });

      console.log(response.data);
      // fetch them by number of order from 1 to bigger
      // setOrders(response.data.sort((a, b) => a.order_number - b.order_number));
      // fetch them by date from newer to older
      setOrders(
        response.data.sort(
          (a, b) => new Date(b.order_date) - new Date(a.order_date)
        )
      );
      console.log(response.data);
    } catch (error) {
      console.error("fetchOrders error:", error);
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/stats`, { withCredentials: true });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        `/orders`,
        {
          ...formData,
          order_price: parseFloat(formData.order_price),
          delivery_cost: parseFloat(formData.delivery_cost),
        },
        { withCredentials: true }
      );

      toast.success("تم إضافة الطلب بنجاح");
      setAddDialogOpen(false);
      resetForm();
      fetchOrders();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في إضافة الطلب");
    }
  };

  const handleEditOrder = async (e) => {
    e.preventDefault();
    try {
      await api.put(
        `/orders/${selectedOrder.id}`,
        {
          ...formData,
          order_price: parseFloat(formData.order_price),
          delivery_cost: parseFloat(formData.delivery_cost),
        },
        { withCredentials: true }
      );
      toast.success("تم تعديل الطلب بنجاح");
      setEditDialogOpen(false);
      setSelectedOrder(null);
      resetForm();
      fetchOrders();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في تعديل الطلب");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;

    try {
      // await axios.delete(`${API}/orders/${orderId}`, getAuthHeader());
      await api.delete(`/orders/${orderId}`, { withCredentials: true });
      toast.success("تم حذف الطلب بنجاح");
      fetchOrders();
      fetchStats();
    } catch (error) {
      toast.error("فشل في حذف الطلب");
    }
  };

  const openEditDialog = (order) => {
    setSelectedOrder(order);
    setFormData({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      delivery_area: order.delivery_area,
      order_price: (order.order_price || 0).toString(),
      delivery_cost: order.delivery_cost.toString(),
      status: order.status,
      order_date: order.order_date,
      notes: order.notes || "",
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      order_number: "",
      customer_name: "",
      customer_phone: "",
      delivery_area: "",
      order_price: "",
      delivery_cost: "",
      status: "جاري",
      order_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchStatus = filterStatus === "all" || order.status === filterStatus;

    const search = searchQuery.toLowerCase().trim();
    var orderDateStr = new Date(order.order_date).toISOString().split("T")[0];

    orderDateStr = reverseDate(orderDateStr);

    const matchSearch =
      searchQuery === "" ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      order.delivery_area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orderDateStr.includes(search);

    return matchStatus && matchSearch;
  });

  function reverseDate(dateInput) {
    let array = dateInput.split("-");
    let reversedDate = `${array[2]}-${array[1]}-${array[0]}`;
    return reversedDate;
  }

  const getStatusBadge = (status) => {
    const badges = {
      جاري: {
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-4 h-4" />,
      },
      تم: {
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      ملغي: {
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="w-4 h-4" />,
      },
    };
    const badge = badges[status] || badges["جاري"];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
      >
        {badge.icon}
        {status}
      </span>
    );
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
      <header className="bg-white/80 backdrop-blur-lg shadow-md border-b border-amber-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1
                className="text-3xl font-bold text-purple-900"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {user.company_name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                لوحة التحكم - شركة التوصيل
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{user.username}</p>
                <p className="text-xs text-gray-500">{user.company_name}</p>
              </div>
              <Button
                onClick={onSettings}
                data-testid="settings-button"
                variant="outline"
                className="flex items-center gap-2 border-2 border-purple-200 hover:bg-purple-50"
              >
                <Settings className="w-4 h-4" />
                الإعدادات
              </Button>
              <Button
                onClick={logout}
                data-testid="logout-button"
                variant="outline"
                className="flex items-center gap-2 border-2 border-purple-200 hover:bg-purple-50"
              >
                <LogOut className="w-4 h-4" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الطلبات</p>
                <p className="text-3xl font-bold text-purple-900">
                  {stats.total}
                </p>
              </div>
              <Package className="w-12 h-12 text-purple-900 opacity-20" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">قيد التوصيل</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.ongoing}
                </p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">مكتمل</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ملغي</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.cancelled}
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters & Add Button */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block text-gray-700 font-medium">
                بحث
              </Label>
              <Input
                data-testid="search-input"
                placeholder="رقم الطلب، اسم الزبون، الموقع ،رقم الهاتف، تاريخ الطلب (yyyy-mm-dd / dd-mm-yyyy) "
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-2 border-gray-200 focus:border-amber-400"
              />
            </div>
            <div className="min-w-[150px]">
              <Label className="mb-2 block text-gray-700 font-medium">
                الحالة
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger
                  data-testid="filter-status"
                  className="border-2 border-gray-200"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="جاري">جاري</SelectItem>
                  <SelectItem value="تم">تم</SelectItem>
                  <SelectItem value="ملغي">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="add-order-button"
                  className="bg-gradient-to-r from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة طلب
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl text-right">
                    إضافة طلب جديد
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddOrder} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>رقم الطلب *</Label>
                      <Input
                        data-testid="order-number-input"
                        required
                        value={formData.order_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            order_number: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>تاريخ الطلب *</Label>
                      <Input
                        data-testid="order-date-input"
                        type="date"
                        required
                        value={formData.order_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            order_date: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>اسم الزبون *</Label>
                    <Input
                      data-testid="customer-name-input"
                      required
                      value={formData.customer_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customer_name: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>رقم الهاتف *</Label>
                    <Input
                      data-testid="customer-phone-input"
                      required
                      value={formData.customer_phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customer_phone: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>منطقة التوصيل *</Label>
                    <Input
                      data-testid="delivery-area-input"
                      required
                      value={formData.delivery_area}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          delivery_area: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>سعر الطلب (د.أ) *</Label>
                      <Input
                        data-testid="order-price-input"
                        type="number"
                        step="0.01"
                        required
                        value={formData.order_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            order_price: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>تكلفة التوصيل (د.أ) *</Label>
                      <Input
                        data-testid="delivery-cost-input"
                        type="number"
                        step="0.01"
                        required
                        value={formData.delivery_cost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            delivery_cost: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>الحالة *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger
                          data-testid="status-select"
                          className="mt-1"
                        >
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="جاري">جاري</SelectItem>
                          <SelectItem value="تم">تم</SelectItem>
                          <SelectItem value="ملغي">ملغي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>ملاحظات</Label>
                    <Textarea
                      data-testid="notes-input"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <Button
                    type="submit"
                    data-testid="submit-order-button"
                    className="w-full"
                  >
                    إضافة الطلب
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="orders-table">
              <thead>
                <tr className="bg-gradient-to-r from-purple-900 to-purple-700 text-white">
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    رقم الطلب
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    اسم الزبون
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    رقم الهاتف
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    المنطقة
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    سعر الطلب
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    تكلفة التوصيل
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    الحالة
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    تاريخ الطلب
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      data-testid={`order-row-${idx}`}
                      className="border-b border-gray-200 hover:bg-purple-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {order.customer_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600" dir="ltr">
                        {order.customer_phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.delivery_area}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-purple-900">
                        {order.order_price || 0} د.أ
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {order.delivery_cost} د.أ
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.order_date}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            data-testid={`edit-order-${idx}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(order)}
                            className="hover:bg-blue-100"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            data-testid={`delete-order-${idx}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-right">
              تعديل الطلب
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditOrder} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>رقم الطلب *</Label>
                <Input
                  data-testid="edit-order-number-input"
                  required
                  value={formData.order_number}
                  onChange={(e) =>
                    setFormData({ ...formData, order_number: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>تاريخ الطلب *</Label>
                <Input
                  data-testid="edit-order-date-input"
                  type="date"
                  required
                  value={formData.order_date}
                  onChange={(e) =>
                    setFormData({ ...formData, order_date: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>اسم الزبون *</Label>
              <Input
                data-testid="edit-customer-name-input"
                required
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>رقم الهاتف *</Label>
              <Input
                data-testid="edit-customer-phone-input"
                required
                value={formData.customer_phone}
                onChange={(e) =>
                  setFormData({ ...formData, customer_phone: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>منطقة التوصيل *</Label>
              <Input
                data-testid="edit-delivery-area-input"
                required
                value={formData.delivery_area}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_area: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>سعر الطلب (د.أ) *</Label>
                <Input
                  data-testid="edit-order-price-input"
                  type="number"
                  step="0.01"
                  required
                  value={formData.order_price}
                  onChange={(e) =>
                    setFormData({ ...formData, order_price: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>تكلفة التوصيل (د.أ) *</Label>
                <Input
                  data-testid="edit-delivery-cost-input"
                  type="number"
                  step="0.01"
                  required
                  value={formData.delivery_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_cost: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>الحالة *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger
                    data-testid="edit-status-select"
                    className="mt-1"
                  >
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="جاري">جاري</SelectItem>
                    <SelectItem value="تم">تم</SelectItem>
                    <SelectItem value="ملغي">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                data-testid="edit-notes-input"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="mt-1"
                rows={3}
              />
            </div>
            <Button
              type="submit"
              data-testid="submit-edit-button"
              className="w-full"
            >
              حفظ التعديلات
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
