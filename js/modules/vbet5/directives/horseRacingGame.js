/* global VBET5 */
/**
 * @ngdoc directive
 * @name vbet5.directive:virtualSportGame
 *
 * @description horse racing game
 *
 */
VBET5.directive('horseRacingGame', ['$rootScope', 'ConnectionService', 'GameInfo', 'Utils', 'forecastTricast', function ($rootScope, ConnectionService, GameInfo, Utils, forecastTricast) {
    'use strict';

    var DIALOG_TAG = "forecast-tricast-bet-popup";
    return {
        restrict: 'E',
        replace: false,
        templateUrl: 'templates/directive/horse-racing-game.html',
        scope: {
            gameId: '=',
            sportId: '=',
            competitionId: '=',
            regionId: '='
        },
        link: function ($scope) {

            var connectionService = new ConnectionService($scope);
            forecastTricast.init($scope);
            $scope.selectedTab = "winner";
            $scope.raceCardsReverce = false;
            $scope.raceCardsPredicate = 'price';
            $scope.isEventInBetSlip = GameInfo.isEventInBetSlip;
            $scope.racingData = {};

            function resetRacingData() {
                $scope.racingData.selectionStatusMap = {};
                $scope.racingData.selectedItems = [];
                $scope.racingData.selectedAnyCount = 0;
            }
            $scope.selectTab = function selectTab(tab) {
                if ($scope.selectedTab !== tab) {
                    $scope.selectedTab = tab;
                    $scope.racingData = {};
                    switch (tab) {
                        case 'forecast':
                            $scope.racingData.columns = ['1st', '2nd', 'ANY'];
                            resetRacingData();
                            break;
                        case 'tricast':
                            $scope.racingData.columns = ['1st', '2nd', '3rd', 'ANY'];
                            resetRacingData();
                            break;
                    }

                }
            };

            /**
             * @ngdoc method
             * @name raceCardsColumnClick
             * @methodOf vbet5.controller:classicViewCenterController
             * @description changes data that  used for ordering raceCards elements
             *
             * @param {String} orderItem orderItem string: value of predicate
             */
            $scope.raceCardsColumnClick = function raceCardsColumnClick(orderItem) {
                if (orderItem === 'price'
                    && $scope.openGame.info.race
                    && !$scope.openGame.info.race.raceStats[0].event.price) {
                    return;
                }
                if ($scope.raceCardsPredicate === orderItem) {
                    $scope.raceCardsReverce = !$scope.raceCardsReverce;
                } else {
                    $scope.raceCardsReverce = false;
                    $scope.raceCardsPredicate = orderItem;
                }
            };

            $scope.raceCardsOrder = function raceCardsOrder(state) {
                if ($scope.raceCardsPredicate === 'price' && !state.event.price) {
                    $scope.raceCardsPredicate = 'none';
                }
                switch ($scope.raceCardsPredicate) {
                    case 'cloth':
                        return state.runnerNum;
                    case 'price':
                        return parseFloat(state.event.price);
                    case 'odds':
                        return parseFloat(state.price);
                    case 'order':
                        return parseFloat(state.order);
                    case 'none':
                        return 0;
                }

                return -1;
            };

            $scope.bet = function bet(event, market, openGame, oddType) {
                oddType = oddType || 'odd';
                var game = Utils.clone(openGame);
                $rootScope.$broadcast('bet', {event: event, market: market, game: game, oddType: oddType});
            };

            $scope.getEventRowIndex = function getEventRowIndex(event) {
                for (var i= $scope.openGame.info.racesWithEvents.length; i--;) {
                    if ($scope.openGame.info.racesWithEvents[i].event.id === event.id) {
                        return i;
                    }
                }
            };

            $scope.getEvent = function getEvent(rowIndex) {
                return $scope.openGame.info.race.racesWithEvents[rowIndex].event;
            };

            $scope.getItemsCount = function getItems() {
                return $scope.openGame.info.race.racesWithEvents.length;
            };


            $scope.openBetPopup = function openBetPopup() {
                $scope.racingData.selectedItems.sort(function (item1, item2) {
                    return item1.col - item2.col;
                });
                $rootScope.broadcast('globalDialogs.addDialog', {
                    template: 'templates/popup/forecast-tricast-bet.html',
                    type: 'template',
                    tag: DIALOG_TAG,
                    state: {
                        sportId: $scope.sportId,
                        selectedItems: $scope.racingData.selectedItems,
                        selectedAnyCount: $scope.racingData.selectedAnyCount,
                        type: $scope.selectedTab,
                        gameId: $scope.openGame.id,
                        start_ts: $scope.openGame.start_ts,
                        name: $scope.openGame.team1_name
                    },
                    hideButtons: true
                });

            };

            function getFirstKeyValue(obj, callback) {
                if (!obj) {
                    return;
                }
                var keys = Object.keys(obj);
                if (keys.length > 0) {
                    callback(obj[keys[0]]);
                }
            }

            function handleGameData() {
                var count = $scope.getItemsCount();
                if (count === 0) {
                    $scope.selectedTab = "winner";
                }
                forecastTricast.restoreSelectedRaces();
            }

            function updateOpenGameData(data) {
                getFirstKeyValue(data.sport, function (sport) {
                    getFirstKeyValue(sport.region, function (region) {
                        getFirstKeyValue(region.competition, function (competition) {
                            getFirstKeyValue(competition.game, function (game) {
                                var game =  {
                                    sport: {id: sport.id, alias: sport.alias},
                                    region: {id: region.id},
                                    competition: {id: competition.id, name: competition.name},
                                    id: game.id,
                                    type: game.type,
                                    markets_count: game.markets_count,
                                    start_ts: game.start_ts,
                                    is_live: game.is_live,
                                    is_blocked: game.is_blocked,
                                    game_number: game.game_number,
                                    team1_name: game.team1_name,
                                    info: game.info,
                                    market: game.market,
                                    game_info: game.game_info
                                };
                                if ($scope.raceCardsPredicate === 'none') {
                                    $scope.raceCardsPredicate = 'price';
                                }
                                $scope.openGame = game;
                                GameInfo.getRacingInfo($scope.openGame.id, $scope.openGame.info, $scope.openGame.market, "Winner", handleGameData);
                            });
                        });
                    });
                });

            }
            $scope.loading = true;
            connectionService.subscribe(
                {
                    'source': 'betting',
                    'what': {
                        sport: ['id', 'alias'],
                        competition: ['id', 'name'],
                        region: ['id'],
                        game: ["id", "markets_count", "start_ts", "is_live", "type", "is_blocked", "game_number","team1_name", "info", 'game_info' ],
                        market: ["id", "col_count", "type", "name_template", "sequence", "point_sequence", "express_id", "cashout", "display_key", "display_sub_key", "group_id", "name", "group_name", "order", "extra_info"],
                        event: ["order", "id", "type_1", "type", "type_id", "original_order", "name", "price", "nonrunner", "ew_allowed", "sp_enabled", "extra_info", "base", "home_value", "away_value", "display_column"]
                    },
                    'where': {
                        'sport': {'id': $scope.sportId},
                        'region': {'id': $scope.regionId},
                        'competition': {'id': $scope.competitionId},
                        'game': {'id': $scope.gameId}
                    }
                },
                updateOpenGameData,
                {
                    'thenCallback': function () {
                        $scope.loading = false;
                    },
                    'failureCallback': function () {
                        $scope.loading = false;
                    }
                }
            );
            $scope.$on("$destroy", function () {
                $rootScope.$broadcast("globalDialogs.removeDialogsByTag", DIALOG_TAG);
            });
            $scope.$on("forecastTricastFinished", function(event, gameId) {
                if (gameId === $scope.openGame.id) {
                    resetRacingData();
                }
            });
        }
    };
}]);
