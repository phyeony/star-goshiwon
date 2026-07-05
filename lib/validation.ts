import { z } from "zod";

/** Minimum booking length in nights (1 week). Shared by the API validator and
 * the date-range picker so the calendar disables anything shorter. */
export const MIN_STAY_NIGHTS = 7;

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
    men_only_acknowledged: z.literal(true, {
      errorMap: () => ({
        message:
          "Please confirm you understand this goshiwon accepts male guests only",
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
      return days >= MIN_STAY_NIGHTS;
    },
    {
      message: `Minimum stay is ${MIN_STAY_NIGHTS} days`,
      path: ["check_out_date"],
    }
  );

export type BookingFormData = z.infer<typeof bookingRequestSchema>;

export const roomSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  name_ko: z.string().max(100).nullable().default(null),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(2000).default(""),
  nightly_rate_usd: z.number().min(0),
  long_stay_discount: z.number().min(0).max(1).default(0.4),
  capacity: z.number().int().min(1).max(10),
  size_sqm: z.number().min(0).nullable().default(null),
  amenities: z.array(z.string()).default([]),
  status: z.enum(["available", "available_soon", "limited", "unavailable"]),
  available_from: z.string().nullable().default(null),
  featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export type RoomFormData = z.infer<typeof roomSchema>;

export const roomUnitSchema = z.object({
  room_id: z.string().uuid("Room type is required"),
  name: z.string().trim().min(1, "Room name is required").max(100),
  status: z.enum(["active", "inactive", "maintenance"]).default("active"),
  notes: z.string().max(1000).default(""),
  sort_order: z.number().int().default(0),
});

export type RoomUnitFormData = z.infer<typeof roomUnitSchema>;

export const roomUnitBlockBaseSchema = z.object({
    room_unit_id: z.string().uuid("Physical room is required"),
    booking_request_id: z.string().uuid().nullable().optional(),
    source: z.enum(["direct", "external"]).default("external"),
    status: z.enum(["tentative", "confirmed", "cancelled"]).default("confirmed"),
    guest_name: z.string().trim().max(100).default(""),
    check_in_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
      message: "Invalid check-in date",
    }),
    check_out_date: z.string().refine((d) => !isNaN(Date.parse(d)), {
      message: "Invalid check-out date",
    }),
    notes: z.string().max(1000).default(""),
  });

export const roomUnitBlockSchema = roomUnitBlockBaseSchema
  .refine(
    (data) => new Date(data.check_out_date) > new Date(data.check_in_date),
    {
      message: "Check-out date must be after check-in date",
      path: ["check_out_date"],
    }
  );

export type RoomUnitBlockFormData = z.infer<typeof roomUnitBlockSchema>;

export const roomUnitBlockUpdateSchema = roomUnitBlockBaseSchema.partial();
