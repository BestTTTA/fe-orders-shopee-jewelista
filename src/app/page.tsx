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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [orderLoading, setOrderLoading] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState("Shopee");

  useEffect(() => {
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
  const currentDate = new Date()
  const downloadPDF = async () => {
    setLoaded(true);
    const table = document.querySelector("table") as HTMLTableElement | null;

    if (table) {
      html2canvas(table, { scale: 1, useCORS: true }).then((canvas) => {
        const pdf = new jsPDF("landscape", "mm", "a4");
        const imgData = canvas.toDataURL("image/jpeg", 1);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const contentWidth = pageWidth - 16;
        const contentHeight = (canvas.height * contentWidth) / canvas.width;
        pdf.addImage(imgData, "JPEG", 8, 18, contentWidth, contentHeight);
        pdf.save(`orders_${currentDate}.pdf`);
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
          <h2 className="text-2xl font-bold">OrderHub</h2>
          <button onClick={() => setSelectedPlatform("Shopee")} className={`w-full p-2 text-center ${selectedPlatform === "Shopee" ? "bg-orange-500" : "bg-orange-500"} rounded-md p-2`}>
            Shopee
          </button>
          <button onClick={() => setSelectedPlatform("Lazada")} className={`w-full p-2 text-center ${selectedPlatform === "Lazada" ? "bg-blue-500" : "bg-blue-500"} rounded-md`}>
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
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="bg-gray-500 text-white p-4 rounded text-2xl font-bold hover:scale-105 focus:bg-gray-700 cursor-pointer">หน้าก่อนหน้า</button>
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="bg-gray-500 text-white p-4 rounded text-2xl font-bold hover:scale-105 focus:bg-gray-700">หน้าถัดไป</button>
          <button onClick={downloadPDF} className="bg-red-500 text-white px-2 py-2 rounded text-xl font-bold hover:scale-105">ดาวน์โหลด PDF</button>
        </div>

        <div id="pdf-content">
          <table className="min-w-full bg-white border border-black shadow-lg text-xl">
            <thead>
            <tr>
                <th colSpan={23} className="p-3 text-center font-extrabold text-4xl">แบบฟอร์มรับบิลออเดอร์ลูกค้า ONLINE</th>
              </tr>
              <tr>
                <th colSpan={6} className="border border-black bg-blue-400 p-3 text-center font-semibold">ข้อมูลลูกค้า</th>
                <th colSpan={6} className="border border-black bg-orange-400 p-3 text-center font-semibold ">ออเดอร์ที่สั่งซื้อ</th>
                <th colSpan={5} className="border border-black bg-green-400 p-3 text-center font-semibold ">กระบวนการผลิต</th>
                <th colSpan={6} className="border border-black bg-yellow-400 p-3 text-center font-semibold ">POS</th>
              </tr>
              <tr>
                {[
                  "No.",
                  "วันที่สั่ง",
                  "เวลาโอน",
                  "ช่องทาง",
                  "ชื่อตามช่องทาง",
                  "ชื่อจริงลูกค้า",
                  "ออเดอร์ที่สั่ง",
                  "SKU",
                  "สี/ไซต์",
                  "ราคา",
                  "วิธีจ่ายเงิน",
                  "มีสินค้า/พรีออเดอร์",
                  "เบิกจาก",
                  "ส่งงาน_ให้ช่าง",
                  "รับงาน_จากช่าง",
                  "ที่_อยู่",
                  "แพ็ค+จัดส่ง",
                  "แจ้งเลขพัสดุ",
                  "No.ลูกค้า",
                  "เพิ่มชื่อลูกค้า",
                  "สั่งซื้อ_เพื่อตัดขาย",
                  "ย้าย WHไป_ส่งแบบOnline",
                  "ตัดขาย"
                ].map((header, index) => (
                  <th
                    key={index}
                    className="border border-black bg-gray-100 p-3 text-center font-bold"
                    dangerouslySetInnerHTML={{ __html: header }}
                  />
                ))}
              </tr>
            </thead>

            <tbody>
              {currentPageOrders.map((order, orderIndex) => (
                <React.Fragment key={orderIndex}>
                  {order.item_list && order.item_list.length > 0 ? (
                    order.item_list.map((item: any, itemIndex: any) => (
                      <tr
                        key={itemIndex}
                        className={`border font-bold border-black ${orderIndex % 2 === 0 ? "bg-[#F3FEB8]" : "bg-white"}`}
                      >
                        <td className="border border-black px-2 py-1 whitespace-nowrap">
                          {(currentPage - 1) * itemsPerPage + orderIndex + 1}
                        </td>
                        <td className="border border-black px-2 py-1 whitespace-nowrap">
                          {order.create_time ? new Date(order.create_time * 1000).toLocaleDateString("en-GB") : ""}
                        </td>
                        <td className="border border-black px-2 py-1 whitespace-nowrap">
                          {order.create_time ? new Date(order.create_time * 1000).toLocaleTimeString() : ""}
                        </td>
                        <td className="border border-black px-2 py-1 whitespace-nowrap">Shopee</td>
                        <td className="border border-black px-2 py-1 whitespace-nowrap">{order.buyer_username}</td>
                        <td className="border border-black px-2 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            className={`w-80 ${orderIndex % 2 === 0 ? "bg-[#F3FEB8]" : "bg-white"}`}
                          />
                        </td>
                        <td className="border border-black px-2 py-1 whitespace-nowrap">{order.order_sn}</td>
                        <td className="border border-black px-2 py-1 whitespace-nowrap">{item.model_sku}</td>
                        <td className="border border-black px-2 py-1 whitespace-nowrap">{item.model_name}</td>
                        <td className="border border-black px-2 py-1 whitespace-nowrap">{item.model_discounted_price}</td>
                        <td className="border border-black px-2 py-1 whitespace-nowrap">{order.cod ? "COD" : ""}</td>
                        {Array.from({ length: 12 }).map((_, colIndex) => (
                          <td key={colIndex} className="border border-black whitespace-nowrap"></td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr
                      key={orderIndex}
                      className={`border border-black ${orderIndex % 2 === 0 ? "bg-[#F3FEB8]" : "bg-white"}`}
                    >
                      <td className="border border-black px-2 py-1 whitespace-nowrap">
                        {(currentPage - 1) * itemsPerPage + orderIndex + 1}
                      </td>
                      <td className="border border-black px-2 py-1 whitespace-nowrap">
                        {order.create_time ? new Date(order.create_time * 1000).toLocaleDateString("en-GB") : ""}
                      </td>
                      <td className="border border-black px-2 py-1 whitespace-nowrap">
                        {order.create_time ? new Date(order.create_time * 1000).toLocaleTimeString() : ""}
                      </td>
                      <td className="border border-black px-2 py-1 whitespace-nowrap">Shopee</td>
                      <td className="border border-black px-2 py-1 whitespace-nowrap">{order.buyer_username}</td>
                      <td className="border border-black px-2 py-1 whitespace-nowrap">
                        <input
                          type="text"
                          className={`w-full ${orderIndex % 2 === 0 ? "bg-[#F3FEB8]" : "bg-white"}`}
                        />
                      </td>
                      <td className="border border-black px-2 py-1 whitespace-nowrap">{order.order_sn}</td>
                      <td colSpan={3} className="border border-black px-2 py-1 whitespace-nowrap">
                        No items
                      </td>
                      <td className="border border-black px-2 py-1 whitespace-nowrap">{order.cod ? "COD" : ""}</td>
                      {Array.from({ length: 12 }).map((_, colIndex) => (
                        <td key={colIndex} className="border border-black px-2 py-1 whitespace-nowrap">
                          <input
                            type="text"
                            className={`w-full ${orderIndex % 2 === 0 ? "bg-[#F3FEB8]" : "bg-white"}`}
                          />
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
