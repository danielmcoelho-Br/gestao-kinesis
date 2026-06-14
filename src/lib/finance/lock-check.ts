import { prisma } from "@/lib/prisma";

export async function isMonthLocked(month: number, year: number): Promise<boolean> {
  try {
    let checkYear = year;
    if (checkYear < 100) {
      checkYear = 2000 + checkYear;
    }
    const lock = await prisma.monthLock.findUnique({
      where: {
        month_year: { month, year: checkYear }
      }
    });
    return lock?.locked || false;
  } catch (error) {
    console.error(`[lock-check] Error checking lock for ${month}/${year}:`, error);
    return false;
  }
}

export async function isDateLocked(dateInput: Date | string): Promise<boolean> {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  return isMonthLocked(d.getMonth(), d.getFullYear());
}
