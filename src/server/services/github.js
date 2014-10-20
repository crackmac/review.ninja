var GitHubApi = require('github');
var Keenio = require('./keenlogger');

var keenio = new Keenio();

module.exports = {

    call: function(call, done) {

        var obj = call.obj;
        var fun = call.fun;
        var arg = call.arg || {};
        var token = call.token;
        var basicAuth = call.basicAuth;

        var github = new GitHubApi({
            protocol: config.server.github.protocol,
            version: config.server.github.version,
            host: config.server.github.api,
            pathPrefix: config.server.github.enterprise ? '/api/v3' : null
        });

        if(!obj || !github[obj]) {
            return done('obj required/obj not found');
        }

        if(!fun || !github[obj][fun]) {
            return done('fun required/fun not found');
        }

        if(token) {
            github.authenticate({
                type: 'oauth',
                token: token
            });
        }

        if(basicAuth) {
            github.authenticate({
                type: "basic",
                username: basicAuth.user,
                password: basicAuth.pass
            });
        }

        github[obj][fun](arg, function(err, res) {
            keenio.logevent(obj, fun, err, res);

            var meta = null;

            try {
                meta = res.meta;
                meta.hasMore = !!github.hasNextPage(res.meta.link);
                delete res.meta;
            } catch (ex) {
                meta = null;
            }

            if(typeof done === 'function') {
                done(err, res, meta);
            }

        });

    }

};
