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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string>("744c6266634b464f4870414a536e5658");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Adjust the number of items displayed per page
  const [orderLoading, setOrderLoading] = useState<boolean>(false)

  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshToken = async () => {
    try {
      const url = `https://order-api-dev.thetigerteamacademy.net/refresh_token?refresh_token=${refreshTokenValue}`;
      const response = await axios.post(url, null, { headers: { accept: "application/json" } });
      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;

      setAccessToken(newAccessToken);
      setRefreshTokenValue(newRefreshToken);

      return newAccessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  };

  const fetchOrders = async (startDate: string, endDate: string) => {
    setOrderLoading(true)
    try {
      const token = accessToken || (await refreshToken());
      const params = new URLSearchParams({
        access_token: token,
        start_date: startDate,
        end_date: endDate,
        order_status: "READY_TO_SHIP",
        request_order_status_pending: "false",
        response_optional_fields: "buyer_username,pay_time,item_list",
      });
      const url = `https://order-api-dev.thetigerteamacademy.net/get_all_orders?${params}`;
      const response = await axios.post(url);
      setOrders(response.data.order_detail);
      setOrderLoading(false)
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    if (isClient && !accessToken) {
      const initializeTokenAndFetchOrders = async () => {
        try {
          const newAccessToken = await refreshToken();
          setAccessToken(newAccessToken);

          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 1);

          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 10);

          await fetchOrders(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]);

          const fetchOrdersInterval = setInterval(async () => {
            const refreshedToken = await refreshToken();
            setAccessToken(refreshedToken);
            await fetchOrders(startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]);
          }, 10800000);

          return () => clearInterval(fetchOrdersInterval);
        } catch (error) {
          console.error("Failed to initialize token or fetch orders:", error);
        }
      };

      initializeTokenAndFetchOrders();
    }
  }, [isClient, accessToken]);

  const totalRows = 21;

  const placeholderOrder: Order = {
    order_sn: "",
    create_time: 0,
    buyer_username: "",
    cod: false,
    order_status: "",
    item_list: [{ model_sku: "", model_name: "", model_discounted_price: 0, image_info: { image_url: "" } }],
  };

  // Sort orders by `create_time` in ascending order (oldest to newest)
  const sortedOrders = [...orders].sort((a, b) => a.create_time - b.create_time);

  // Fill orders to totalRows with placeholders if there are fewer rows
  const filledOrders = [...sortedOrders, ...Array(totalRows - sortedOrders.length).fill(placeholderOrder)];

  // Calculate pagination
  const totalPages = Math.ceil(filledOrders.length / itemsPerPage);
  const currentPageOrders = filledOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const downloadPDF = async () => {
    setLoaded(true);
    const table = document.querySelector("table") as HTMLTableElement | null;

    if (table) {
      html2canvas(table, { scale: 3, useCORS: true }).then((canvas) => {
        const pdf = new jsPDF("landscape", "mm", "a4");
        const imgData = canvas.toDataURL("image/png");
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
      <div className="animate-pulse rounded-md p-4 text-white text-2xl bg-yellow-700">Dowloading...</div>
    </div>
  );



  return (
    <div className="">
      <div className="text-black flex flex-col gap-6 p-4">
        <p>AccessToken: {accessToken}</p>
        <p>RefreshToken: {refreshTokenValue}</p>
      </div>
      {loaded && <Loading />}
      {orderLoading && <Loading />}
      <div className="flex w-full justify-center">
        <h1 className="text-4xl font-bold mb-4 text-center">แบบฟอร์มรับบิลออเดอร์ลูกค้า ONLINE</h1>
      </div>
      <div className="flex justify-start p-4 space-x-4">
        <button onClick={downloadPDF} className="bg-red-500 text-white px-2 py-2 rounded text-2xl font-bold">ดาวน์โหลด PDF</button>
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="bg-gray-500 text-white p-6 rounded text-2xl font-bold">หน้าก่อนหน้า</button>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="bg-gray-500 text-white p-6 rounded text-2xl font-bold">หน้าถัดไป</button>
      </div>

      <div id="pdf-content">
        <table className="min-w-full bg-white border border-black shadow-lg text-center text-2xl mt-14">
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
            {currentPageOrders.map((order, index) => (
              <tr key={index} className="whitespace-nowrap ">
                <td className="border border-black text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="border border-black text-center p-4 ">{order.create_time ? new Date(order.create_time * 1000).toLocaleDateString("en-GB") : ""}</td>
                <td className="border border-black text-center p-4">{order.create_time ? new Date(order.create_time * 1000).toLocaleTimeString() : ""}</td>
                <td className="border border-black text-center p-4">{order.create_time ? "Shopee" : ""}</td>
                <td className="border border-black text-center p-4">{order.buyer_username}</td>
                <td className="border border-black"><input type="text" className="text-center w-full p-4" /></td>
                <td className="border border-black text-center p-4">{order.order_sn}</td>
                <td className="border border-black text-center p-4">{order.item_list[0]?.model_sku || ""}</td>
                <td className="border border-black text-center p-4">{order.item_list[0]?.model_name || ""}</td>
                <td className="border border-black text-center p-4">{order.item_list[0]?.model_discounted_price || ""}</td>
                <td className="border border-black text-center p-4">{order.cod ? "COD" : ""}</td>
                {Array.from({ length: 12 }).map((_, colIndex) => (
                  <td key={colIndex} className="border border-black text-center p-4"><input type="text" className="text-center w-24" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
