import aws from 'aws-sdk';

const { DynamoDB } = aws;
const documentClient = new DynamoDB.DocumentClient();

export async function handler(event) {

    const token = event.headers.Authorization || event.headers.authorization; // Assuming the token is in the format "Bearer <token>"
    // console.log(token);
    const decoded = jwt.decode(token);
    // console.log(decoded);
    const user_id = decoded.sub;
    console.log("Decoded JWT user ID:", user_id);

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
