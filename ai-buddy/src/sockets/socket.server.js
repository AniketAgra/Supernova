const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const agent = require('../agent/agent');

function getAgentErrorMessage(error) {
    const status = error?.status;
    const message = String(error?.message || '');

    if (status === 429 || message.includes('quota') || message.includes('Too Many Requests')) {
        return 'The AI service is temporarily out of quota. Please try again later.';
    }

    return 'Failed to process message';
}

async function initSocketServer(httpServer) {

    const io = new Server(httpServer)

    io.use((socket, next) => {

        console.log('[socket] handshake attempt', socket.id)

        const cookies = socket.handshake.headers?.cookie;

        console.log('[socket] cookie header present:', Boolean(cookies))

        const { token } = cookies ? cookie.parse(cookies) : {};

        console.log('[socket] token present:', Boolean(token))

        if (!token) {
            return next(new Error('Token not provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.user = decoded;
            socket.token = token;

            next()

        } catch (err) {
            next(new Error('Invalid token'));
        }

    })

    io.on('connection', (socket) => {

        console.log('[socket] connected', socket.id, socket.user)

        socket.on('disconnect', (reason) => {
            console.log('[socket] disconnected', socket.id, reason)
        })

        socket.on('message', async (data) => {

            console.log('[socket] message received', {
                socketId: socket.id,
                data,
            })

            try {
                console.log('[socket] sending message to agent')

                const agentResponse = await agent.invoke({
                    messages: [
                        {
                            role: "user",
                            content: data
                        }
                    ]
                }, {
                    metadata: {
                        token: socket.token
                    }
                })

                console.log('[socket] agent response received', agentResponse)

                const lastMessage = agentResponse.messages[ agentResponse.messages.length - 1 ]

                console.log('[socket] emitting message to client', lastMessage?.content)

                socket.emit('message', lastMessage.content)
            } catch (error) {
                console.error('[socket] message handling failed', error)

                const friendlyMessage = getAgentErrorMessage(error)

                socket.emit('message', friendlyMessage)
                socket.emit('message:error', friendlyMessage)
            }

        })

    })

}


module.exports = { initSocketServer };