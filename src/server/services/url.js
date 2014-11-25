var url = require('url');

module.exports = function() {

    var localSocket = url.format({
        protocol: 'http',
        hostname: 'localhost',
        port: config.server.localport
    });

    var baseUrl = url.format({
        protocol: config.server.http.protocol,
        hostname: config.server.http.host,
        port: config.server.http.port
    });

    var githubBase = url.format({
        protocol: config.server.github.protocol,
        host: config.server.github.host
    });

    var githubApiBase = url.format({
        protocol: config.server.github.protocol,
        host: config.server.github.api
    });

    return {
        socket: localSocket,
        baseUrl: baseUrl,
        githubBase: githubBase,
        githubApiBase: githubApiBase,
        githubCallback: url.resolve(baseUrl, '/auth/github/callback'),
        githubAuthorization: url.resolve(githubBase, '/login/oauth/authorize'),
        githubToken: url.resolve(githubBase, '/login/oauth/access_token'),
        githubProfile: function() {
            return url.resolve(githubApiBase, config.server.github.enterprise ? '/api/v3/user' : '/user');
        },
        githubFileReference: function(user, repo, fileReference) {
            return url.resolve(githubBase, '/' + user + '/' + repo + '/blob/' + fileReference);
        },
        reviewPullRequest: function(user, repo, number) {
            return url.resolve(baseUrl, '/' + user + '/' + repo + '/pull/' + number);
        },
        pullRequestBadge: function(repo_uuid, number) {
            return url.resolve(baseUrl, '/' + repo_uuid + '/pull/' + number + '/badge');
        }
    };
}();
