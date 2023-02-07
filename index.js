const core = require('@actions/core');
const github = require('@actions/github');
const request = require('request');
const { google } = require("googleapis");

const scopes = [
    "https://www.googleapis.com/auth/cloud-platform",
];

const serviceAccount = JSON.parse(core.getInput('serviceAccount'));
const projectNumber = core.getInput('projectNumber');
const appId = core.getInput('appId');

try {
    // Authenticate a JWT client with the service account.
    var jwtClient = googleJwtClient();

    // Use the JWT client to generate an access token.
    jwtClient.authorize(function (error, tokens) {
        if (error) {
            return core.setFailed(`Authentication failed: ${error.message}`);
        } else if (tokens.access_token === null) {
            core.setFailed('Provided service account does not have permission to generate access tokens');
        } else {
            // Get latest release
            getLatestRelease(tokens.access_token);
        }
    });

} catch (error) {
    core.setFailed(error.message);
}

function googleJwtClient() {
    return new google.auth.JWT(
        serviceAccount['client_email'],
        null,
        serviceAccount['private_key'],
        scopes
    );
}

function getLatestRelease(accessToken) {
    const url = `https://firebaseappdistribution.googleapis.com/v1/projects/${projectNumber}/apps/${appId}/releases?orderBy=createTime%20desc&pageSize=1`;

    const options = {
        url: url,
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    };

    request(options, (error, res, body) => {
        if (error) {
            return core.setFailed(`Something went wrong, make sure your service account has the "Firebase App Distribution Admin" role. ${error.message}`);
        };

        if (!error && res.statusCode === 200) {
            getLatestReleaseName(body);
        };
    });
}

function getLatestReleaseName(body) {
    const json = JSON.parse(body);
    const releaseName = json['releases'][0]['name'];
    console.log(`Current version: ${releaseName}`);
    core.setOutput('releaseName', releaseName);
}