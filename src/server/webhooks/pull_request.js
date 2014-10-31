// models
var User = require('mongoose').model('User');

//services
var url = require('../services/url');
var github = require('../services/github');
var status = require('../services/status');
var milestone = require('../services/milestone');
var pullRequest = require('../services/pullRequest');
var notification = require('../services/notification');

//////////////////////////////////////////////////////////////////////////////////////////////
// Github Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function(req, res) {

    User.findOne({ _id: req.params.id }, function(err, user) {

        if(err || !user) {
            return res.end();
        }

        var args = {
            user: req.args.repository.owner.login,
            repo: req.args.repository.name,
            repo_uuid: req.args.repository.id,
            sha: req.args.pull_request.head.sha,
            number: req.args.number,
            token: user.token
        };

        var notification_args = {
            user: req.args.repository.owner.login,
            repo: req.args.repository.name,
            number: req.args.number,
            sender: req.args.sender,
            url: url.reviewPullRequest(req.args.repository.owner.login, req.args.repository.name, req.args.number)
        };

        var actions = {
            opened: function() {

                status.update(args);

                notification.sendmail(
                    'pull_request_opened',
                    req.args.repository.owner.login,
                    req.args.repository.name,
                    req.args.repository.id,
                    user.token,
                    req.args.number,
                    notification_args
                );

                pullRequest.badgeComment(
                    req.args.repository.owner.login,
                    req.args.repository.name,
                    req.args.repository.id,
                    req.args.number
                );
            },
            synchronize: function() {

                status.update(args);

                notification.sendmail(
                    'pull_request_synchronized',
                    req.args.repository.owner.login,
                    req.args.repository.name,
                    req.args.repository.id,
                    user.token,
                    req.args.number,
                    notification_args
                );

                var event = req.args.repository.owner.login + ':' +
                            req.args.repository.name + ':' +
                            'pull-request-' + req.args.number + ':synchronize';

                io.emit(event, req.args.pull_request.head.sha);
            },
            closed: function() {

                if(req.args.pull_request.merged) {
                    var event = req.args.repository.owner.login + ':' +
                                req.args.repository.name + ':' +
                                'pull-request-' + req.args.number + ':merged';

                    io.emit(event, req.args.number);
                }

                // close the milestone
                milestone.close({
                    user: req.args.repository.owner.login,
                    name: req.args.repository.name,
                    repo_uuid: req.args.repository.id,
                    number: req.args.number,
                    token: user.token
                });
            },
            reopened: function() {
                // a pull request you have reviewed has a been reopened
                // send messages to responsible users?
            }
        };

        if (actions[req.args.action]) {
            actions[req.args.action]();
        }

        res.end();
    });
};
