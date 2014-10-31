// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.io = require('socket.io');
global.config = require('../../../config');

// documents
var User = require('../../../server/documents/user').User;

// webhooks
var pull_request = require('../../../server/webhooks/pull_request');

// services
var milestone = require('../../../server/services/milestone');

describe('pull_request:closed', function(done) {

    it('should exit silently if user not found', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../data/pull_request.closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, null);
        });

        pull_request(req, {
            end: function() {
                userStub.restore();
                done();
            }
        });
    });

    it('should emit "merged" to sockets', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../data/pull_request.closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {
                token: 'abcdefg'
            });
        });

        global.io = {emit: sinon.spy()};

        pull_request(req, {
            end: function() {
                assert(io.emit.called);
                assert(io.emit.calledWith('reviewninja:foo:pull-request-42:merged', 42));

                userStub.restore();
                done();
            }
        });
    });

    it('should close milestone', function(done) {
        var req = {
            params: {id: 123456},
            args: require('../data/pull_request.closed.json')
        };

        var userStub = sinon.stub(User, 'findOne', function(args, done) {
            assert.equal(args._id, 123456);
            done(null, {
                token: 'abcdefg'
            });
        });

        var milestoneStub = sinon.stub(milestone, 'close',
            function(args) {
                assert.equal(args.user, 'reviewninja');
                assert.equal(args.repo, 'foo');
                assert.equal(args.repo_uuid, 23588185);
                assert.equal(args.number, 42);
                assert.equal(args.token, 'abcdefg');
            });

        pull_request(req, {
            end: function() {
                userStub.restore();
                milestoneStub.restore();
                done();
            }
        });
    });
});
