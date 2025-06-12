export class ApiResponse {
  static success(res: any, data: any, statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      data
    });
  }

  static error(res: any, message: string, statusCode = 500) {
    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
}

