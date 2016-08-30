var express = require('express');
var router = express.Router();

var https = require('https');
var util = require('util');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


var initURLOptions;

function getError(msg, status, stack) {
    return {
        message: msg,
        error: {
            status: status,
            stack: stack
        }
    };
}

/* GET home page. */
router.get('/', function(req, res, next) {

    res.render('index', { title: 'API' });
});

/* Step1. Input login form */
router.get('/step1', function(req, res) {

    initURLOptions = function (auth, path) {
        return {
            host: req.app.get('PORTAL_HOST'),
            port: 443,
            headers: {
                'X-IBM-APIManagement-Context': req.app.get('PORTAL_CONTEXT'),
            },
            auth: auth,
            path: path
        };
    }

    res.render('step1');
});

/* Step2. Retrieve user dev orgs */
router.post('/step2', function(req, res) {

    var user = req.body.user;
    var pass = req.body.pass;
    var auth = user + ':' + pass;
    req.session.auth = auth;
    var path = '/v1/portal/orgs';
    var options = initURLOptions(auth, path);

    https.get(options, function(response) {
        if (response.statusCode !== 200) {
            res.render('error', getError('Error', 'Login failed; unable to list orgs', null));
        }

        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var parsed = JSON.parse(body);
            console.error (response.statusCode);
            if (util.isArray(parsed)) {
                res.render('step2', { orgs: parsed });
            }
        });
    });
});

/* Step 3. List apps and plans for selection */
router.post('/step3', function(req, res) {
    var auth = req.session.auth;
    var orgid = req.body.orgid;
    req.session.orgid = orgid;
    var path = '/v1/portal/orgs/' + orgid + '/apps';
    var options = initURLOptions(auth, path);

    var apps;
    var plans;
    https.get(options, function(response) {
        if (response.statusCode !== 200) {
            res.render('error', getError('Error', 'Unable to list "applications"', null));
        }

        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            apps = JSON.parse(body);
            options.path = '/v1/portal/orgs/' + orgid + '/plans';
            https.get(options, function(response) {

                if (response.statusCode !== 200) {
                    res.render('error', getError('Error', 'Unable to list "plans"', null));
                }

                var body = '';
                response.on('data', function(d) {
                    body += d;
                });
                response.on('end', function() {
                    var plans = JSON.parse(body);
                    res.render('step3', { apps: apps, plans: plans });
                });
            });

        });
    });
});

router.post('/step4', function(req, res) {
    var auth = req.session.auth;
    var orgid = req.session.orgid;
    var appid = req.body.appid;
    var path = '/v1/portal/orgs/' + orgid + '/apps/' + appid + '/subscriptions';
    var options = initURLOptions(auth, path);
    options.method = 'POST';
    var postBody = { planURL: req.body.planurl };
    console.error (postBody);

    var callback = function(response) {
        response.on('data', function (body) {
            console.log('Body: ' + body);
        });
        response.on('end', function() {
            console.error ("status code = " + response.statusCode);
            if (response.statusCode !== 201) {
                res.render('error', getError('Error', 'Unable to subscribe an "application" with the "plan"', null));
            }
            res.render('step4', { });
        });
    };
    var req = https.request(options, callback);
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    // write data to request body
    req.write(JSON.stringify(postBody));
    req.end();

});

module.exports = router;
