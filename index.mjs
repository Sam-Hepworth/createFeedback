// Developed for Nodejs on Amazon Lambda

import * as fs from 'node:fs';
import https from 'https';

const htmlMain = fs.readFileSync('index.html', { encoding: 'utf8' });
const htmlSubmit = fs.readFileSync('submit.html', { encoding: 'utf8' });

export const handler = async (event) => {
    let body = await render(event);
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html',
        },
        body: body,
    };
    return response;
};

async function render(event) {
    let html = htmlMain;
    if (event.queryStringParameters) {
        let log = [];
        log.push('Summary: ' + event.queryStringParameters.Summary);
        log.push('Feedback: ' + event.queryStringParameters.Feedback);
        log.push('Email: ' + event.queryStringParameters.Email);
        log.push('Response: ' + await createFeedback(
            event.queryStringParameters.Summary,
            event.queryStringParameters.Feedback,
            event.queryStringParameters.Email,
        ));
        html = htmlSubmit.replace('{debug}', log.join('<br>'));
    }
    return html;
}

async function createFeedback(summary, feedback, email) {
    const data = JSON.stringify({
        event: 'createFeedback',
        summary: summary,
        feedback: feedback,
        email: email,
    });
    const options = {
        hostname: 'us1.powerscripts.anova.appfire.app',
        port: 443,
        path: '/rest/keplerrominfo/refapp/latest/webhooks/event/run',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-SIL-TOKEN': '{InsertSILTokenHere}',
            'Content-Length': data.length,
        },
    };
    let response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            res.setEncoding('utf8');
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            res.on('end', () => {
                resolve(responseBody);
            });
        });
        req.on('error', (err) => {
            reject(err);
        });
        req.write(data)
        req.end();
    });
    return response;
}
