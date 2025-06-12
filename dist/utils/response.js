"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data, statusCode = 200) {
        res.status(statusCode).json({
            success: true,
            data
        });
    }
    static error(res, message, statusCode = 500) {
        res.status(statusCode).json({
            success: false,
            error: message
        });
    }
}
exports.ApiResponse = ApiResponse;
