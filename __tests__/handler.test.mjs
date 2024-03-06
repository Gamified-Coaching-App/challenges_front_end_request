import { handler } from '../index.mjs'; // Adjust this import path
import aws from 'aws-sdk';
import jwt from 'jsonwebtoken';

// Mock aws-sdk directly within jest.mock()
jest.mock('aws-sdk', () => {
  // The scan method is mocked to return a list of challenges. This simulates fetching challenges from a DynamoDB table
  const mockScan = jest.fn().mockImplementation(() => ({
      promise: () => Promise.resolve({
          Items: [
              { user_id: 'user123', challenge_id: 'challenge1', template_id: 'template1', status: 'current' },
              { user_id: 'user123', challenge_id: 'challenge2', template_id: 'template2', status: 'completed' }
          ]
      })
  }));
  // The get method is mocked to return an item based on template_id. This simulates fetching challenge descriptions from another DynamoDB table
  const mockGet = jest.fn().mockImplementation((params) => {
      const descriptions = {
          'template1': { description: 'Template 1 Description' },
          'template2': { description: 'Template 2 Description' }
      };
      return {
          promise: () => Promise.resolve({ Item: descriptions[params.Key.template_id] })
      };
  });
  return {
      DynamoDB: {
          DocumentClient: jest.fn(() => ({
              scan: mockScan,
              get: mockGet
          }))
      }
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

    it('successfully fetches challenges with descriptions', async () => {
      const event = {
        headers: {
          Authorization: 'Bearer mocktoken123',
        },
      };
  
      const response = await handler(event);
  
      // Assertions based on the expected outcomes
      expect(response.statusCode).toEqual(200);
      const body = JSON.parse(response.body);
      // Verify that the response body contains the expected data
      expect(body).toEqual(expect.arrayContaining([
        expect.objectContaining({ description: 'Template 1 Description' }),
        expect.objectContaining({ description: 'Template 2 Description' })
      ]));  
    });
    
});
