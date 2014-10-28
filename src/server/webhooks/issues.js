// models
var User = require('mongoose').model('User');

//services
var url = require('../services/url');
var github = require('../services/github');
var status = require('../services/status');
var pullRequest = require('../services/pullRequest');
var notification = require('../services/notification');

//////////////////////////////////////////////////////////////////////////////////////////////
// Github Issue Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function(req, res) {

    //
    // Helper functions
    //

    function getPull(user, repo, number, token, done) {
        github.call({
            obj: 'pullRequests',
            fun: 'get',
            arg: {
                user: user,
                repo: repo,
                number: number
            }
        }, done);
    }

    function getIssues(user, repo, number, token, done) {
        github.call({
            obj: 'issues',
            fun: 'repoIssues',
            arg: {
                user: user,
                repo: repo,
                labels: 'pull-request-' + number,
                state: 'open'
            },
            token: token
        }, done);
    }

    User.findOne({ _id: req.params.id }, function(err, user) {

        var number = pullRequest.byLabels(req.args.issue.labels);

        if(err || !user || !number) {
            return res.end();
        }

        var args = {
            user: req.args.repository.owner.login,
            repo: req.args.repository.name,
            issue: req.args.issue.id,
            sender: req.args.sender,
            number: number,
            url: url.reviewPullRequest(req.args.repository.owner.login, req.args.repository.name, number)
        };

        var actions = {
            opened: function() {
                getPull(req.args.repository.owner.login, req.args.repository.name, number, user.token, function(err, pull) {
                    if(!err) {
                        status.update({
                            user: req.args.repository.owner.login,
                            repo: req.args.repository.name,
                            repo_uuid: req.args.repository.id,
                            sha: pull.head.sha,
                            number: pull.number,
                            token: user.token
                        });

                        notification.sendmail(
                            'new_issue',
                            req.args.repository.owner.login,
                            req.args.repository.name,
                            req.args.repository.id,
                            user.token,
                            number,
                            args
                        );
                    }
                });
            },

            closed: function() {
                getIssues(req.args.repository.owner.login, req.args.repository.name, number, user.token, function(err, issues) {
                    if(!err && !issues.length) {
                        getPull(req.args.repository.owner.login, req.args.repository.name, number, user.token, function(err, pull) {
                            if(!err) {
                                status.update({
                                    user: req.args.repository.owner.login,
                                    repo: req.args.repository.name,
                                    repo_uuid: req.args.repository.id,
                                    sha: pull.head.sha,
                                    number: pull.number,
                                    token: user.token
                                });

                                notification.sendmail(
                                    'closed_issue',
                                    req.args.repository.owner.login,
                                    req.args.repository.name,
                                    req.args.repository.id,
                                    user.token,
                                    number,
                                    args
                                );
                            }
                        });
                    }
                });
            },

            reopened: function() {
                var pullId = pullRequest.byLabels(req.args.issue.labels);
                if(pullId) {
                    getPull(req.args.repository.owner.login, req.args.repository.name, pullId, user.token, function(err, pullRequest) {
                        if(!err) {
                            console.log(pullRequest);
                            status.update({
                                user: req.args.repository.owner.login,
                                repo: req.args.repository.name,
                                repo_uuid: req.args.repository.id,
                                sha: pullRequest.head.sha,
                                number: pullRequest.number,
                                token: user.token
                            });
                            console.log(pullRequest);
                            notification.sendmail('reopened_issue', req.args.repository.owner.login, req.args.repository.name, req.args.repository.id, user.token, pull_request_number, args);
                        }
                    });
                }
            }
        };

        if(actions[req.args.action]) {
            actions[req.args.action]();
        }

        res.end();
    });
};
