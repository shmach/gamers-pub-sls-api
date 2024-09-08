import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '@libs/dynamoClient';
import { bodyParser } from '@utils/bodyParser';
import { response } from '@utils/response';
import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { randomUUID } from 'crypto';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
	try {
		const userId = event.requestContext.authorizer.jwt.claims.sub as string;

		if (!userId) {
			return response(401, 'Unauthorized');
		}

		const review = bodyParser(event.body);

		if (!review) {
			return response(400, 'Invalid review data');
		}

		const sk = `REVIEW#${randomUUID()}`;
		const command = new PutCommand({
			TableName: 'GamersPubTable',
			Item: {
				pk: `USER#${userId}`,
				sk,
				entity_type: 'review',
				review: { ...review },
				created_at: new Date().toISOString(),
			},
		});

		await dynamoClient.send(command);
		return response(201, { message: 'Review created successfully' });
	} catch (error) {
		console.log(error);
		return response(500, { error: 'Error creating review ' + error });
	}
}