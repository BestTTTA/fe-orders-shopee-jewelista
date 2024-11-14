// src/app/page.tsx
"use client";

import React, { useState } from 'react';
import data from '../app/mock_up.json';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Page() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loaded, setLoaded] = useState<boolean>(false)

  const filteredOrders = data.response.order_list.filter((order) => {
    const orderDate = new Date(order.create_time * 1000);
    const orderDay = orderDate.getDate();
    const orderMonth = orderDate.getMonth() + 1;

    return (
      order.order_status === "READY_TO_SHIP" &&
      (selectedDate ? orderDay === parseInt(selectedDate) : true) &&
      (selectedMonth ? orderMonth === parseInt(selectedMonth) : true)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const displayedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const downloadPDF = async () => {
    setLoaded(true);
    window.scrollTo(0, 0);

    const content = document.body;

    html2canvas(content, {
      scale: 3,
      useCORS: true,
    }).then((canvas) => {
      const pdf = new jsPDF("landscape", "mm", "a4");

      const imgData = canvas.toDataURL("image/png");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = canvas.height * contentWidth / canvas.width;

      pdf.addImage(imgData, "PNG", margin, 0, contentWidth, contentHeight);
      pdf.save("full_page.pdf");
      setLoaded(false);
    });
  };


  const Loading = () => {
    return (
      <div className="flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-400 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-32 h-32">
          <path fill="none" stroke="#fff" strokeWidth="5" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
            <animateTransform
              attributeName="transform"
              type="rotate"
              dur="1s"
              from="0 50 50"
              to="360 50 50"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>



    )
  }

  const totalRows = 21;

  return (
    <div className='px-8 py-16'>
      {
        loaded ? <Loading /> : null
      }
      <h2 className="text-4xl font-bold mb-4 text-center">แบบฟอร์มรับบิลออเดอร์ลูกค้า ONLINE</h2>
      <div className="flex justify-start mb-4 space-x-4">
        <button onClick={downloadPDF} className="bg-red-500 text-white px-2 py-2 rounded text-2xl font-bold">
          ดาวน์โหลด PDF
        </button>

        <div className="flex items-center space-x-4">
          <label className='text-3xl font-bold'>วัน:</label>
          <input
            type="number"
            min="1"
            max="31"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-black p-6 w-15 rounded text-2xl font-bold"
          />
          <label className='text-3xl font-bold'>เดือน:</label>
          <input
            type="number"
            min="1"
            max="12"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-black p-6 w-15 rounded text-2xl font-bold"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-gray-500 text-white p-6 rounded text-2xl font-bold"
          >
            หน้าก่อนหน้า
          </button>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-gray-500 text-white p-6 rounded text-2xl font-bold"
          >
            หน้าถัดไป
          </button>
        </div>
      </div>

      <div id="pdf-content">
        <table className="min-w-full bg-white border border-black shadow-lg p-8 text-center text-2xl mt-14">
          <thead>
            <tr>
              <th colSpan={6} className="border border-black bg-blue-400 text-center " style={{ lineHeight: '2' }}>ข้อมูลลูกค้า</th>
              <th colSpan={6} className="border border-black bg-orange-400 text-center" style={{ lineHeight: '2' }}>ออเดอร์ที่สั่งซื้อ</th>
              <th colSpan={5} className="border border-black bg-green-400 text-center" style={{ lineHeight: '2' }}>กระบวนการผลิต</th>
              <th colSpan={6} className="border border-black bg-yellow-400 text-center" style={{ lineHeight: '2' }}>POS</th>
            </tr>
            <tr>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">No.</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">วันที่สั่ง</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">เวลาโอน</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">ช่องทาง</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">ชื่อตามช่องทาง</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">ชื่อจริงลูกค้า</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">ออเดอร์ที่สั่ง</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">SUK</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">สี/ไซต์</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">ราคา</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">วิธีจ่ายเงิน</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">มีสิ้นค้า/พรีออเดอร์</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">เบิกจาก</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">ส่งงานให้ช่าง</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">รับงานจากช่าง</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">ปริ้นที่อยู่</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">แพ็ค+จัดส่ง</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">แจ้งเลขพัสดุ</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">No.ลูกค้า</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">เพิ่มชื่อลูกค้า</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">สั่งซื้อเพื่อตัดขาย</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">ย้าย WH ไปส่งแบบOnline</th>
              <th className="p-2 border border-black bg-gray-100 text-center align-middle whitespace-nowrap">ตัดขาย</th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((order, orderIndex) => (
              order.item_list.map((item, itemIndex) => (
                <tr key={`${order.order_sn}-${itemIndex}`}>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    {(currentPage - 1) * itemsPerPage + orderIndex + 1}
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    {new Date(order.create_time * 1000).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    {new Date(order.create_time * 1000).toLocaleTimeString()}
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    Shopee
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    {order.buyer_username}
                  </td>
                  <td className="p-4 font-bold border border-black">
                    <input type="text" className='text-center h-full' />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    {order.order_sn}
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    {item.model_sku}
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    {item.model_name}
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    {item.model_discounted_price}
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    {order.cod ? "COD" : "Prepaid"}
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    <input type="checkbox" className='w-[60px] h-[60PX]' />
                  </td>
                  <td className="p-4 font-bold table-cell border border-black text-center align-middle whitespace-nowrap">
                    <input type="text" className='text-center' />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    <input type="checkbox" className="w-[60px] h-[60PX]" />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle">
                    <input type="checkbox" className="w-[60px] h-[60PX]" />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle">
                    <input type="checkbox" className="w-[60px] h-[60PX]" />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    <input type="text" className='text-center h-full' />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle">
                    <input type="checkbox" className="w-[60px] h-[60PX]" />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle whitespace-nowrap">
                    <input type="text" className='text-center h-full' />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle">
                    <input type="checkbox" className="w-[60px] h-[60PX]" />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle">
                    <input type="checkbox" className="w-[60px] h-[60PX]" />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle">
                    <input type="checkbox" className="w-[60px] h-[60PX]" />
                  </td>
                  <td className="p-4 font-bold border border-black text-center align-middle">
                    <input type="checkbox" className="w-[60px] h-[60PX]" />
                  </td>
                </tr>
              ))
            ))}
            {Array.from({ length: totalRows - filteredOrders.length }).map((_, index) => (
              <tr key={`empty-${index}`}>
                {Array.from({ length: 23 }).map((_, colIndex) => (
                  <td key={colIndex} className="p-2 border border-black text-center align-middle h-[100px]">&nbsp;</td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
