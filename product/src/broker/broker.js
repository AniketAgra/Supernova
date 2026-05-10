const amqplib = require('amqplib');


let channel, connection;

async function connect() {

    if(connection)return connection;

    try {
        connection = await amqplib.connect(process.env.RABBIT_URL);
        console.log('Connected to RabbitMQ');
        channel = await connection.createChannel();
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }
}

async function publishToQueue(queueName, data ={}) {
    try {

        if(!channel || !connection) await connect();   // Ensure the queue exists before sending messages
        await channel.assertQueue(queueName, { durable: true });    // Assert the queue (create if it doesn't exist)
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));       // Send the message to the queue
        console.log(`Message sent to queue ${queueName}:`, data);
    } catch (error) {
        console.error('Error publishing to queue:', error);
    }
}

// Subscribe to a queue and process incoming messages - when a message is received, the provided callback function is called with the message data
async function subscribeToQueue(queueName, callback) {
    try {
        if(!channel || !connection) await connect();   // Ensure the queue exists before sending messages
        await channel.assertQueue(queueName, { durable: true });    // Assert the queue (create if it doesn't exist)
        channel.consume(queueName, async (message) => {
            if (message !== null) {
                const data = JSON.parse(message.content.toString());
                await callback(data);
                channel.ack(message); // Acknowledge the message after processing
            }
        });
        console.log(`Subscribed to queue ${queueName}`);
    } catch (error) {
        console.error('Error subscribing to queue:', error);
    }
}

module.exports = { 
    connect, 
    publishToQueue,
    subscribeToQueue,
    channel,
    connection
};