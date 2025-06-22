"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const utils_1 = require("../utils/utils");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof utils_1.AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            status: 'error',
        });
    }
    console.error('Unexpected error:', err);
    return res.status(500).json({
        error: 'Internal server error',
        status: 'error',
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map