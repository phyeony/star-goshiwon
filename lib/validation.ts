import { z } from "zod";

export const bookingRequestSchema = z
  .object({
    guest_name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    guest_email: z.string().email("Please enter a valid email address"),
    guest_count: z
      .number()
      .int()
      .min(1, "At least 1 guest required")
      .max(1, "Single occupancy rooms only"),
    room_slug: z.string().min(1, "Please select a room"),
    check_in_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
      message: "Invalid check-in date",
    }),
    check_out_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
      message: "Invalid check-out date",
    }),
    notes: z.string().max(1000, "Notes are too long").default(""),
    bedding_prepaid: z.boolean().default(false),
    policies_accepted: z.literal(true, {
      errorMap: () => ({
        message: "Please review and accept the booking policies to continue",
      }),
    }),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.check_in_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return checkIn >= today;
    },
    { message: "Check-in date must be today or later", path: ["check_in_date"] }
  )
  .refine(
    (data) => {
      const checkIn = new Date(data.check_in_date);
      const checkOut = new Date(data.check_out_date);
      return checkOut > checkIn;
    },
    {
      message: "Check-out date must be after check-in date",
      path: ["check_out_date"],
    }
  )
  .refine(
    (data) => {
      const checkIn = new Date(data.check_in_date);
      const checkOut = new Date(data.check_out_date);
      const days = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days >= 7;
    },
    {
      message: "Minimum stay is 7 days",
      path: ["check_out_date"],
    }
  );

export type BookingFormData = z.infer<typeof bookingRequestSchema>;

export const roomSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(2000).default(""),
  price_monthly: z.number().int().min(0),
  price_weekly: z.number().int().min(0),
  price_daily: z.number().int().min(0),
  capacity: z.number().int().min(1).max(10),
  size_sqm: z.number().min(0).nullable().default(null),
  amenities: z.array(z.string()).default([]),
  status: z.enum(["available", "available_soon", "limited", "unavailable"]),
  available_from: z.string().nullable().default(null),
  featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export type RoomFormData = z.infer<typeof roomSchema>;
