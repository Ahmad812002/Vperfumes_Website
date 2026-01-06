import { useState, useRef } from "react"
import { convertTableToPdf } from "@/utils/pdf";
import { toast } from "sonner";
import axios from "axios";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export function ReportDateModal({ onClose }){

    const BACKEND_URL = "http://127.0.0.1:8000";
    const API = `${BACKEND_URL}/api`;


    const reportTableRef = useRef(null);
    const [ordersReport, setReportOrders] = useState([])
    const [reportDate, setReportDate] = useState("")

    const handleCreateReport = async () => {

        console.log(reportDate)
        
        if(!reportDate){
            toast.error("الرجاء اختيار تاريخ أولاً");
            return;
        }
        
        // try{
           const res = await axios.get(`${API}/orders/report?date=2025-11-25`, {
                // headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                params: { date: reportDate },
                withCredentials: true
                
            });

            setReportOrders(res.data);
            console.log(res.date)
            setTimeout(() => {
                convertTableToPdf(reportTableRef.current)
            }, 200);
        // }catch (error){
        //     console.log(error.response)
        //     toast.error(error.response?.data?.detail || "فشل في إنشاء التقرير" )
        // }
    }

    const getStatusBadge = (status) => {
        const badges = {
            "جاري": { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
            "تم": { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
            "ملغي": { color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
        };
        const badge = badges[status] || badges["جاري"];
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                {badge.icon}
                {status}
            </span>
        );
  };


    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          {/* Modal Overlay */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            
                {/* Modal Card */}
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scaleIn border border-purple-200/40">
                    
                    {/* Title */}
                    <h2 className="text-2xl font-semibold text-purple-800 mb-4 text-center">
                    تقرير حسب التاريخ
                    </h2>

                    {/* Date Input */}
                    <label className="text-sm text-gray-700 font-medium">
                    اختر التاريخ
                    </label>
                    <input
                    type="date"
                    onChange={(e) => setReportDate(e.target.value)}
                    className="
                        mt-2 w-full px-4 py-3 rounded-xl 
                        bg-purple-50 border border-purple-300 
                        text-purple-900 focus:outline-none
                        focus:ring-2 focus:ring-purple-500 
                        focus:border-purple-500 transition-all
                        shadow-inner
                    "
                    />

                    {/* Buttons */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="
                            px-4 py-2 rounded-xl bg-gray-100 
                            text-gray-600 font-medium hover:bg-gray-200 
                            transition-all
                            "
                        >
                            إغلاق
                        </button>

                        <button
                            onClick={handleCreateReport}
                            className="
                            px-5 py-2 rounded-xl bg-purple-700 
                            text-white font-medium hover:bg-purple-800 
                            shadow-lg hover:shadow-purple-300/40
                            transition-all
                            "
                        >
                            إنشاء تقرير
                        </button>
                    </div>
                </div>
            </div>


            {/* A hidden orders Table for report, just to make a pdf file with table content */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200/50 overflow-hidden" style={{visibility:"hidden"}}>
                <div className="overflow-x-auto">
                    <table className="w-full" data-testid="orders-table" ref={reportTableRef}>
                        <thead>
                            <tr className="bg-gradient-to-r from-purple-900 to-purple-700 text-white">
                            <th className="px-4 py-4 text-right text-sm font-semibold">رقم الطلب</th>
                            <th className="px-4 py-4 text-right text-sm font-semibold">الشركة</th>
                            <th className="px-4 py-4 text-right text-sm font-semibold">اسم الزبون</th>
                            <th className="px-4 py-4 text-right text-sm font-semibold">رقم الهاتف</th>
                            <th className="px-4 py-4 text-right text-sm font-semibold">المنطقة</th>
                            <th className="px-4 py-4 text-right text-sm font-semibold">سعر الطلب</th>
                            <th className="px-4 py-4 text-right text-sm font-semibold">تكلفة التوصيل</th>
                            <th className="px-4 py-4 text-right text-sm font-semibold">الحالة</th>
                            <th className="px-4 py-4 text-right text-sm font-semibold">تاريخ الطلب</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordersReport.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                                لا توجد طلبات
                                </td>
                            </tr>
                            ) : (
                            ordersReport.map((order, idx) => (
                                <tr key={order.id} className="border-b border-gray-200 hover:bg-purple-50/50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.order_number}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                                    {order.company_name}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{order.customer_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600" dir="ltr">{order.customer_phone}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{order.delivery_area}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-purple-900">{order.order_price || 0} د.أ</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{order.delivery_cost} د.أ</td>
                                <td className="px-4 py-3 text-sm">{getStatusBadge(order.status)}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{order.order_date}</td>
                                </tr>
                            ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}