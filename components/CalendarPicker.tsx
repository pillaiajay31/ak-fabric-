"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn, formatDateIndian } from "@/lib/utils";

interface CalendarPickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  align?: "left" | "right";
  size?: "sm" | "md";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarPicker({
  value,
  onChange,
  label,
  placeholder = "Select date",
  className,
  align = "left",
  size = "md",
}: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse currently selected date
  const parsedDate = useMemo(() => {
    if (!value) return new Date();
    const parts = value.split("-").map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  }, [value]);

  // Calendar view navigation state (year & month)
  const [viewYear, setViewYear] = useState<number>(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(parsedDate.getMonth());

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const parts = value.split("-").map(Number);
      if (parts.length === 3) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  }, [value]);

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute days of the calendar view
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      dateStr: string;
    }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = totalDaysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const mStr = String(prevMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        day: d,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        dateStr: `${prevYear}-${mStr}-${dStr}`,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const mStr = String(viewMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        dateStr: `${viewYear}-${mStr}-${dStr}`,
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const mStr = String(nextMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        day: d,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        dateStr: `${nextYear}-${mStr}-${dStr}`,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;
    onChange(todayStr);
    setViewYear(y);
    setViewMonth(now.getMonth());
    setIsOpen(false);
  };

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  // Check today's date
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      {label && (
        <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button that opens calendar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg border text-left transition-all shadow-sm",
          size === "sm"
            ? "px-2.5 py-1.5 text-xs"
            : "px-3 py-2.5 text-xs font-medium",
          isOpen
            ? "border-neutral-950 ring-1 ring-neutral-950 dark:border-white dark:ring-white bg-white dark:bg-neutral-900"
            : "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 hover:border-neutral-400"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CalendarIcon className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
          <span className="font-semibold truncate">
            {value ? formatDateIndian(value) : placeholder}
          </span>
        </div>

        <span className="text-[10px] text-neutral-400 font-medium shrink-0 uppercase tracking-wider">
          {value === todayStr ? "Today" : "Calendar"}
        </span>
      </button>

      {/* Hidden input for standard forms accessibility without invoking system picker */}
      <input
        type="hidden"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Interactive Apple-Style Calendar Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-1.5 z-50 w-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous Month"
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="text-xs font-bold text-neutral-900 dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next Month"
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-neutral-400 mb-1">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="py-0.5">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((cell, idx) => {
              const isSelected = cell.dateStr === value;
              const isToday = cell.dateStr === todayStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDate(cell.dateStr)}
                  className={cn(
                    "h-8 w-8 text-xs font-medium rounded-lg flex items-center justify-center transition-all relative mx-auto",
                    isSelected
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-sm"
                      : cell.isCurrentMonth
                      ? "text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      : "text-neutral-400 dark:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/40",
                    isToday && !isSelected && "ring-1 ring-neutral-400 font-semibold"
                  )}
                >
                  {cell.day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-neutral-900 dark:bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={selectToday}
              className="px-2.5 py-1 rounded text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

