"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";

interface Order {
  order_sn: string;
  create_time: number;
  buyer_username: string;
  cod: boolean;
  order_status: string;
  item_list: Item[];
}

interface Item {
  model_sku: string;
  model_name: string;
  model_discounted_price: number;
  image_info: {
    image_url: string;
  };
}

export default function Page() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [orderLoading, setOrderLoading] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState("Shopee");

  useEffect(() => {
    setIsClient(true);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 15);
    fetchOrders(formatDate(startDate), formatDate(endDate));
  }, []);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchOrders = async (startDate: string, endDate: string) => {
    setOrderLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        order_status: "READY_TO_SHIP",
        request_order_status_pending: "false",
        response_optional_fields: "buyer_username,pay_time,item_list",
      });
  
      const platformUrl: any = {
        Shopee: "https://order-api-dev.thetigerteamacademy.net/get_all_orders",
        Lazada: "https://order-api-dev.thetigerteamacademy.net/get_all_orders_lazada",
        TikTok: "https://order-api-dev.thetigerteamacademy.net/get_all_orders_tiktok",
      };
  
      const url = `${platformUrl[selectedPlatform]}?${params.toString()}`;
      const response = await axios.post(url);
  
      // Set `order_detail` in state instead of `order_list`
      setOrders(response.data.order_detail || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrderLoading(false);
    }
  };
  

  const totalRows = 21;

  const placeholderOrder: Order = {
    order_sn: "",
    create_time: 0,
    buyer_username: "",
    cod: false,
    order_status: "",
    item_list: [{ model_sku: "", model_name: "", model_discounted_price: 0, image_info: { image_url: "" } }],
  };

  const sortedOrders = [...orders].sort((a, b) => a.create_time - b.create_time);

  const filledOrders = sortedOrders.length < totalRows
    ? [...sortedOrders, ...Array(totalRows - sortedOrders.length).fill(placeholderOrder)]
    : sortedOrders;

  const totalPages = Math.ceil(filledOrders.length / itemsPerPage);
  const currentPageOrders = filledOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const downloadPDF = async () => {
    setLoaded(true);
    const table = document.querySelector("table") as HTMLTableElement | null;

    if (table) {
      html2canvas(table, { scale: 1.5, useCORS: true }).then((canvas) => {
        const pdf = new jsPDF("landscape", "mm", "a4");
        const imgData = canvas.toDataURL("image/jpeg", 0.5);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const contentWidth = pageWidth - 16;
        const contentHeight = (canvas.height * contentWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 8, 18, contentWidth, contentHeight);
        pdf.save("table_only.pdf");
        setLoaded(false);
      });
    }
  };

  const Loading = () => (
    <div className="flex w-full absolute justify-center items-center h-full">
      <div className="animate-pulse rounded-md p-4 text-white text-2xl bg-yellow-700">Downloading...</div>
    </div>
  );

  return (
    <div className="flex gap-2">
      <div className="flex">
        {/* Sidebar */}
        <div className="bg-gray-800 min-h-screen p-6 text-white space-y-6">
          <h2 className="text-2xl font-bold">Platform</h2>
          <button onClick={() => setSelectedPlatform("Shopee")} className={`w-full p-2 text-center ${selectedPlatform === "Shopee" ? "bg-orange-500" : "bg-orange-500"} rounded-md p-2`}>
            Shopee
          </button>
          <button onClick={() => setSelectedPlatform("Lazada")} className={`w-full p-2 text-center ${selectedPlatform === "Lazada" ? "bg-gray-700" : "bg-gray-700"} rounded-md`}>
            Lazada
          </button>
          <button onClick={() => setSelectedPlatform("TikTok")} className={`w-full p-2 text-center ${selectedPlatform === "TikTok" ? "bg-gray-700" : "bg-gray-700"} rounded-md`}>
            TikTok
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {loaded && <Loading />}
        {orderLoading && <Loading />}
        <div className="flex w-full justify-center">
          <h1 className="text-4xl font-bold mb-4 text-center">แบบฟอร์มรับบิลออเดอร์ลูกค้า ONLINE</h1>
        </div>

        <div className="flex justify-start space-x-4 mb-2">
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="bg-gray-500 text-white p-4 rounded text-2xl font-bold hover:scale-105 focus:bg-gray-700">หน้าก่อนหน้า</button>
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="bg-gray-500 text-white p-4 rounded text-2xl font-bold hover:scale-105 focus:bg-gray-700">หน้าถัดไป</button>
          <button onClick={downloadPDF} className="bg-red-500 text-white px-2 py-2 rounded text-xl font-bold hover:scale-105">ดาวน์โหลด PDF</button>
        </div>

        <div id="pdf-content">
          <table className="min-w-full bg-white border border-black shadow-lg text-center text-2xl">
            <thead>
              <tr className="">
                <th colSpan={6} className="border p-1 border-black bg-blue-400">ข้อมูลลูกค้า</th>
                <th colSpan={6} className="border p-1 border-black bg-orange-400">ออเดอร์ที่สั่งซื้อ</th>
                <th colSpan={5} className="border p-1 border-black bg-green-400">กระบวนการผลิต</th>
                <th colSpan={6} className="border p-1 border-black bg-yellow-400">POS</th>
              </tr>
              <tr className=" border-black">
                <th className="border bg-gray-100  border-black p-2">No.</th>
                <th className="border bg-gray-100  border-black">วันที่สั่ง</th>
                <th className="border bg-gray-100  border-black">เวลาโอน</th>
                <th className="border bg-gray-100  border-black">ช่องทาง</th>
                <th className="border bg-gray-100  border-black">ชื่อตามช่องทาง</th>
                <th className="border bg-gray-100 whitespace-nowrap border-black px-20">ชื่อจริงลูกค้า</th>
                <th className="border bg-gray-100  border-black">ออเดอร์ที่สั่ง</th>
                <th className="border bg-gray-100  border-black">SUK</th>
                <th className="border bg-gray-100  border-black">สี/ไซต์</th>
                <th className="border bg-gray-100  border-black">ราคา</th>
                <th className="border bg-gray-100 whitespace-nowrap border-black">วิธีจ่ายเงิน</th>
                <th className="border bg-gray-100  border-black">มีสิ้นค้า/พรีออเดอร์</th>
                <th className="border bg-gray-100  border-black">เบิกจาก</th>
                <th className="border bg-gray-100  border-black">ส่งงานให้ช่าง</th>
                <th className="border bg-gray-100  border-black">รับงานจากช่าง</th>
                <th className="border bg-gray-100  border-black">ปริ้นที่อยู่</th>
                <th className="border bg-gray-100  border-black">แพ็ค+จัดส่ง</th>
                <th className="border bg-gray-100  border-black">แจ้งเลขพัสดุ</th>
                <th className="border bg-gray-100  border-black">No.ลูกค้า</th>
                <th className="border bg-gray-100  border-black">เพิ่มชื่อลูกค้า</th>
                <th className="border bg-gray-100  border-black">สั่งซื้อเพื่อตัดขาย</th>
                <th className="border bg-gray-100  border-black">ย้าย WH ไปส่งแบบOnline</th>
                <th className="border bg-gray-100  border-black">ตัดขาย</th>
              </tr>
            </thead>
            <tbody>
  {currentPageOrders.map((order, orderIndex) => (
    <React.Fragment key={orderIndex}>
      {order.item_list && order.item_list.length > 0 ? (
        order.item_list.map((item:any, itemIndex:any) => (
          <tr key={itemIndex} className="whitespace-nowrap">
            <td className="border border-black text-center">
              {(currentPage - 1) * itemsPerPage + orderIndex + 1}
            </td>
            <td className="border border-black text-center p-4">
              {order.create_time ? new Date(order.create_time * 1000).toLocaleDateString("en-GB") : ""}
            </td>
            <td className="border border-black text-center p-4">
              {order.create_time ? new Date(order.create_time * 1000).toLocaleTimeString() : ""}
            </td>
            <td className="border border-black text-center p-4">Shopee</td>
            <td className="border border-black text-center p-4">{order.buyer_username}</td>
            <td className="border border-black"><input type="text" className="text-center w-full p-4" /></td>
            <td className="border border-black text-center p-4">{order.order_sn}</td>
            <td className="border border-black text-center p-4">{item.model_sku}</td>
            <td className="border border-black text-center p-4">{item.model_name}</td>
            <td className="border border-black text-center p-4">{item.model_discounted_price}</td>
            <td className="border border-black text-center p-4">{order.cod ? "COD" : ""}</td>
            {Array.from({ length: 12 }).map((_, colIndex) => (
              <td key={colIndex} className="border border-black text-center p-4">
                <input type="text" className="text-center w-24" />
              </td>
            ))}
          </tr>
        ))
      ) : (
        <tr key={orderIndex} className="whitespace-nowrap">
          <td className="border border-black text-center">
            {(currentPage - 1) * itemsPerPage + orderIndex + 1}
          </td>
          <td className="border border-black text-center p-4">
            {order.create_time ? new Date(order.create_time * 1000).toLocaleDateString("en-GB") : ""}
          </td>
          <td className="border border-black text-center p-4">
            {order.create_time ? new Date(order.create_time * 1000).toLocaleTimeString() : ""}
          </td>
          <td className="border border-black text-center p-4">Shopee</td>
          <td className="border border-black text-center p-4">{order.buyer_username}</td>
          <td className="border border-black"><input type="text" className="text-center w-full p-4" /></td>
          <td className="border border-black text-center p-4">{order.order_sn}</td>
          <td colSpan={3} className="border border-black text-center p-4">No items</td>
          <td className="border border-black text-center p-4">{order.cod ? "COD" : ""}</td>
          {Array.from({ length: 12 }).map((_, colIndex) => (
            <td key={colIndex} className="border border-black text-center p-4">
              <input type="text" className="text-center w-24" />
            </td>
          ))}
        </tr>
      )}
    </React.Fragment>
  ))}
</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
