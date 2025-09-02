import { POST } from './route';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { describe } from 'node:test';

describe('POST /api/polls/[id]/vote', () => {
  let mockRequest: jest.Mocked<NextRequest>;
  let mockSupabase: any;
  let mockParams: { id: string };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock NextRequest
    mockRequest = new NextRequest('http://localhost:3000/api/polls/123/vote') as jest.Mocked<NextRequest>;
    mockRequest.json = jest.fn();
    mockRequest.headers.get = jest.fn();
    
    // Get the mocked Supabase client
    //mockSupabase = createServerClient();
    
    // Mock params
    mockParams = { id: 'poll-123' };
  });
  
  it('should return 400 for invalid input', async () => {
    // Arrange
    mockRequest.json = jest.fn().mockResolvedValue({ optionId: 'not-a-uuid' });
    
    // Act
    const response = await POST(mockRequest, { params: mockParams });
    
    // Assert
    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Invalid input');
  });
  
  it('should return 401 if user is not authenticated', async () => {
    // Arrange
    mockRequest.json = jest.fn().mockResolvedValue({ optionId: '123e4567-e89b-12d3-a456-426614174000' });
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });
    
    // Act
    const response = await POST(mockRequest, { params: mockParams });
    
    // Assert
    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Unauthorized');
  });
  
  it('should return 400 if option does not belong to poll', async () => {
    // Arrange
    const optionId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUser = { id: 'user-123' };
    
    mockRequest.json = jest.fn().mockResolvedValue({ optionId });
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Setup option check mock chain
    const optionCheckMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
    };
    
    // Setup eq to chain properly
    optionCheckMock.eq.mockImplementationOnce(() => optionCheckMock);
    
    mockSupabase.from = jest.fn().mockReturnValue(optionCheckMock);
    
    // Act
    const response = await POST(mockRequest, { params: mockParams });
    
    // Assert
    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Option does not belong to this poll');
    
    // Verify Supabase calls
    expect(mockSupabase.from).toHaveBeenCalledWith('poll_options');
    expect(optionCheckMock.select).toHaveBeenCalledWith('id, poll_id');
    expect(optionCheckMock.eq).toHaveBeenCalledWith('id', optionId);
    expect(optionCheckMock.eq).toHaveBeenCalledWith('poll_id', mockParams.id);
  });
  
  it('should create vote successfully', async () => {
    // Arrange
    const optionId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUser = { id: 'user-123' };
    
    mockRequest.json = jest.fn().mockResolvedValue({ optionId });
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Setup option check mock chain
    const optionCheckMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ 
        data: { id: optionId, poll_id: mockParams.id }, 
        error: null 
      })
    };
    
    // Setup eq to chain properly
    optionCheckMock.eq.mockImplementationOnce(() => optionCheckMock);
    
    // Setup vote insertion mock
    const voteInsertMock = {
      insert: jest.fn().mockResolvedValue({ error: null })
    };
    
    // Setup from mock to return different mocks based on table name
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'poll_options') return optionCheckMock;
      if (table === 'votes') return voteInsertMock;
      return {};
    });
    
    // Act
    const response = await POST(mockRequest, { params: mockParams });
    
    // Assert
    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody.ok).toBe(true);
    
    // Verify Supabase calls
    expect(mockSupabase.from).toHaveBeenCalledWith('votes');
    expect(voteInsertMock.insert).toHaveBeenCalledWith({
      poll_id: mockParams.id,
      option_id: optionId,
      user_id: mockUser.id
    });
  });
  
  it('should handle vote insertion error', async () => {
    // Arrange
    const optionId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUser = { id: 'user-123' };
    
    mockRequest.json = jest.fn().mockResolvedValue({ optionId });
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Setup option check mock chain
    const optionCheckMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ 
        data: { id: optionId, poll_id: mockParams.id }, 
        error: null 
      })
    };
    
    // Setup eq to chain properly
    optionCheckMock.eq.mockImplementationOnce(() => optionCheckMock);
    
    // Setup vote insertion mock with error
    const voteInsertMock = {
      insert: jest.fn().mockResolvedValue({ error: { message: 'Insert error', code: '23505' } }) // Unique constraint violation
    };
    
    // Setup from mock to return different mocks based on table name
    mockSupabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'poll_options') return optionCheckMock;
      if (table === 'votes') return voteInsertMock;
      return {};
    });
    
    // Act
    const response = await POST(mockRequest, { params: mockParams });
    
    // Assert
    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody.error).toBe('Insert error');
    expect(responseBody.code).toBe('23505');
  });
});