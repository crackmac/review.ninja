// *****************************************************
// Issue Detail Controller
//
// tmpl: issue/detail.html
// path: /:user/:repo/pull/:number/:issue
// resolve: open, closed
// *****************************************************

module.controller('IssueDetailCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$HUB', '$RPC', 'Issue', 'Comment', 'issue', 'socket',
    function($rootScope, $scope, $state, $stateParams, $HUB, $RPC, Issue, Comment, issue, socket) {

        // get the issue
        $scope.issue = Issue.parse(issue.value) && Issue.render(issue.value);

        // switch the comparison view
        $scope.compComm($scope.issue.sha, $scope.head);

        // set the issue sha
        $scope.$parent.$parent.sha = $scope.issue.sha;

        // get the comments
        $scope.comments = $HUB.call('issues', 'getComments', {
            user: $stateParams.user,
            repo: $stateParams.repo,
            number: $stateParams.issue
        }, function(err, comments) {
            if(!err) {
                comments.affix.forEach(function(comment) {
                    comment = Comment.render(comment);
                });
            }
        });

        //
        // actions
        //

        $scope.setState = function() {

            var state = $scope.issue.state === 'open' ? 'closed' : 'open';

            $scope.set = $HUB.call('issues', 'edit', {
                user: $stateParams.user,
                repo: $stateParams.repo,
                number: $scope.issue.number,
                state: state
            }, function(err, issue) {
                if(!err) {
                    $scope.$parent.$parent.state = issue.value.state;
                    $scope.issue = Issue.parse(issue.value) && Issue.render(issue.value);
                }
            });
        };

        $scope.addComment = function() {
            if($scope.comment) {
                $scope.commenting = $HUB.wrap('issues', 'createComment', {
                    user: $stateParams.user,
                    repo: $stateParams.repo,
                    number: $stateParams.issue,
                    body: $scope.comment
                }, function(err, comment) {
                    if(!err) {
                        $scope.comment = null;
                    }
                });
            }
        };

        //
        // Websockets
        //

        socket.on($stateParams.user + ':' + $stateParams.repo + ':' + 'issue_comment', function(args) {
            if($scope.issue.number === args.number && args.action === 'created') {
                $HUB.call('issues', 'getComment', {
                    user: $stateParams.user,
                    repo: $stateParams.repo,
                    id: args.id
                }, function(err, comment) {
                    if(!err) {
                        $scope.comments.value.push(Comment.render(comment.value));
                    }
                });
            }
        });
    }
]);
