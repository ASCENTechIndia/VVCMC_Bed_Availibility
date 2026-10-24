const { z } = require('zod');

const hospitalListQuerySchema = z.object({
  ulbid: z.coerce.number().int().positive().optional(),
});

const hospitalIdParamSchema = z.object({
  hospitalId: z.coerce.number().int().positive(),
  ulbId: z.coerce.number().int().positive().optional(),
});

const hospitalInsSchema = z.object({
  userId: z.union([z.string(), z.number()]).transform(String).optional().default(''),
  hospitalId: z.coerce.number().int().optional(),
  ulbId: z.coerce.number().int().positive().optional().default(),
  hospitalName: z.string().trim().min(1, 'Hospital name is required'),
  hospitalType: z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
  areaWard: z.string().trim().optional().default(''),
  pincode: z.union([z.string(), z.number()]).transform(String).optional().default(''),
  phone: z.union([z.string(), z.number()]).transform(String).optional().default(''),
  email: z.string().trim().optional().default(''),
  status: z.string().trim().optional().default('Y'),
  mode: z.coerce.number().int().optional().default(1),
  ipAddress: z.string().trim().optional().default(''),
  ipSource: z.string().trim().optional().default('RW'),
}).passthrough();

const bedCategoryInsSchema = z.object({
  userId: z.union([z.string(), z.number()]).transform(String).optional().default(''),
  bedCategoryId: z.coerce.number().int().optional(),
  ulbId: z.coerce.number().int().positive().optional(),
  bedCategoryName: z.string().trim().min(1, 'Bed category name is required'),
  status: z.string().trim().optional().default(''),
  mode: z.coerce.number().int().optional().default(),
  ipAddress: z.string().trim().optional().default(''),
  ipSource: z.string().trim().optional().default('RW'),
}).passthrough();

module.exports = {
  hospitalListQuerySchema,
  hospitalIdParamSchema,
  hospitalInsSchema,
  bedCategoryInsSchema,
};
