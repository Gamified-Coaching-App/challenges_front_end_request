const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Extract user_id from the query parameters
    const { user_id } = event.queryStringParameters;
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    try {
        // Fetch challenges for the user that are either current or completed and start before today
        const challengeParams = {
            TableName: "challenges",
            FilterExpression: "user_id = :user_id AND (status = :current OR status = :completed) AND start_date <= :today",
            ExpressionAttributeValues: {
                ":user_id": user_id,
                ":current": "current",
                ":completed": "completed",
                ":today": today
            }
        };
        
        const challengeData = await documentClient.scan(challengeParams).promise();
        
        // Fetch descriptions for each challenge based on template_id
        for (let challenge of challengeData.Items) {
            const templateParams = {
                TableName: "challenge_template",
                Key: {
                    "template_id": challenge.template_id
                }
            };
            
            const templateData = await documentClient.get(templateParams).promise();
            challenge.description = templateData.Item ? templateData.Item.description : "Description not found";
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(challengeData.Items)
        };
    } catch (error) {
        console.error("Error fetching challenges:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch challenges due to an internal error." })
        };
    }
};
