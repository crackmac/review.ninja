// models
var Milestone = require('mongoose').model('Milestone');

// modules
var github = require('../services/github');

module.exports = {

    get: function(args, done) {
        Milestone.findOne({
            pull: args.number,
            repo: args.repo_uuid
        }, function(err, milestone) {

            if(err) {
                return done(err);
            }

            // check if milestone still exists
            github.call({
                obj: 'issues',
                fun: 'getMilestone',
                arg: {
                    user: args.user,
                    repo: args.repo,
                    number: milestone ? milestone.number : null
                },
                token: args.token
            }, function(err) {
                if(!err) {
                    return done(err, milestone);
                }

                // create milestone if non-existant
                github.call({
                    obj: 'issues',
                    fun: 'createMilestone',
                    arg: {
                        user: args.user,
                        repo: args.repo,
                        title: 'Pull Request #' + args.number
                    },
                    token: args.token
                }, function(err, milestone) {
                    if(err) {
                        return done(err);
                    }

                    Milestone.findOneAndUpdate({
                        pull: args.number,
                        repo: args.repo_uuid
                    }, {
                        number: milestone.number
                    }, {
                        upsert: true
                    }, done);
                });
            });
        });
    },

    close: function(args) {
        Milestone.findOne({
            pull: args.number,
            repo: args.repo_uuid
        }, function(err, milestone) {
            if(!err && milestone) {
                github.call({
                    obj: 'issues',
                    fun: 'updateMilestone',
                    arg: {
                        user: args.user,
                        repo: args.repo,
                        number: milestone.number,
                        state: 'closed'
                    },
                    token: args.token
                });
            }
        });
    }
};
