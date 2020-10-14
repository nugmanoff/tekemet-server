const Hapi = require('@hapi/hapi')

const { startStreaming, makeResponseSink, removeResponseSink } = require('./queue');

startStreaming();

const init = async () => {
    
    const server = new Hapi.server({port: ~~process.env.PORT || 5000, host: '0.0.0.0'})
    server.route({
        method: 'GET',
        path: '/stream',
        handler: (req, h) => {
            const { id, responseSink } = makeResponseSink();
            req.app.sinkId = id;
            return h.response(responseSink).type('audio/mpeg');
        },
        options: {
            ext: {
                onPreResponse: {
                    method: (request, h) => {
                        request.events.once('disconnect', () => {
                            removeResponseSink(request.app.sinkId);
                        });
                        return h.continue;
                    }
                }
            }
        }
    })
    await server.start();
    console.log('Server running on %s', server.info.uri);
}

process.on('unhandledRejection', (err) => {
    process.exit(1);
});

init();