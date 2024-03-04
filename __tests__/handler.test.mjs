import { handler } from '../index.mjs'; // Adjust this import path
import aws from 'aws-sdk';
import jwt from 'jsonwebtoken';

// Mock aws-sdk directly within jest.mock()
jest.mock('aws-sdk', () => {
    return {
      DynamoDB: {
        DocumentClient: jest.fn().mockReturnValue({
          scan: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({ Items: [{ description: 'd' }] }),
          }),
          get: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({ Item: { description: 'd' } }),
          }),
        }),
      },
    };
  });
  
// Mock jsonwebtoken directly within jest.mock()
jest.mock('jsonwebtoken', () => ({
decode: jest.fn().mockReturnValue({ sub: 'user123' }) // Mocked decoded token value
}));
  
describe('handler function', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });
    it('returns 400 if no headers are provided', async () => {
        const event = {}; // Empty event, no headers
        const response = await handler(event);
        expect(response).toEqual({
          statusCode: 400,
          body: JSON.stringify({ error: "No headers provided in the request." })
        });
      });
    it('successfully fetches challenges', async () => {
      // Setup the event 
      const event = {
        headers: {
          Authorization: 'Bearer mocktoken123',
        },
      };
  
      // Call the handler function
      const response = await handler(event);
  
      // Assertions based on the expected outcomes
      expect(response.statusCode).toEqual(200);
    });
});  