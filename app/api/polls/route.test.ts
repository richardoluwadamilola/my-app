import { POST } from './route';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

describe('POST /api/polls', () => {
  let mockRequest: jest.Mocked<NextRequest>;
  let mockSupabase: any;
  let pollInsertMock: any;
  let optionsInsertMock: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock NextRequest
    mockRequest = new NextRequest('http://localhost:3000/api/polls') as jest.Mocked<NextRequest>;
    mockRequest.json = jest.fn();
    mockRequest.headers.get = jest.fn();
    
    // Get the mocked Supabase client
    //mockSupabase = createServerClient();
  });
  
  it('should return 400 for invalid input', async () => {
    // Arrange
    const invalidPoll = { title: 'A' }; // Missing required fields
    mockRequest.json = jest.fn().mockResolvedValue(invalidPoll);
    
    // Act
    const response = await POST(mockRequest);
    
    // Assert
    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Invalid input');
    expect(responseBody.issues).toBeDefined();
  });
  
  it('should return 401 if user is not authenticated', async () => {
    // Arrange
    const validPoll = {
      title: 'Test Poll',
      description: 'This is a test poll description',
      options: ['Option 1', 'Option 2'],
      isMultiple: false,
      isPublic: true,
    };
    mockRequest.json = jest.fn().mockResolvedValue(validPoll);
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });
    
    // Act
    const response = await POST(mockRequest);
    
    // Assert
    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Auth error (Auth session missing!)');
  });
  
  it('should create a poll successfully', async () => {
    // Arrange
    const validPoll = {
      title: 'Test Poll',
      description: 'This is a test poll description',
      options: ['Option 1', 'Option 2'],
      isMultiple: false,
      isPublic: true,
    };
    const mockUser = { id: 'user-123' };
    const mockPoll = { id: 'poll-123', ...validPoll };
    
    mockRequest.json = jest.fn().mockResolvedValue(validPoll);
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Setup poll insertion mock chain
    const pollInsertMock = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockPoll, error: null })
    };
    
    // Setup options insertion mock
    const optionsInsertMock = {
      insert: jest.fn().mockResolvedValue({ error: null })
    };
    
    // Setup from mock to return different mocks based on table name
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'polls') return pollInsertMock;
      if (table === 'poll_options') return optionsInsertMock;
      return {};
    });
    
    // Act
    const response = await POST(mockRequest);
    
    // Assert
    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody.pollId).toBe(mockPoll.id);
    
    // Verify Supabase calls
    expect(mockSupabase.from).toHaveBeenCalledWith('polls');
    expect(mockSupabase.from).toHaveBeenCalledWith('poll_options');
    expect(pollInsertMock.insert).toHaveBeenCalledWith(expect.objectContaining({
      title: validPoll.title,
      description: validPoll.description,
      author_id: mockUser.id,
      is_multiple: validPoll.isMultiple,
      is_public: validPoll.isPublic,
    }));
  });
  
  it('should handle poll creation error', async () => {
    // Arrange
    const validPoll = {
      title: 'Test Poll',
      description: 'This is a test poll description',
      options: ['Option 1', 'Option 2'],
      isMultiple: false,
      isPublic: true,
    };
    const mockUser = { id: 'user-123' };
    
    mockRequest.json = jest.fn().mockResolvedValue(validPoll);
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Setup poll insertion mock chain with error
    const pollInsertMock = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
    };
    
    mockSupabase.from = jest.fn().mockReturnValue(pollInsertMock);
    
    // Act
    const response = await POST(mockRequest);
    
    // Assert
    expect(response.status).toBe(500);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Database error');
  });
  
  it('should handle option insertion error', async () => {
    // Arrange
    const validPoll = {
      title: 'Test Poll',
      description: 'This is a test poll description',
      options: ['Option 1', 'Option 2'],
      isMultiple: false,
      isPublic: true,
    };
    const mockUser = { id: 'user-123' };
    const mockPoll = { id: 'poll-123', ...validPoll };
    
    mockRequest.json = jest.fn().mockResolvedValue(validPoll);
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Setup poll insertion mock chain
    const pollInsertMock = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockPoll, error: null })
    };
    
    // Setup options insertion mock with error
    const optionsInsertMock = {
      insert: jest.fn().mockResolvedValue({ error: { message: 'Options error' } })
    };
    
    // Setup from mock to return different mocks based on table name
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'polls') return pollInsertMock;
      if (table === 'poll_options') return optionsInsertMock;
      return {};
    });
    
    // Act
    const response = await POST(mockRequest);
    
    // Assert
    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Options error');
  });
});