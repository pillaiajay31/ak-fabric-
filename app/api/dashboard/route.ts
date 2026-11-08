import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const dateParam = searchParams.get("date");

    const [rolls, machines, rejections] = await Promise.all([
      store.getRolls(),
      store.getMachines(),
      store.getRejections(),
    ]);

    const todayStr = new Date().toISOString().split("T")[0];

    // Determine startDate and endDate
    let startDate = startDateParam || dateParam || todayStr;
    let endDate = endDateParam || dateParam || todayStr;

    // Ensure startDate <= endDate
    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    // Calculate number of calendar days in this range
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const daysCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // Filter rolls within date range
    const periodRolls = rolls.filter(
      (r) => r.date >= startDate && r.date <= endDate
    );
    const periodKg = Number(
      periodRolls.reduce((sum, r) => sum + r.netWeight, 0).toFixed(2)
    );
    const periodCount = periodRolls.length;

    // Machine breakdown for selected period
    const machineStats: Record<
      string,
      { code: string; name: string; rolls: number; weight: number; target: number }
    > = {};

    machines.forEach((m) => {
      const targetForPeriod = (m.dailyTargetKg || 450) * daysCount;
      machineStats[m.code] = {
        code: m.code,
        name: m.name,
        rolls: 0,
        weight: 0,
        target: targetForPeriod,
      };
    });

    periodRolls.forEach((r) => {
      const code = r.machineCode || "A";
      if (!machineStats[code]) {
        machineStats[code] = {
          code,
          name: `Machine ${code}`,
          rolls: 0,
          weight: 0,
          target: 450 * daysCount,
        };
      }
      machineStats[code].rolls += 1;
      machineStats[code].weight = Number(
        (machineStats[code].weight + r.netWeight).toFixed(2)
      );
    });

    // Determine best performing machine in period
    const sortedMachines = Object.values(machineStats).sort(
      (a, b) => b.weight - a.weight
    );
    const bestMachine =
      sortedMachines.length > 0 && sortedMachines[0].weight > 0
        ? sortedMachines[0]
        : null;

    // Rejection stats in selected period
    const periodRejections = rejections.filter(
      (rej) => rej.date >= startDate && rej.date <= endDate
    );
    const periodRejectedKg = Number(
      periodRejections.reduce((sum, rej) => sum + rej.netWeight, 0).toFixed(2)
    );
    const totalRejectionKg = Number(
      rejections.reduce((sum, rej) => sum + rej.netWeight, 0).toFixed(2)
    );
    const rejectionRate =
      periodKg + periodRejectedKg > 0
        ? Number(((periodRejectedKg / (periodKg + periodRejectedKg)) * 100).toFixed(1))
        : 0;

    // Inventory stock summary (Overall current warehouse state)
    const inStockRolls = rolls.filter((r) => r.status === "in_stock");
    const inStockKg = Number(
      inStockRolls.reduce((sum, r) => sum + r.netWeight, 0).toFixed(2)
    );
    const dispatchedRolls = rolls.filter((r) => r.status === "dispatched");
    const dispatchedKg = Number(
      dispatchedRolls.reduce((sum, r) => sum + r.netWeight, 0).toFixed(2)
    );

    // Trend data within period (or last 7-14 dates)
    const dateMap: Record<
      string,
      { date: string; totalKg: number; rolls: number; A: number; B: number; C: number; D: number }
    > = {};

    rolls.forEach((r) => {
      // If user selected a range, show dates within that range (or recent history)
      if (r.date >= startDate && r.date <= endDate) {
        if (!dateMap[r.date]) {
          dateMap[r.date] = {
            date: r.date,
            totalKg: 0,
            rolls: 0,
            A: 0,
            B: 0,
            C: 0,
            D: 0,
          };
        }
        dateMap[r.date].totalKg = Number(
          (dateMap[r.date].totalKg + r.netWeight).toFixed(2)
        );
        dateMap[r.date].rolls += 1;
        const mc = (r.machineCode as "A" | "B" | "C" | "D") || "A";
        if (dateMap[r.date][mc] !== undefined) {
          dateMap[r.date][mc] = Number(
            (dateMap[r.date][mc] + r.netWeight).toFixed(2)
          );
        }
      }
    });

    let trendData = Object.values(dateMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // If single day was selected, show up to 7 preceding active dates leading up to that date for context
    if (startDate === endDate) {
      const priorDatesMap: Record<
        string,
        { date: string; totalKg: number; rolls: number; A: number; B: number; C: number; D: number }
      > = {};
      rolls.forEach((r) => {
        if (r.date <= endDate) {
          if (!priorDatesMap[r.date]) {
            priorDatesMap[r.date] = { date: r.date, totalKg: 0, rolls: 0, A: 0, B: 0, C: 0, D: 0 };
          }
          priorDatesMap[r.date].totalKg = Number(
            (priorDatesMap[r.date].totalKg + r.netWeight).toFixed(2)
          );
          priorDatesMap[r.date].rolls += 1;
          const mc = (r.machineCode as "A" | "B" | "C" | "D") || "A";
          if (priorDatesMap[r.date][mc] !== undefined) {
            priorDatesMap[r.date][mc] = Number(
              (priorDatesMap[r.date][mc] + r.netWeight).toFixed(2)
            );
          }
        }
      });
      trendData = Object.values(priorDatesMap)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7);
    }

    // Recent 10 roll activities
    const recentRolls = [...periodRolls]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        startDate,
        endDate,
        daysCount,
        isRange: startDate !== endDate,
        today: todayStr,
        periodKg,
        periodCount,
        bestMachine,
        machineStats: Object.values(machineStats),
        inStock: {
          rolls: inStockRolls.length,
          weight: inStockKg,
        },
        dispatched: {
          rolls: dispatchedRolls.length,
          weight: dispatchedKg,
        },
        rejection: {
          periodKg: periodRejectedKg,
          totalKg: totalRejectionKg,
          ratePercent: rejectionRate,
        },
        trendData,
        recentRolls,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
