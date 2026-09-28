const HTTP = require('http');
const Server = HTTP.createServer((request, response) => {
    response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });

    response.write('<div style="text-align:center;margin-top: 20vh;width:100%">Congratulations, your website is created and running!</div>');
    response.end();
});

Server.listen(process.env.PORT, process.env.HOSTNAME || '');