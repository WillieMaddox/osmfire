/**
 * Created by maddoxw on 1/3/17.
 */

define(function (require) {
    'use strict';

    var utils = require('utils');

    var $selectNode = $('<select id="map-units" title="Units of the scale line.">');
    $selectNode.append(utils.createMenuOption("nautical", "nautical mile"));
    $selectNode.append(utils.createMenuOption("imperial", "imperial inch"));
    $selectNode.append(utils.createMenuOption("degrees", "degrees"));
    $selectNode.append(utils.createMenuOption("metric", "metric"));
    $selectNode.append(utils.createMenuOption("us", "us inch"));
    return $selectNode

});
