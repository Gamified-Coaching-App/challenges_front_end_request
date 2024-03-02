import aws from 'aws-sdk';
import jwt from 'jsonwebtoken';

const documentClient = new aws.DynamoDB.DocumentClient();

export async function handler(event) {
    // Check for headers in the event
    if (!event.headers) {
        console.error("No headers found in the event.");
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "No headers provided in the request." })
        };
    }

    console.log("Header present in the event.");
    const token = event.headers.Authorization.split(' ')[1];
    console.log(token);
    // Extract token and decode it
    if (!token) {
        console.error("Authorization header is missing.");
        return {
            statusCode: 401,
            body: JSON.stringify({ error: "Authorization header is required." })
        };
    }

    const decoded = jwt.decode(token);
    console.log(decoded);
    const user_id = decoded.sub;
    console.log("Decoded JWT user ID:", user_id);

    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    try {
        // Fetch challenges for the user
        const challengeParams = {
            TableName: "challenges",
            FilterExpression: "user_id = :user_id AND (#status = :current OR #status = :completed)",
            // AND start_date <= :today
            ExpressionAttributeNames: {
                "#status": "status", // to ensure status is not treated as a keyword
            },
            ExpressionAttributeValues: {
                ":user_id": user_id,
                ":current": "current",
                ":completed": "completed",
                // ":today": today
            }
        };

        const challengeData = await documentClient.scan(challengeParams).promise();

        // Fetch descriptions for each challenge based on template_id
        for (let challenge of challengeData.Items) {
            const templateParams = {
                TableName: "challenges_template",
                Key: { "template_id": challenge.template_id }
            };

            const templateData = await documentClient.get(templateParams).promise();
            challenge.description = templateData.Item ? templateData.Item.description : "Description not found";
        }

        return {
            statusCode: 200,
            headers: get_headers(),
            body: JSON.stringify(challengeData.Items)
        };
    } catch (error) {
        console.error("Error fetching challenges:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch challenges due to an internal error." })
        };
    }
}

function get_headers() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "OPTIONS,GET"
    };
}