import type { Room } from "@/lib/site-data";

type StayEstimateArgs = {
  room: Room;
  checkIn: string;
  checkOut: string;
};

type StayEstimate = {
  description: string;
  isValid: boolean;
  label: "nightly" | "monthly-prorated";
  nights: number;
  total: number | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getStayEstimate({ room, checkIn, checkOut }: StayEstimateArgs): StayEstimate {
  if (!checkIn || !checkOut) {
    return {
      description: "Pick a check-in and check-out date to preview the estimated total.",
      isValid: false,
      label: "nightly",
      nights: 0,
      total: null
    };
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || nights <= 0) {
    return {
      description: "Check-out must be after check-in.",
      isValid: false,
      label: "nightly",
      nights: 0,
      total: null
    };
  }

  if (nights >= 28) {
    const nightlyFromMonthly = room.priceMonth / 30;
    const total = Math.round(nightlyFromMonthly * nights);
    return {
      description: "Longer stays use a monthly rate converted into a prorated estimate.",
      isValid: true,
      label: "monthly-prorated",
      nights,
      total
    };
  }

  return {
    description: "Short stays use the room's nightly rate.",
    isValid: true,
    label: "nightly",
    nights,
    total: room.priceNight * nights
  };
}

export function formatEstimate(total: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(total);
}
