// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock global objects needed for Next.js
global.Request = class Request {
  constructor(input, init) {
    this.url = input || '';
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
  }
};

global.Headers = class Headers {
  constructor(init) {
    this._headers = {};
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }
  get(name) { return this._headers[name.toLowerCase()] || null; }
  set(name, value) { this._headers[name.toLowerCase()] = value; }
  has(name) { return name.toLowerCase() in this._headers; }
};

// Mock NextResponse and NextRequest
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, options = {}) => ({
      status: options?.status || 200,
      body,
      cookies: {
        set: jest.fn(),
      },
      json: jest.fn().mockResolvedValue(body),
    })),
    next: jest.fn(),
    redirect: jest.fn(),
  },
  NextRequest: jest.fn().mockImplementation(() => ({
    json: jest.fn(),
    headers: {
      get: jest.fn(),
    },
    cookies: {
      getAll: jest.fn().mockReturnValue([]),
    },
  })),
}));

// Mock Supabase
jest.mock('@supabase/ssr', () => {
  const mockAuth = {
    getUser: jest.fn(),
  };
  
  const mockSupabase = {
    auth: mockAuth,
    from: jest.fn(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  };
  
  return {
    createServerClient: jest.fn().mockReturnValue(mockSupabase),
  };
});