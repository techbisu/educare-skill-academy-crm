import { NextResponse } from 'next/server';

export type ApiResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: Record<string, any>;
};

export function ok<T>(data: T, message = 'Success', meta?: Record<string, any>) {
  return NextResponse.json({ success: true, message, data, meta } satisfies ApiResponse<T>);
}

export function fail(message = 'Failed', status = 400, errors?: Record<string, string[]>) {
  return NextResponse.json({ success: false, message, errors } satisfies ApiResponse<never>, { status });
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ success: false, message } satisfies ApiResponse<never>, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ success: false, message } satisfies ApiResponse<never>, { status: 403 });
}

export function notFound(message = 'Not Found') {
  return NextResponse.json({ success: false, message } satisfies ApiResponse<never>, { status: 404 });
}

export function serverError(message = 'Internal Server Error') {
  return NextResponse.json({ success: false, message } satisfies ApiResponse<never>, { status: 500 });
}

// Wrap an async handler with consistent error handling
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(handler: T): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (e: any) {
      console.error('API Error:', e);
      if (e?.message === 'Unauthorized') return unauthorized();
      if (e?.message === 'Forbidden') return forbidden();
      return serverError(e?.message || 'Internal Server Error');
    }
  }) as T;
}

// Standard pagination params parser
export function parsePagination(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10)));
  const search = url.searchParams.get('search') ?? '';
  const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
  const sortDir = (url.searchParams.get('sortDir') ?? 'desc') === 'asc' ? 'asc' : 'desc';
  return { page, pageSize, search, sortBy, sortDir, skip: (page - 1) * pageSize, take: pageSize };
}

export function parseFilters(req: Request, allowedKeys: string[]) {
  const url = new URL(req.url);
  const filters: Record<string, string> = {};
  for (const key of allowedKeys) {
    const v = url.searchParams.get(key);
    if (v) filters[key] = v;
  }
  return filters;
}
