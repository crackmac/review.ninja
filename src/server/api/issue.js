// module
var url = require('../services/url');
var github = require('../services/github');
var milestone = require('../services/milestone');
var merge = require('merge');

module.exports = {

/************************************************************************************************************

    @github

    + issues.create

************************************************************************************************************/

    add: function(req, done) {
        if(!req.args.sha) {
            return done({
                code: 400,
                text: 'sha must be set'
            }, null);
        }
        if(!req.args.user) {
            return done({
                code: 400,
                text: 'user must be set'
            }, null);
        }
        if(!req.args.repo) {
            return done({
                code: 400,
                text: 'repo must be set'
            }, null);
        }
        if(!req.args.repo_uuid) {
            return done({
                code: 400,
                text: 'repo_uuid must be set'
            }, null);
        }
        if(!req.args.title) {
            return done({
                code: 400,
                text: 'title must be set'
            }, null);
        }
        if(!req.args.number) {
            return done({
                code: 400,
                text: 'number must be set'
            }, null);
        }

        var fileReference = '`none`';
        var ninjaReference = '[' + '#' + req.args.number + ']' + '(' + url.reviewPullRequest(req.args.user, req.args.repo, req.args.number) + ')';

        if(req.args.reference) {
            var referenceUrl = url.githubFileReference(req.args.user, req.args.repo, req.args.reference);
            // req.args.reference is 'sha/path/to/file#Lline_number this line trims the sha
            fileReference = '[' + req.args.reference.replace(req.args.sha + '/', '') + ']' + '(' + referenceUrl + ')';
        }

        var body = req.args.body + '\r\n\r\n';
        body += '|commit|file reference|ReviewNinja|\r\n';
        body += '|------|--------------|-----------|\r\n';
        body += '|' + req.args.sha + '|' + fileReference + '|' + ninjaReference + '|';

        var args = merge(req.args, {token: req.user.token});
        milestone.get(args, function(err, milestone) {
                if(err) {
                    return done(err);
                }

                github.call({
                    obj: 'issues',
                    fun: 'create',
                    arg: {
                        user: req.args.user,
                        repo: req.args.repo,
                        body: body,
                        title: req.args.title,
                        labels: ['review.ninja'],
                        milestone: milestone.number
                    },
                    token: req.user.token
                }, done);
            });
    }
};
