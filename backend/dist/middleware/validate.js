"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Middleware to validate request body, query, or params using Zod schemas
 */
const validate = (schemas) => {
    return (req, res, next) => {
        try {
            // Validate body
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            // Validate query
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            // Validate params
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    error: 'Validation error',
                    details: error.errors.map((err) => ({
                        path: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            next(error);
        }
    };
};
exports.validate = validate;
