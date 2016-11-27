/**
 * Created by maddoxw on 7/23/16.
 */

define(['ol',
    'ttemplate',
    'exists'], function (ol,
                         tobjectTemplates,
                         exists) {

    var tobjectColor = {
        'aor': [0, 0, 0],
        'building': [128, 128, 128],
        'herbage': [0, 200, 0],
        'water': [0, 0, 200],
        'wall': [64, 64, 64],
        'road': [192, 51, 52],
        'generic': [218, 188, 163]
    };

    var tobjectFillOpacity = {
        'Polygon': 0.5,
        'LineString': 0,
        'Point': 0,
        'MultiPolygon': 0.5,
        'MultiLineString': 0,
        'MultiPoint': 0
    };

    return (function () {
        var setStyle = function (color, opacity) {
            var style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: color.concat(1),
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: color.concat(0.5)
                    })
                }),
                stroke: new ol.style.Stroke({
                    color: color.concat(1),
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: color.concat(opacity)
                })
            });
            return [style]
        };
        return function (feature, resolution) {
            var color, fillopacity;
            if (exists(feature.get('type')) && tobjectTemplates.hasOwnProperty(feature.get('type'))) {
                color = tobjectColor[feature.get('type')];
                fillopacity = feature.get('type') === 'aor' ? 0 : tobjectFillOpacity[feature.getGeometry().getType()];
            } else {
                color = [255, 0, 0];
                fillopacity = 0.5;
            }
            return setStyle(color, fillopacity);
        };
    })();
});