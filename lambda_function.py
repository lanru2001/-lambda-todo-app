import json
import os
import uuid
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TODOS_TABLE'])

def lambda_handler(event, context):
    http_method = event['httpMethod']
    path = event['path']
    
    # For simplicity, we'll use a hardcoded user ID
    user_id = "user123"
    
    if http_method == 'GET' and path == '/todos':
        # Get all todos for user
        response = table.query(
            KeyConditionExpression='userId = :userId',
            ExpressionAttributeValues={
                ':userId': user_id
            }
        )
        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'])
        }
        
    elif http_method == 'POST' and path == '/todos':
        # Create new todo
        todo_data = json.loads(event['body'])
        todo_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        item = {
            'userId': user_id,
            'todoId': todo_id,
            'title': todo_data['title'],
            'completed': False,
            'createdAt': created_at
        }
        
        if 'description' in todo_data:
            item['description'] = todo_data['description']
            
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'body': json.dumps(item)
        }
        
    elif http_method == 'GET' and path.startswith('/todos/'):
        # Get single todo
        todo_id = event['pathParameters']['todoId']
        
        response = table.get_item(
            Key={
                'userId': user_id,
                'todoId': todo_id
            }
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Todo not found'})
            }
            
        return {
            'statusCode': 200,
            'body': json.dumps(response['Item'])
        }
        
    elif http_method == 'PUT' and path.startswith('/todos/'):
        # Update todo
        todo_id = event['pathParameters']['todoId']
        update_data = json.loads(event['body'])
        
        update_expression = []
        expression_attribute_values = {}
        
        if 'title' in update_data:
            update_expression.append('title = :title')
            expression_attribute_values[':title'] = update_data['title']
            
        if 'description' in update_data:
            update_expression.append('description = :description')
            expression_attribute_values[':description'] = update_data['description']
            
        if 'completed' in update_data:
            update_expression.append('completed = :completed')
            expression_attribute_values[':completed'] = update_data['completed']
            
        if not update_expression:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No valid fields to update'})
            }
            
        response = table.update_item(
            Key={
                'userId': user_id,
                'todoId': todo_id
            },
            UpdateExpression='SET ' + ', '.join(update_expression),
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues='ALL_NEW'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps(response['Attributes'])
        }
        
    elif http_method == 'DELETE' and path.startswith('/todos/'):
        # Delete todo
        todo_id = event['pathParameters']['todoId']
        
        table.delete_item(
            Key={
                'userId': user_id,
                'todoId': todo_id
            }
        )
        
        return {
            'statusCode': 204,
            'body': ''
        }
        
    else:
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }
