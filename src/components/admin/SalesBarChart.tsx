"use client";

import React, { useState, useMemo } from 'react';

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  unit?: string;
}

interface Order {
  id: string;
  username?: string;
  totalPrice: number;
  orderStatus: string;
  paymentStatus?: string;
  createdAt: string;
  items?: OrderItem[];
}

interface SalesBarChartProps {
  orders: Order[];
}

type Granularity = 'daily' | 'monthly' | 'yearly';
type RangeOption = 'all' | '7days' | '30days' | 'thisMonth' | 'thisYear' | 'custom';
type Metric = 'revenue' | 'orders';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function SalesBarChart({ orders }: SalesBarChartProps) {
  // State
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [rangeOption, setRangeOption] = useState<RangeOption>('all');
  const [metric, setMetric] = useState<Metric>('revenue');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Filter out cancelled orders
  const validOrders = useMemo(() => {
    return orders.filter(o => o.orderStatus !== 'ยกเลิกการสั่งซื้อ' && o.orderStatus !== 'ยกเลิก');
  }, [orders]);

  // 2. Filter orders by selected date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    
    return validOrders.filter(o => {
      if (!o.createdAt) return false;
      const orderDateStr = typeof o.createdAt === 'string' ? o.createdAt.substring(0, 10) : '';
      if (!orderDateStr) return false;
      const orderDate = new Date(o.createdAt);

      if (rangeOption === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return orderDate >= sevenDaysAgo;
      }

      if (rangeOption === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        return orderDate >= thirtyDaysAgo;
      }

      if (rangeOption === 'thisMonth') {
        const currentYM = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        return orderDateStr.substring(0, 7) === currentYM;
      }

      if (rangeOption === 'thisYear') {
        return orderDateStr.substring(0, 4) === now.getFullYear().toString();
      }

      if (rangeOption === 'custom') {
        if (startDate && orderDateStr < startDate) return false;
        if (endDate && orderDateStr > endDate) return false;
        return true;
      }

      return true; // 'all'
    });
  }, [validOrders, rangeOption, startDate, endDate]);

  // 3. Aggregate data by period (daily / monthly / yearly)
  const chartData = useMemo(() => {
    const buckets: { [key: string]: { label: string; fullLabel: string; revenue: number; orderCount: number } } = {};

    filteredOrders.forEach(o => {
      if (!o.createdAt) return;
      const dateStr = typeof o.createdAt === 'string' ? o.createdAt.substring(0, 10) : '';
      if (!dateStr) return;

      let key = '';
      let label = '';
      let fullLabel = '';

      if (granularity === 'daily') {
        key = dateStr; // YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          label = `${d} ${THAI_MONTHS_SHORT[m]}`;
          fullLabel = `วันที่ ${d} ${THAI_MONTHS_FULL[m]} พ.ศ. ${y + 543}`;
        } else {
          label = dateStr;
          fullLabel = dateStr;
        }
      } else if (granularity === 'monthly') {
        key = dateStr.substring(0, 7); // YYYY-MM
        const parts = key.split('-');
        if (parts.length === 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          label = `${THAI_MONTHS_SHORT[m]} ${y + 543}`;
          fullLabel = `เดือน${THAI_MONTHS_FULL[m]} พ.ศ. ${y + 543}`;
        } else {
          label = key;
          fullLabel = key;
        }
      } else {
        key = dateStr.substring(0, 4); // YYYY
        const y = parseInt(key, 10);
        label = `ปี ${y + 543}`;
        fullLabel = `ปี พ.ศ. ${y + 543} (ค.ศ. ${y})`;
      }

      if (!buckets[key]) {
        buckets[key] = { label, fullLabel, revenue: 0, orderCount: 0 };
      }
      buckets[key].revenue += Number(o.totalPrice || 0);
      buckets[key].orderCount += 1;
    });

    // Sort chronologically ascending for left-to-right timeline chart
    const keys = Object.keys(buckets).sort((a, b) => a.localeCompare(b));
    return keys.map(k => ({
      key: k,
      ...buckets[k]
    }));
  }, [filteredOrders, granularity]);

  // Raw max value in chart data
  const rawMaxValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => metric === 'revenue' ? d.revenue : d.orderCount));
  }, [chartData, metric]);

  // Calculate clean unique Y-axis ticks and effective Max to prevent duplicate numbers (e.g. 0 0 1 1 1)
  const { yAxisTicks, maxValue } = useMemo(() => {
    if (rawMaxValue <= 0) {
      const defaultMax = metric === 'orders' ? 4 : 100;
      const step = defaultMax / 4;
      return {
        maxValue: defaultMax,
        yAxisTicks: [defaultMax, step * 3, step * 2, step * 1, 0]
      };
    }

    if (metric === 'orders') {
      if (rawMaxValue <= 4) {
        return {
          maxValue: 4,
          yAxisTicks: [4, 3, 2, 1, 0]
        };
      }
      const step = Math.ceil(rawMaxValue / 4);
      const effMax = step * 4;
      return {
        maxValue: effMax,
        yAxisTicks: [effMax, step * 3, step * 2, step * 1, 0]
      };
    } else {
      // Revenue mode (THB)
      if (rawMaxValue <= 4) {
        return {
          maxValue: 4,
          yAxisTicks: [4, 3, 2, 1, 0]
        };
      }
      const rawStep = rawMaxValue / 4;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const residual = rawStep / magnitude;
      let step = 1 * magnitude;
      if (residual > 5) step = 10 * magnitude;
      else if (residual > 2) step = 5 * magnitude;
      else if (residual > 1) step = 2 * magnitude;

      let effMax = step * 4;
      if (effMax < rawMaxValue) {
        step = Math.ceil(rawMaxValue / 4);
        effMax = step * 4;
      }
      return {
        maxValue: effMax,
        yAxisTicks: [effMax, step * 3, step * 2, step * 1, 0]
      };
    }
  }, [rawMaxValue, metric]);

  // Summary Metrics
  const totalRevenue = useMemo(() => chartData.reduce((sum, d) => sum + d.revenue, 0), [chartData]);
  const totalOrdersCount = useMemo(() => chartData.reduce((sum, d) => sum + d.orderCount, 0), [chartData]);
  const averageValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return metric === 'revenue' ? Math.round(totalRevenue / chartData.length) : (totalOrdersCount / chartData.length).toFixed(1);
  }, [chartData, metric, totalRevenue, totalOrdersCount]);

  const peakPeriod = useMemo(() => {
    if (chartData.length === 0) return null;
    let peak = chartData[0];
    chartData.forEach(d => {
      const val = metric === 'revenue' ? d.revenue : d.orderCount;
      const peakVal = metric === 'revenue' ? peak.revenue : peak.orderCount;
      if (val > peakVal) peak = d;
    });
    return peak;
  }, [chartData, metric]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('th-TH');
  };

  const formatCompactNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
      {/* Header & Main Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-150">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h4 className="text-lg font-black text-stone-900">แผนภูมิแท่งวิเคราะห์ยอดขาย (Sales Bar Chart)</h4>
          </div>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            แสดงแนวโน้มและยอดขายจริงจากฐานข้อมูลระบบ เลือกดูตามช่วงเวลาที่ต้องการ
          </p>
        </div>

        {/* Granularity & Metric Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Granularity selector (Daily / Monthly / Yearly) */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/60">
            <button
              onClick={() => setGranularity('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                granularity === 'daily'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📅 รายวัน
            </button>
            <button
              onClick={() => setGranularity('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                granularity === 'monthly'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🗓️ รายเดือน
            </button>
            <button
              onClick={() => setGranularity('yearly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                granularity === 'yearly'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📈 รายปี
            </button>
          </div>

          {/* Metric selector (Revenue / Orders) */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/60">
            <button
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                metric === 'revenue'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              💰 ยอดขาย (บาท)
            </button>
            <button
              onClick={() => setMetric('orders')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                metric === 'orders'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📦 จำนวนออเดอร์
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/70">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-extrabold text-stone-700 mr-1 flex items-center gap-1">
            <span>📆</span> ช่วงเวลา:
          </span>
          <button
            onClick={() => setRangeOption('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              rangeOption === 'all'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            แสดงทั้งหมด
          </button>
          <button
            onClick={() => setRangeOption('7days')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              rangeOption === '7days'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            7 วันล่าสุด
          </button>
          <button
            onClick={() => setRangeOption('30days')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              rangeOption === '30days'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            30 วันล่าสุด
          </button>
          <button
            onClick={() => setRangeOption('thisMonth')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              rangeOption === 'thisMonth'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            เดือนนี้
          </button>
          <button
            onClick={() => setRangeOption('thisYear')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              rangeOption === 'thisYear'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            ปีนี้
          </button>
          <button
            onClick={() => setRangeOption('custom')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              rangeOption === 'custom'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            ระบุวันที่...
          </button>
        </div>

        {/* Custom date range inputs */}
        {rangeOption === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-700 animate-in fade-in duration-200">
            <span>ตั้งแต่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span>ถึง:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-red-600 hover:text-red-700 text-[11px] underline ml-1 cursor-pointer font-extrabold"
              >
                ล้างวันที่
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Summary Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">ยอดขายรวมในเลือก</p>
          <p className="text-xl font-black text-emerald-950 mt-1">
            ฿{formatNumber(totalRevenue)}
          </p>
        </div>
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">จำนวนออเดอร์รวม</p>
          <p className="text-xl font-black text-amber-950 mt-1">
            {formatNumber(totalOrdersCount)} รายการ
          </p>
        </div>
        <div className="bg-purple-50/70 border border-purple-200/60 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
            {metric === 'revenue'
              ? (granularity === 'daily' ? 'ยอดขายเฉลี่ย/วัน' : granularity === 'monthly' ? 'ยอดขายเฉลี่ย/เดือน' : 'ยอดขายเฉลี่ย/ปี')
              : (granularity === 'daily' ? 'ออเดอร์เฉลี่ย/วัน' : granularity === 'monthly' ? 'ออเดอร์เฉลี่ย/เดือน' : 'ออเดอร์เฉลี่ย/ปี')}
          </p>
          <p className="text-xl font-black text-purple-950 mt-1">
            {metric === 'revenue' ? `฿${formatNumber(Number(averageValue))}` : `${averageValue} รายการ`}
          </p>
        </div>
        <div className="bg-indigo-50/70 border border-indigo-200/60 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">ช่วงที่ขายดีที่สุด</p>
          <p className="text-sm font-extrabold text-indigo-950 mt-1 truncate">
            {peakPeriod ? `${peakPeriod.label} (${metric === 'revenue' ? `฿${formatNumber(peakPeriod.revenue)}` : `${peakPeriod.orderCount} ออเดอร์`})` : 'ไม่มีข้อมูล'}
          </p>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-2">
          <span className="text-4xl">📭</span>
          <p className="text-sm font-bold text-stone-600">ไม่พบข้อมูลยอดขายในช่วงเวลาที่เลือก</p>
          <p className="text-xs text-stone-400">ลองเปลี่ยนช่วงเวลาหรือปรับแต่งตัวกรองวันที่ด้านบนครับ</p>
        </div>
      ) : (
        <div className="relative pt-10 pb-6">
          {/* Main Container */}
          <div className="flex gap-3 items-end">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between h-64 text-[11px] font-extrabold text-stone-400 select-none text-right w-12 flex-shrink-0">
              {yAxisTicks.map((tick, i) => (
                <span key={i} className="leading-none transform -translate-y-1/2 first:translate-y-0 last:translate-y-0">
                  {metric === 'revenue' ? `฿${formatCompactNumber(tick)}` : tick}
                </span>
              ))}
            </div>

            {/* Chart Area */}
            <div className="relative flex-1 h-64 border-b border-stone-300">
              {/* Horizontal Reference Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="border-b border-dashed border-stone-200/90 w-full" />
                ))}
              </div>

              {/* Bars list */}
              <div className="relative z-10 w-full h-full flex items-end justify-between gap-1 sm:gap-3 px-2">
                {chartData.map((d, index) => {
                  const val = metric === 'revenue' ? d.revenue : d.orderCount;
                  const heightPercent = maxValue > 0 ? (val / maxValue) * 100 : 0;
                  const isPeak = peakPeriod?.key === d.key && val > 0;
                  const isHovered = hoveredIndex === index;

                  return (
                    <div
                      key={d.key}
                      className="relative flex-1 h-full flex items-end justify-center group cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Floating Crown + Value Label above each bar */}
                      {val > 0 && (
                        <div
                          className="absolute flex flex-col items-center transition-all duration-300 pointer-events-none z-20"
                          style={{ bottom: `calc(${heightPercent}% + 6px)` }}
                        >
                          {isPeak && (
                            <span className="text-xs mb-0.5 animate-bounce" title="ยอดขายสูงสุด">
                              👑
                            </span>
                          )}
                          {chartData.length <= 15 && (
                            <span className={`text-[11px] font-black whitespace-nowrap px-1 rounded-md transition-all ${
                              isHovered ? 'text-purple-700 bg-purple-50 scale-110 shadow-sm' : 'text-stone-700 bg-white/80'
                            }`}>
                              {metric === 'revenue' ? `฿${formatNumber(val)}` : val}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Interactive Tooltip on Hover */}
                      {isHovered && (
                        <div
                          className="absolute z-30 w-48 bg-stone-900 text-white rounded-2xl p-3 shadow-xl border border-stone-700 animate-in fade-in zoom-in-95 duration-150 pointer-events-none -translate-x-1/2 left-1/2"
                          style={{ bottom: `calc(${heightPercent}% + 38px)` }}
                        >
                          <p className="text-[11px] font-bold text-stone-300 border-b border-stone-700 pb-1 mb-1">
                            {d.fullLabel}
                          </p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-center font-extrabold text-emerald-400">
                              <span>ยอดขาย:</span>
                              <span>฿{formatNumber(d.revenue)}</span>
                            </div>
                            <div className="flex justify-between items-center font-bold text-amber-300">
                              <span>ออเดอร์:</span>
                              <span>{d.orderCount} รายการ</span>
                            </div>
                            {d.orderCount > 0 && (
                              <div className="flex justify-between items-center text-[10px] text-stone-400 pt-1 border-t border-stone-800">
                                <span>เฉลี่ย/ออเดอร์:</span>
                                <span>฿{formatNumber(Math.round(d.revenue / d.orderCount))}</span>
                              </div>
                            )}
                          </div>
                          {/* Triangle arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
                        </div>
                      )}

                      {/* Bar Graphic */}
                      <div
                        className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                          isHovered
                            ? 'bg-gradient-to-t from-purple-700 to-indigo-500 shadow-lg shadow-purple-500/30 scale-x-105'
                            : isPeak
                            ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 shadow-md shadow-emerald-500/20'
                            : metric === 'revenue'
                            ? 'bg-gradient-to-t from-emerald-700 to-emerald-500 hover:from-purple-600 hover:to-indigo-500'
                            : 'bg-gradient-to-t from-amber-600 to-amber-400 hover:from-purple-600 hover:to-indigo-500'
                        }`}
                        style={{ height: `${Math.max(heightPercent, val > 0 ? 2 : 0)}%` }}
                      />

                      {/* X-Axis Label */}
                      <div className="absolute top-full mt-2 w-full text-center">
                        <p className={`text-[10px] font-extrabold truncate px-0.5 transition-colors ${
                          isHovered ? 'text-purple-700 font-black' : isPeak ? 'text-emerald-800' : 'text-stone-500'
                        }`}>
                          {d.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Bottom legend note */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-8 pt-3 border-t border-stone-100 text-[11px] font-bold text-stone-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-gradient-to-t from-emerald-600 to-emerald-400 inline-block" />
                <span>ยอดขายปกติ</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 inline-block border border-amber-300" />
                <span>ยอดสูงสุด (👑 Peak)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-gradient-to-t from-purple-700 to-indigo-500 inline-block" />
                <span>โหมดชี้ (Hover)</span>
              </span>
            </div>
            <p>รวม {chartData.length} ช่วงเวลาที่แสดง</p>
          </div>
        </div>
      )}
    </div>
  );
}
