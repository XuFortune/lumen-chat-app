export interface SuccessResponse<T = unknown> {
    success: true,
    data: T,
    message?: string
}

export interface ErrorResponse {
    success: false,
    error: {
        code: string,
        message: string,
        details?: any
    }
}


// 成功响应
export const success = <T>(data: T, message?: string): SuccessResponse<T> => ({
    success: true,
    data,
    message,
});


// 失败响应
export const failure = (
    message: string,
    code: string = 'UNKNOWN_ERROR',
    details?: any
): ErrorResponse => ({
    success: false,
    error: {
        code,
        message,
        details,
    },
});