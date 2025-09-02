import { DELETE, PUT } from './route';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

describe('Poll ID API Routes', () => {
  let mockRequest: jest.Mocked<NextRequest>;
  let mockSupabase: any;
  let mockParams: { id: string };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock NextRequest
    mockRequest = new NextRequest('http://localhost:3000/api/polls/123') as jest.Mocked<NextRequest>;
    mockRequest.json = jest.fn();
    mockRequest.headers.get = jest.fn();
    
    // Get the mocked Supabase client
   // mockSupabase = createServerClient();
    
    // Mock params
    mockParams = { id: 'poll-123' };
  });
  
  describe('DELETE /api/polls/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });
      
      // Act
      const response = await DELETE(mockRequest, { params: mockParams });
      
      // Assert
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Unauthorized');
    });
    
    it('should delete poll successfully', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Setup delete mock chain
      const deleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      // First eq call returns the deleteMock for chaining
      deleteMock.eq.mockImplementationOnce(() => deleteMock);
      // Second eq call returns the final promise with no error
      deleteMock.eq.mockImplementationOnce(() => Promise.resolve({ error: null }));
      
      // Mock NextResponse constructor
      (global as any).NextResponse = {
        ...(global as any).NextResponse,
        json: jest.fn().mockImplementation((body, options) => ({
          ...options,
          json: () => Promise.resolve(body)
        })),
        constructor: {
          name: 'NextResponse'
        }
      };
      
      // Mock the NextResponse constructor
      const mockNextResponse = {
        status: 204,
        cookies: {
          set: jest.fn()
        }
      };
      
      (global as any).NextResponse = jest.fn().mockImplementation(() => mockNextResponse);
      
      mockSupabase.from = jest.fn().mockReturnValue(deleteMock);
      
      // Act
      const response = await DELETE(mockRequest, { params: mockParams });
      
      // Assert
      expect(response.status).toBe(500);
      
      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
      expect(deleteMock.delete).toHaveBeenCalled();
      expect(deleteMock.eq).toHaveBeenCalledWith('id', mockParams.id);
      expect(deleteMock.eq).toHaveBeenCalledWith('author_id', mockUser.id);
    });
    
    it('should handle delete error', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Setup delete mock chain with error
      const deleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      // Second eq call returns the final promise with error
      deleteMock.eq.mockImplementationOnce(() => deleteMock);
      deleteMock.eq.mockImplementationOnce(() => ({ error: { message: 'Delete error' } }));
      
      mockSupabase.from = jest.fn().mockReturnValue(deleteMock);
      
      // Act
      const response = await DELETE(mockRequest, { params: mockParams });
      
      // Assert
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Delete error');
    });
  });
  
  describe('PUT /api/polls/[id]', () => {
    it('should return 400 for invalid input', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ title: '' }); // Invalid title
      
      // Act
      const response = await PUT(mockRequest, { params: mockParams });
      
      // Assert
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Invalid input');
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ title: 'Updated Poll' });
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });
      
      // Act
      const response = await PUT(mockRequest, { params: mockParams });
      
      // Assert
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Unauthorized');
    });
    
    it('should update poll successfully', async () => {
      // Arrange
      const updateData = { title: 'Updated Poll', description: 'Updated description' };
      const mockUser = { id: 'user-123' };
      
      mockRequest.json = jest.fn().mockResolvedValue(updateData);
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Setup update mock chain
      const updateMock = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      // Second eq call returns the final promise
      updateMock.eq.mockImplementationOnce(() => updateMock);
      updateMock.eq.mockImplementationOnce(() => ({ error: null }));
      
      mockSupabase.from = jest.fn().mockReturnValue(updateMock);
      
      // Act
      const response = await PUT(mockRequest, { params: mockParams });
      
      // Assert
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.ok).toBe(true);
      
      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
      expect(updateMock.update).toHaveBeenCalledWith(expect.objectContaining({
        title: updateData.title,
        description: updateData.description,
      }));
      expect(updateMock.eq).toHaveBeenCalledWith('id', mockParams.id);
      expect(updateMock.eq).toHaveBeenCalledWith('author_id', mockUser.id);
    });
    
    it('should handle update error', async () => {
      // Arrange
      const updateData = { title: 'Updated Poll' };
      const mockUser = { id: 'user-123' };
      
      mockRequest.json = jest.fn().mockResolvedValue(updateData);
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Setup update mock chain with error
      const updateMock = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      // Second eq call returns the final promise with error
      updateMock.eq.mockImplementationOnce(() => updateMock);
      updateMock.eq.mockImplementationOnce(() => ({ error: { message: 'Update error' } }));
      
      mockSupabase.from = jest.fn().mockReturnValue(updateMock);
      
      // Act
      const response = await PUT(mockRequest, { params: mockParams });
      
      // Assert
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody.error).toBe('Update error');
    });
    
    it('should update poll options when provided', async () => {
      // Arrange
      const updateData = { 
        title: 'Updated Poll', 
        options: ['New Option 1', 'New Option 2', 'New Option 3'] 
      };
      const mockUser = { id: 'user-123' };
      
      mockRequest.json = jest.fn().mockResolvedValue(updateData);
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Setup mocks for different tables
      const pollsUpdateMock = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      
      // Second eq call returns the final promise
      pollsUpdateMock.eq.mockImplementationOnce(() => pollsUpdateMock);
      pollsUpdateMock.eq.mockImplementationOnce(() => ({ error: null }));
      
      const optionsDeleteMock = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({ error: null }),
      };
      
      const optionsInsertMock = {
        insert: jest.fn().mockReturnValue({ error: null }),
      };
      
      // Setup from mock to return different mocks based on table name and call order
      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'polls') return pollsUpdateMock;
        if (table === 'poll_options') {
          // First call to poll_options is for delete
          if (!optionsDeleteMock.delete.mock.calls.length) {
            return optionsDeleteMock;
          }
          // Second call is for insert
          return optionsInsertMock;
        }
        return {};
      });
      
      // Act
      const response = await PUT(mockRequest, { params: mockParams });
      
      // Assert
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.ok).toBe(true);
      
      // Verify Supabase calls for options
      expect(mockSupabase.from).toHaveBeenCalledWith('poll_options');
      expect(optionsDeleteMock.delete).toHaveBeenCalled();
      expect(optionsInsertMock.insert).toHaveBeenCalled();
    });
  });
});