const { z } = require('zod');

const hospitalListQuerySchema = z.object({
  ulbid: z.coerce.number().int().positive().optional(),
});

const hospitalIdParamSchema = z.object({
  hospitalId: z.coerce.number().int().positive(),
  ulbId: z.coerce.number().int().positive().optional(),
});

module.exports = {
  hospitalListQuerySchema,
  hospitalIdParamSchema,
};
