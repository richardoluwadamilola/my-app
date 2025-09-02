// Mock implementation for next-test-api-route-handler
module.exports = {
  createMocks: jest.fn().mockImplementation(() => ({
    req: {
      headers: {
        get: jest.fn(),
      },
      cookies: {
        getAll: jest.fn().mockReturnValue([]),
      },
      json: jest.fn(),
    },
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      cookies: {
        set: jest.fn(),
      },
    },
  })),
};