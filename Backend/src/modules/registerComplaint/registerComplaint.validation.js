const { z } = require('zod');

const complaintRegistrationSchema = z.object({
  userId: z.union([z.string().trim().min(1), z.number()]).transform(String),
  ulbId: z.coerce.number().int().positive(),
  wardId: z.coerce.number().int().positive(),
  toiletId: z.coerce.number().int().positive(),
  complaintTypeId: z.coerce.number().int().positive(),
  citizenMn: z.string().trim().min(1),
  mobileNo: z.coerce.number().int().positive(),
  unitNo: z.coerce.number().int().positive(),
  complaintStatus: z.string().trim().min(1),
  complntRemark: z.string().trim().min(1),
  unitImg1: z.string().nullable().optional(),
  unitImg2: z.string().nullable().optional(),
  unitImg3: z.string().nullable().optional(),
  unitImg4: z.string().nullable().optional(),
  unitImg5: z.string().nullable().optional(),
});

const assignComplaintSchema = z.object({
  userId: z.union([z.string(), z.number()])
    .transform(String),
  complaintId: z.coerce.number().int().positive(),
  supervisorId: z.union([z.string(), z.number()])
    .transform(String),
  wardNo: z.coerce.number().int().positive(),
  ulbId: z.coerce.number().int().positive(),
});

module.exports = {
  complaintRegistrationSchema,
  assignComplaintSchema,
};
