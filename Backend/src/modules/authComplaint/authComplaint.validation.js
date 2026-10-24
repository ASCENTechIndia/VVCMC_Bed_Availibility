const { z } = require('zod');

const authComplaintSchema = z.object({
  userId: z.string().trim().min(1),
  applId: z.coerce.number().int().positive(),
  ulbId: z.coerce.number().int().positive(),
  mode: z.coerce.number().int().min(1),
  status: z.string().trim().min(1),
  remark: z.string().trim().min(1),
});

const complaintStatusSchema = z.object({
  userId: z.string().trim().min(1),
  mode: z.coerce.number().int().min(0),
  complaintId: z.coerce.number().int().positive(),
  superwiserId: z.string().optional(),
  superstatus: z.string().optional(),
  superremark: z.string().optional(),
  SIID: z.string().optional(),
  si_status: z.string().optional(),
  si_remrk: z.string().optional(),
  wardno: z.coerce.number().int().positive(),
  ulbid: z.coerce.number().int().positive(),
});

module.exports = {
  authComplaintSchema,
};

module.exports.complaintStatusSchema = complaintStatusSchema;