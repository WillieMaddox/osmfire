String.prototype.capitalizeFirstLetter = function (flip) {
    if (flip) {
        return this.charAt(0).toLowerCase() + this.slice(1);
    } else {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
};
function exists(x) {
    return (x !== undefined && x !== null);
}
function toRad(x) {
    return x * Math.PI / 180.0
}
function toInt(x) {
    return ~~x
}
function mod(n, m) {
    return ((n % m) + m) % m
}
var deg2tile = function (lon_deg, lat_deg, zoom) {
    var lat_rad = toRad(lat_deg);
    var n = Math.pow(2, zoom);
    var xtile = toInt(mod((lon_deg + 180.0) / 360.0, 1) * n);
    var ytile = toInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * n);
    return [xtile, ytile]
};
var FID = (function () {
    /**
     * Feature Id Generator based on
     * Linear Congruential Generator
     *Variant of a Lehman Generator
     *m is chosen to be large (as it is the max period)
     *and for its relationships to a and c
     *Make sure...
     *1: a - 1 is divisible by all prime factors of m.
     *2: a - 1 is divisible by 4 if m is divisible by 4.
     *3: m and c are co-prime (i.e. No prime number divides both m and c).
     */
    var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", // candidate char values
        chlength = chars.length, // number of candidate characters.
        idlength = 4, // number of chars to be put in the Id tag.
        idtag = "", // string to hold the id tag.
        t = 0, // dummy variable used in gen function.
        m = 14776336, // chars.length ** idlength --> 62**4
        a = 476657, // 62**3 + 1
        c = 1013904223, // offset. (prime number much larger than m.)
        z = seed = Math.round(Math.random() * m); // default random seed,
    return {
        setSeed: function (val) {
            z = seed = exists(val) ? val : Math.round(Math.random() * m);
        },
        getSeed: function () {
            return seed;
        },
        gen: function () {
            idtag = "";
            z = (a * z + c) % m;
            for (i = 0; i < idlength; i++) {
                t = Math.floor(z / Math.pow(chlength, i)) % chlength;
                idtag += chars.charAt(t);
            }
            return idtag;
        }
    }
})();

/**
 * check whether the point consists of pointcoords is inside the supplied polygon geometry
 * @{ol.geometry.Polygon} geom
 * @{Array()} a two elements array representing the point coordinates
 * @returns {Boolean} true||false
 */
function isPointInPoly(geom, pointcoords) {
    var geomA = new jsts.io.GeoJSONReader().read(
        new ol.format.GeoJSON().writeFeatureObject(
            new ol.Feature({
                geometry: geom
            })
        )
    ).geometry;
    var geomB = new jsts.io.GeoJSONReader().read(
        new ol.format.GeoJSON().writeFeatureObject(
            new ol.Feature({
                geometry: new ol.geom.Point(pointcoords)
            })
        )
    ).geometry;
    return geomB.within(geomA);
}
function doesPolyCoverHole(geom, holecoords) {
    var geomA = new jsts.io.GeoJSONReader().read(
        new ol.format.GeoJSON().writeFeatureObject(
            new ol.Feature({
                geometry: geom
            })
        )
    ).geometry;
    var geomB = new jsts.io.GeoJSONReader().read(
        new ol.format.GeoJSON().writeFeatureObject(
            new ol.Feature({
                geometry: new ol.geom.Polygon([holecoords])
            })
        )
    ).geometry;
    return geomA.covers(geomB);
}
function isPolyValid(poly) {
    var geom = new jsts.io.GeoJSONReader().read(
        new ol.format.GeoJSON().writeFeatureObject(
            new ol.Feature({
                geometry: poly
            })
        )
    ).geometry;
    return geom.isValid();
}
function getJSTSgeom(origGeom) {
    var geom = new jsts.io.GeoJSONReader().read(
        new ol.format.GeoJSON().writeFeatureObject(
            new ol.Feature({
                geometry: origGeom
            })
        )
    ).geometry;
    return geom;
}

var fillOpacity = {
    'Polygon': 0.1,
    'LineString': 0,
    'Point': 0,
    'MultiPolygon': 0.1,
    'MultiLineString': 0,
    'MultiPoint': 0
};

var tobjectProperties = {
    'aor': {
        'geometry_type': 'Polygon',
        // 'subtype': null,
        // 'height': null,
        // 'thickness': null,
        'color': [0, 0, 0]
    },
    'building': {
        'geometry_type': 'Polygon',
        'subtype': ['metal', 'glass'],
        'height': 10,
        // 'thickness': null,
        'color': [128, 128, 128]
    },
    'herbage': {
        'geometry_type': 'Polygon',
        'subtype': ['dense', 'sparse'],
        'height': 10,
        // 'thickness': null,
        'color': [0, 200, 0]
    },
    'water': {
        'geometry_type': 'Polygon',
        'subtype': ['warm', 'cool', 'frozen'],
        // 'height': null,
        // 'thickness': null,
        'color': [0, 0, 200]
    },
    'wall': {
        'geometry_type': 'LineString',
        'subtype': ['metal', 'stone'],
        'height': 10,
        'thickness': 10,
        'color': [64, 64, 64]
    },
    'road': {
        'geometry_type': 'LineString',
        'subtype': ['cement', 'gravel', 'dirt'],
        // 'height': null,
        'thickness': 10,
        'color': [192, 51, 52]
    },
    'generic': {
        // 'geometry_type': null,
        // 'subtype': null,
        // 'height': null,
        // 'thickness': null,
        'color': [218, 188, 163]
    }
};

var tobjectStyleFunction = (function () {
    var setStyle = function (color, opacity) {
        var style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: color.concat(1),
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: color.concat(0.6)
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
        var color;
        var opacity;
        if (exists(feature.get('type')) && tobjectProperties.hasOwnProperty(feature.get('type'))) {
            color = tobjectProperties[feature.get('type')]['color'];
        } else {
            color = [255, 0, 0];
        }
        if (feature.get('type') === 'aor') {
            opacity = 0
        } else {
            opacity = fillOpacity[feature.getGeometry().getType()];
            opacity = opacity ? opacity : 0;
        }
        return setStyle(color, opacity);
    };
})();

var waterStyleFunction = (function () {
    var setStyle = function (color, opacity) {
        var style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: color.concat(1),
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: color.concat(0.6)
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
        var color;
        var opacity;
        if (waterProperties.hasOwnProperty('color')) {
            color = waterProperties.color;
        } else {
            color = [255, 0, 0];
        }
        opacity = fillOpacity[feature.getGeometry().getType()];
        opacity = opacity ? opacity : 0;

        return setStyle(color, opacity);
    };
})();

var genericProperties = {
    'genericPoly': {
        'geometry_type': 'Polygon',
        'color': [218, 188, 163]
    },
    'genericLine': {
        'geometry_type': 'LineString',
        'color': [218, 188, 163]
    },
    'genericPoint': {
        'geometry_type': 'Point',
        'color': [218, 188, 163]
    }
};

var cameraProperties = {
    defaultsensor: '',
    source_height: {
        units: 'meter',
        value: 3
    },
    target_height: {
        units: 'meter',
        value: 1
    },
    tilt: {
        units: 'degree',
        value: 0
    },
    pan: {
        wrt: 'north',
        units: 'degree',
        value: 0
    },
    min_range: {
        units: 'meter',
        value: 0
    },
    max_range: {
        units: 'meter',
        value: 1000
    },
    isotropic: true,
    option: '',
    fovtype: ''
};

var cameraStyleFunction = (function () {
    var setStyle = function (color) {
        var style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: color.concat(1),
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: color.concat(0.6)
                })
            })
        });
        return [style]
    };
    return function (feature, resolution) {
        var color;
        if (exists(feature.get('type')) && cameraProperties.hasOwnProperty(feature.get('type'))) {
            color = cameraProperties[feature.get('type')]['color'];
        } else {
            color = [255, 0, 0];
        }
        return setStyle(color);
    };
})();

var aorProperties = {
    color: [0, 0, 0]
};
var buildingProperties = {
    subtype: ['metal', 'glass'],
    height: 10,
    color: [128, 128, 128]
};
var herbageProperties = {
    subtype: ['dense', 'sparse'],
    height: 10,
    color: [0, 200, 0]
};
var waterProperties = {
    subtype: ['warm', 'cool', 'frozen'],
    color: [0, 0, 200]
};
var wallProperties = {
    subtype: ['metal', 'stone'],
    height: 10,
    thickness: 10,
    color: [64, 64, 64]
};
var roadProperties = {
    subtype: ['cement', 'gravel', 'dirt'],
    thickness: 10,
    color: [192, 51, 52]
};

var templateLayers = {
    'aor': {
        'geometry_type': 'Polygon',
        'styleFunction': tobjectStyleFunction,
        'properties': aorProperties
    },
    'building': {
        'geometry_type': 'Polygon',
        'styleFunction': tobjectStyleFunction,
        'properties': buildingProperties
    },
    'herbage': {
        'geometry_type': 'Polygon',
        'styleFunction': tobjectStyleFunction,
        'properties': herbageProperties
    },
    water: {
        geometry_type: 'Polygon',
        styleFunction: waterStyleFunction,
        properties: waterProperties
    },
    'wall': {
        'geometry_type': 'LineString',
        'styleFunction': tobjectStyleFunction,
        'properties': wallProperties
    },
    'road': {
        'geometry_type': 'LineString',
        'styleFunction': tobjectStyleFunction,
        'properties': roadProperties
    },
    'tobject': {
        'geometry_type': 'geomcollection',
        'styleFunction': tobjectStyleFunction,
        'properties': tobjectProperties
    },
    'generic': {
        'geometry_type': 'geomcollection',
        'styleFunction': tobjectStyleFunction,
        'properties': genericProperties
    },
    'camera': {
        'geometry_type': 'point',
        'styleFunction': cameraStyleFunction,
        'properties': cameraProperties
    },
    'radio': { // To be added later...
        'geometry_type': 'point',
        'styleFunction': 'radioStyleFunction',
        'properties': 'radioProperties'
    }
};

var layerTree = function (options) {
    'use strict';
    if (!(this instanceof layerTree)) {
        throw new Error('layerTree must be constructed with the new keyword.');
    } else if (typeof options === 'object' && options.map && options.target) {
        if (!(options.map instanceof ol.Map)) {
            throw new Error('Please provide a valid OpenLayers 3 map object.');
        }
        this.map = options.map;
        var containerDiv = document.getElementById(options.target);
        if (containerDiv === null || containerDiv.nodeType !== 1) {
            throw new Error('Please provide a valid element id.');
        }
        this.messages = document.getElementById(options.messages) || document.createElement('span');
        var observer = new MutationObserver(function (mutations) {
            if (mutations[0].target.textContent) {
                var oldText = mutations[0].target.textContent;
                var timeoutFunction = function () {
                    if (oldText !== mutations[0].target.textContent) {
                        oldText = mutations[0].target.textContent;
                        setTimeout(timeoutFunction, 10000);
                    } else {
                        oldText = '';
                        mutations[0].target.textContent = '';
                    }
                };
                setTimeout(timeoutFunction, 10000);
            }
        });
        observer.observe(this.messages, {childList: true});
        this.createAddVectorForm();
        this.createNewVectorForm();
        var controlDiv = document.createElement('div');
        controlDiv.className = 'layertree-buttons';
        controlDiv.appendChild(this.createButton('addwms', 'Add WMS Layer', 'addlayer'));
        controlDiv.appendChild(this.createButton('addwfs', 'Add WFS Layer', 'addlayer'));
        controlDiv.appendChild(this.createButton('newvector', 'New Vector Layer', 'addlayer'));
        controlDiv.appendChild(this.createButton('addvector', 'Add Vector Layer', 'addlayer'));
        controlDiv.appendChild(this.createButton('deletelayer', 'Remove Layer', 'deletelayer'));
        containerDiv.appendChild(controlDiv);
        this.layerContainer = document.createElement('div');
        this.layerContainer.className = 'layercontainer';
        containerDiv.appendChild(this.layerContainer);

        var idCounter = 0;

        this.selectedLayer = null;
        this.selectEventEmitter = new ol.Observable();

        this.createRegistry = function (layer, buffer) {
            layer.set('id', 'layer_' + idCounter);
            idCounter += 1;
            var _this = this;

            var layerDiv = document.createElement('div');
            layerDiv.className = buffer ? 'layer ol-unselectable buffering' : 'layer ol-unselectable';
            layerDiv.title = layer.get('name') || 'Unnamed Layer';
            layerDiv.id = layer.get('id');
            layerDiv.draggable = true;
            layerDiv.addEventListener('dragstart', function (evt) {
                evt.dataTransfer.effectAllowed = 'move';
                evt.dataTransfer.setData('Text', this.id);
            });
            layerDiv.addEventListener('dragenter', function (evt) {
                this.classList.add('over');
            });
            layerDiv.addEventListener('dragleave', function (evt) {
                this.classList.remove('over');
            });
            layerDiv.addEventListener('dragover', function (evt) {
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'move';
            });
            layerDiv.addEventListener('drop', function (evt) {
                evt.preventDefault();
                this.classList.remove('over');
                var sourceLayerDiv = document.getElementById(evt.dataTransfer.getData('Text'));
                if (sourceLayerDiv !== this) {
                    _this.layerContainer.removeChild(sourceLayerDiv);
                    _this.layerContainer.insertBefore(sourceLayerDiv, this);
                    var htmlArray = [].slice.call(_this.layerContainer.children);
                    var index = htmlArray.length - htmlArray.indexOf(sourceLayerDiv) - 1;
                    var sourceLayer = _this.getLayerById(sourceLayerDiv.id);
                    var layers = _this.map.getLayers().getArray();
                    var group_shift = layers.length - htmlArray.length;
                    layers.splice(layers.indexOf(sourceLayer), 1);
                    // layers.splice(index, 0, sourceLayer);
                    layers.splice(group_shift + index, 0, sourceLayer);
                    _this.map.render();
                    // _this.map.getLayers().changed();
                }
            });

            this.addSelectEvent(layerDiv);

            var layerSpan = document.createElement('span');
            layerSpan.textContent = layerDiv.title;
            layerSpan.addEventListener('dblclick', function () {
                this.contentEditable = true;
                layerDiv.draggable = false;
                layerDiv.classList.remove('ol-unselectable');
                this.focus();
            });
            layerSpan.addEventListener('blur', function () {
                if (this.contentEditable) {
                    this.contentEditable = false;
                    layerDiv.draggable = true;
                    layer.set('name', this.textContent);
                    layerDiv.classList.add('ol-unselectable');
                    layerDiv.title = this.textContent;
                    this.scrollTo(0, 0);
                }
            });

            layerDiv.appendChild(this.addSelectEvent(layerSpan, true));

            var visibleBox = document.createElement('input');
            visibleBox.type = 'checkbox';
            visibleBox.className = 'visible';
            visibleBox.checked = layer.getVisible();
            visibleBox.addEventListener('change', function () {
                if (this.checked) {
                    layer.setVisible(true);
                } else {
                    layer.setVisible(false);
                }
            });

            layerDiv.appendChild(this.stopPropagationOnEvent(visibleBox, 'click'));

            var layerControls = document.createElement('div');
            this.addSelectEvent(layerControls, true);

            var opacityHandler = document.createElement('input');
            opacityHandler.type = 'range';
            opacityHandler.min = 0;
            opacityHandler.max = 1;
            opacityHandler.step = 0.1;
            opacityHandler.value = layer.getOpacity();
            opacityHandler.addEventListener('input', function () {
                layer.setOpacity(this.value);
            });
            opacityHandler.addEventListener('change', function () {
                layer.setOpacity(this.value);
            });
            opacityHandler.addEventListener('mousedown', function () {
                layerDiv.draggable = false;
            });
            opacityHandler.addEventListener('mouseup', function () {
                layerDiv.draggable = true;
            });

            layerControls.appendChild(this.stopPropagationOnEvent(opacityHandler, 'click'));

            if (layer instanceof ol.layer.Vector) {
                layerControls.appendChild(document.createElement('br'));
                var attributeOptions = document.createElement('select');
                layerControls.appendChild(this.stopPropagationOnEvent(attributeOptions, 'click'));

                layerControls.appendChild(document.createElement('br'));
                var defaultStyle = this.createButton('stylelayer', 'Default', 'stylelayer', layer);
                layerControls.appendChild(this.stopPropagationOnEvent(defaultStyle, 'click'));
                var graduatedStyle = this.createButton('stylelayer', 'Graduated', 'stylelayer', layer);
                layerControls.appendChild(this.stopPropagationOnEvent(graduatedStyle, 'click'));
                var categorizedStyle = this.createButton('stylelayer', 'Categorized', 'stylelayer', layer);
                layerControls.appendChild(this.stopPropagationOnEvent(categorizedStyle, 'click'));
                layer.set('style', layer.getStyle());
                layer.on('propertychange', function (evt) {
                    if (evt.key === 'headers') {
                        this.removeContent(attributeOptions);
                        var headers = layer.get('headers');
                        for (var i in headers) {
                            attributeOptions.appendChild(this.createOption(i));
                        }
                    }
                }, this);
            }
            layerDiv.appendChild(layerControls);
            this.layerContainer.insertBefore(layerDiv, this.layerContainer.firstChild);
            return this;
        };

        this.map.getLayers().on('add', function (evt) {
            if (evt.element instanceof ol.layer.Vector) {
                if (evt.element.get('type') !== 'overlay') {
                    this.createRegistry(evt.element, true);
                }
            } else {
                this.createRegistry(evt.element);
            }
        }, this);
        this.map.getLayers().on('remove', function (evt) {
            if (evt.element.get('type') !== 'overlay') {
                this.removeRegistry(evt.element);
                this.selectEventEmitter.changed();
            }
        }, this);
    } else {
        throw new Error('Invalid parameter(s) provided.');
    }
};
layerTree.prototype.createButton = function (elemName, elemTitle, elemType, layer) {
    var buttonElem = document.createElement('button');
    buttonElem.className = elemName;
    buttonElem.title = elemTitle;
    var _this = this;
    switch (elemType) {
        case 'addlayer':
            buttonElem.addEventListener('click', function () {
                document.getElementById(elemName).style.display = 'block';
            });
            return buttonElem;
        case 'deletelayer':
            buttonElem.addEventListener('click', function () {
                if (_this.selectedLayer) {
                    var layer = _this.getLayerById(_this.selectedLayer.id);
                    _this.map.removeLayer(layer);
                    _this.messages.textContent = 'Layer removed successfully.';
                } else {
                    _this.messages.textContent = 'No selected layer to remove.';
                }
            });
            return buttonElem;
        case 'stylelayer':
            buttonElem.textContent = elemTitle;
            if (elemTitle === 'Default') {
                buttonElem.addEventListener('click', function () {
                    // layer.setStyle(layer.get('style'));
                    layer.setStyle(templateLayers[layer.get('type')].styleFunction);
                });
            } else {
                var styleFunction = elemTitle === 'Graduated' ? this.styleGraduated : this.styleCategorized;
                buttonElem.addEventListener('click', function () {
                    var attribute = buttonElem.parentNode.querySelector('select').value;
                    styleFunction.call(_this, layer, attribute);
                });
            }
            return buttonElem;
        default:
            return false;
    }
};
layerTree.prototype.addBufferIcon = function (layer) {
    layer.getSource().on('change', function (evt) {
        var layerElem = document.getElementById(layer.get('id'));
        switch (evt.target.getState()) {
            case 'ready':
                layerElem.className = layerElem.className.replace(/(?:^|\s)(error|buffering)(?!\S)/g, '');
                layer.buildHeaders();
                break;
            case 'error':
                layerElem.classList.add('error');
                break;
            default:
                layerElem.classList.add('buffering');
                break;
        }
    });
};
layerTree.prototype.removeContent = function (element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    return this;
};
layerTree.prototype.createOption = function (optionValue, optionText) {
    var option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionText || optionValue;
    return option;
};

layerTree.prototype.checkWmsLayer = function (form) {
    form.check.disabled = true;
    var _this = this;
    this.removeContent(form.layer).removeContent(form.format);
    var url = form.server.value;
    url = /^((http)|(https))(:\/\/)/.test(url) ? url : 'http://' + url;
    form.server.value = url;
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            var parser = new ol.format.WMSCapabilities();
            try {
                var capabilities = parser.read(request.responseText);
                var currentProj = _this.map.getView().getProjection().getCode();
                var crs;
                var messageText = 'Layers read successfully.';
                if (capabilities.version === '1.3.0') {
                    crs = capabilities.Capability.Layer.CRS;
                } else {
                    crs = [currentProj];
                    messageText += ' Warning! Projection compatibility could not be checked due to version mismatch (' + capabilities.version + ').';
                }
                var layers = capabilities.Capability.Layer.Layer;
                if (layers.length > 0 && crs.indexOf(currentProj) > -1) {
                    for (var i = 0; i < layers.length; i += 1) {
                        form.layer.appendChild(_this.createOption(layers[i].Name));
                    }
                    var formats = capabilities.Capability.Request.GetMap.Format;
                    for (i = 0; i < formats.length; i += 1) {
                        form.format.appendChild(_this.createOption(formats[i]));
                    }
                    _this.messages.textContent = messageText;
                }
            } catch (error) {
                _this.messages.textContent = 'Some unexpected error occurred: (' + error.message + ').';
            } finally {
                form.check.disabled = false;
            }
        } else if (request.status > 200) {
            form.check.disabled = false;
        }
    };
    url = /\?/.test(url) ? url + '&' : url + '?';
    url = url + 'REQUEST=GetCapabilities&SERVICE=WMS';
    // var url1 = '../../../cgi-bin/proxy.py?url=' + encodeURIComponent(url);
    // var url2 = 'http://localhost:8050/cgi-bin/proxy.py?' + encodeURIComponent(url);
    var url3 = 'http://www.firefly.com:8050/cgi-bin/proxy.py?' + url;
    console.log(url3);
    request.open('GET', url3, true);
    request.send();
};
layerTree.prototype.addWmsLayer = function (form) {
    var params = {
        url: form.server.value,
        params: {
            layers: form.layer.value,
            format: form.format.value
        }
    };
    var layer;
    if (form.tiled.checked) {
        layer = new ol.layer.Tile({
            source: new ol.source.TileWMS(params),
            name: form.displayname.value
        });
    } else {
        layer = new ol.layer.Image({
            source: new ol.source.ImageWMS(params),
            name: form.displayname.value
        });
    }
    this.map.addLayer(layer);
    this.messages.textContent = 'WMS layer added successfully.';
    return this;
};
layerTree.prototype.addWfsLayer = function (form) {
    var url = form.server.value;
    url = /^((http)|(https))(:\/\/)/.test(url) ? url : 'http://' + url;
    url = /\?/.test(url) ? url + '&' : url + '?';
    var typeName = form.layer.value;
    var mapProj = this.map.getView().getProjection().getCode();
    var proj = form.projection.value || mapProj;
    var parser = new ol.format.WFS();
    var source = new ol.source.Vector({
        strategy: ol.loadingstrategy.bbox
    });
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            source.addFeatures(parser.readFeatures(request.responseText, {
                dataProjection: proj,
                featureProjection: mapProj
            }));
        }
    };
    url = url + 'SERVICE=WFS&REQUEST=GetFeature&TYPENAME=' + typeName + '&VERSION=1.1.0&SRSNAME=' + proj;
    // request.open('GET', '../../../cgi-bin/proxy.py?' + encodeURIComponent(url));
    var url3 = 'http://www.firefly.com:8050/cgi-bin/proxy.py?' + url;
    request.open('GET', url3);
    request.send();
    var layer = new ol.layer.Vector({
        source: source,
        name: form.displayname.value
    });
    this.addBufferIcon(layer);
    this.map.addLayer(layer);
    this.messages.textContent = 'WFS layer added successfully.';
    return this;
};
layerTree.prototype.createAddVectorForm = function () {
    var div_addvector = document.createElement('div');
    div_addvector.id = "addvector";
    div_addvector.style.display = "none";
    div_addvector.className = "toggleable";

    var form_addvector_form = document.createElement('form');
    form_addvector_form.className = "addlayer";
    form_addvector_form.id = "addvector_form";

    var p_0 = document.createElement('p');
    p_0.appendChild(document.createTextNode("Add Vector layer"));
    form_addvector_form.appendChild(p_0);

    var table_0 = document.createElement('table');

    var tr_2 = document.createElement('tr');
    var td_4 = document.createElement('td');
    td_4.appendChild(document.createTextNode("Format:"));
    tr_2.appendChild(td_4);
    var td_5 = document.createElement('td');
    var select_0 = document.createElement('select');
    select_0.name = "format";
    select_0.required = "required";
    select_0.appendChild(this.createOption('geojson', 'GeoJSON'));
    select_0.appendChild(this.createOption('topojson', 'TopoJSON'));
    select_0.appendChild(this.createOption('zip', 'Shapefile (zipped)'));
    // select_0.appendChild(this.createOption('shp', 'ShapeFile'));
    select_0.appendChild(this.createOption('kml', 'KML'));
    select_0.appendChild(this.createOption('osm', 'OSM'));
    select_0.addEventListener("change", function () {
        document.getElementById("file-name").accept = '.' + this.value;
    });
    td_5.appendChild(select_0);
    tr_2.appendChild(td_5);

    table_0.appendChild(tr_2);

    var tr_0 = document.createElement('tr');
    var td_0 = document.createElement('td');
    td_0.appendChild(document.createTextNode("Vector file:"));
    tr_0.appendChild(td_0);
    var td_1 = document.createElement('td');
    var input_0 = document.createElement('input');
    input_0.id = "file-name";
    input_0.type = "file";
    input_0.name = "file";
    input_0.required = "required";
    input_0.accept = ".geojson";
    input_0.addEventListener("change", function (evt) {
        var startPos = this.value.lastIndexOf("\\") + 1;
        var stopPos = this.value.lastIndexOf(".");
        var name = this.value.slice(startPos, stopPos);
        document.getElementById("display-name").value = name;
    });
    td_1.appendChild(input_0);
    tr_0.appendChild(td_1);

    table_0.appendChild(tr_0);

    var tr_1 = document.createElement('tr');
    var td_2 = document.createElement('td');
    td_2.appendChild(document.createTextNode("Display name:"));
    tr_1.appendChild(td_2);
    var td_3 = document.createElement('td');
    var input_1 = document.createElement('input');
    input_1.id = "display-name";
    input_1.type = "text";
    input_1.name = "displayname";
    td_3.appendChild(input_1);
    tr_1.appendChild(td_3);

    table_0.appendChild(tr_1);

    var tr_3 = document.createElement('tr');
    var td_6 = document.createElement('td');
    td_6.appendChild(document.createTextNode("Projection:"));
    tr_3.appendChild(td_6);
    var td_7 = document.createElement('td');
    var input_2 = document.createElement('input');
    input_2.type = "text";
    input_2.name = "projection";
    td_7.appendChild(input_2);
    tr_3.appendChild(td_7);

    table_0.appendChild(tr_3);

    var tr_4 = document.createElement('tr');
    var td_8 = document.createElement('td');
    var input_3 = document.createElement('input');
    input_3.type = "submit";
    input_3.value = "Add layer";
    td_8.appendChild(input_3);
    tr_4.appendChild(td_8);
    var td_9 = document.createElement('td');
    var input_4 = document.createElement('input');
    input_4.type = "button";
    input_4.value = "Cancel";
    input_4.onclick = function () {
        this.form.parentNode.style.display = 'none'
    };
    td_9.appendChild(input_4);
    tr_4.appendChild(td_9);

    table_0.appendChild(tr_4);

    form_addvector_form.appendChild(table_0);

    div_addvector.appendChild(form_addvector_form);

    document.body.appendChild(div_addvector);
};
layerTree.prototype.addVectorLayer = function (form) {
    var file = form.file.files[0];
    var currentProj = this.map.getView().getProjection();
    try {
        var fr = new FileReader();
        var sourceFormat;
        var source = new ol.source.Vector({
            strategy: ol.loadingstrategy.bbox
        });
        fr.onload = function (evt) {
            var vectorData = evt.target.result;
            var sourceType;
            switch (form.format.value) {
                case 'zip':
                    sourceFormat = new ol.format.GeoJSON();
                    break;
                // case 'shp':
                //     sourceFormat = new ol.format.GeoJSON();
                //     break;
                case 'geojson':
                    sourceFormat = new ol.format.GeoJSON();
                    // currently only supports saving out to geojson.
                    var re = /layertag[^a-z]*([a-zA-z]*)/;
                    sourceType = re.exec(vectorData);
                    if (exists(sourceType) && sourceType.length === 2) {
                        sourceType = sourceType[1];
                    }
                    break;
                case 'topojson':
                    sourceFormat = new ol.format.TopoJSON();
                    break;
                case 'kml':
                    sourceFormat = new ol.format.KML();
                    break;
                case 'osm':
                    sourceFormat = new ol.format.OSMXML();
                    break;
                default:
                    return false;
            }

            var dataProjection = form.projection.value || sourceFormat.readProjection(vectorData) || currentProj;
            if (form.format.value === 'zip') {
                shp(vectorData).then(function (geojson) {
                    source.addFeatures(sourceFormat.readFeatures(geojson, {
                        dataProjection: dataProjection,
                        featureProjection: currentProj
                    }));
                });
                // } else if (form.format.value === 'shp'){
                //     shp(file).then(function (geojson) {
                //         source.addFeatures(sourceFormat.readFeatures(geojson, {
                //             dataProjection: dataProjection,
                //             featureProjection: currentProj
                //         }));
                //     });
            } else {
                source.addFeatures(sourceFormat.readFeatures(vectorData, {
                    dataProjection: dataProjection,
                    featureProjection: currentProj
                }));
            }
            if (sourceType && Object.keys(templateLayers).indexOf(sourceType) >= 0) {
                layer.set('type', sourceType);
                layer.setStyle(templateLayers[sourceType].styleFunction);
            }
            // var newgeom;
            // source.getFeatures().forEach(function (feature) {
            //     if (feature.getGeometry().getType() === 'MultiPolygon') {
            //         if (feature.getGeometry().getCoordinates().length === 1) {
            //             newgeom = new ol.geom.Polygon(feature.getGeometry().getCoordinates()[0]);
            //             feature.setGeometry(newgeom);
            //         }
            //     } else if (feature.getGeometry().getType() === 'MultiLineString') {
            //         if (feature.getGeometry().getCoordinates().length === 1) {
            //             newgeom = new ol.geom.LineString(feature.getGeometry().getCoordinates()[0]);
            //             feature.setGeometry(newgeom);
            //         }
            //     }
            // });
        };
        if (form.format.value === 'zip') {
            fr.readAsArrayBuffer(file); // SHP
        } else {
            fr.readAsText(file);
        }
        var layer = new ol.layer.Vector({
            source: source,
            name: form.displayname.value,
            updateWhileInteracting: true,
            updateWhileAnimating: true
        });
        this.addBufferIcon(layer);
        this.map.addLayer(layer);
        this.messages.textContent = 'Vector layer added successfully.';
        return this;
    } catch (error) {
        this.messages.textContent = 'Some unexpected error occurred: (' + error.message + ').';
        return error;
    }
};
layerTree.prototype.createNewVectorForm = function () {
    var div_newvector = document.createElement('div');
    div_newvector.className = "toggleable";
    div_newvector.id = "newvector";
    div_newvector.style.display = "none";

    var form_newvector_form = document.createElement('form');
    form_newvector_form.id = "newvector_form";
    form_newvector_form.className = "addlayer";

    var p_0 = document.createElement('p');
    p_0.appendChild(document.createTextNode("New Vector layer"));
    form_newvector_form.appendChild(p_0);

    var table_0 = document.createElement('table');

    var tr_0 = document.createElement('tr');
    var td_0 = document.createElement('td');
    td_0.appendChild(document.createTextNode("Display name:"));
    tr_0.appendChild(td_0);
    var td_1 = document.createElement('td');
    var input_0 = document.createElement('input');
    input_0.name = "displayname";
    input_0.type = "text";
    td_1.appendChild(input_0);
    tr_0.appendChild(td_1);

    table_0.appendChild(tr_0);

    var tr_1 = document.createElement('tr');
    var td_2 = document.createElement('td');
    td_2.appendChild(document.createTextNode("Type:"));
    tr_1.appendChild(td_2);
    var td_3 = document.createElement('td');
    var select_0 = document.createElement('select');
    select_0.required = "required";
    select_0.name = "type";
    select_0.appendChild(this.createOption('tobject', 'Unnamed tObject Layer'));
    select_0.appendChild(this.createOption('aor', 'Unnamed AOR Layer'));
    select_0.appendChild(this.createOption('building', 'Unnamed Building Layer'));
    select_0.appendChild(this.createOption('herbage', 'Unnamed Herbage Layer'));
    select_0.appendChild(this.createOption('water', 'Unnamed Water Layer'));
    select_0.appendChild(this.createOption('wall', 'Unnamed Wall Layer'));
    select_0.appendChild(this.createOption('road', 'Unnamed Road Layer'));
    select_0.appendChild(this.createOption('generic', 'Unnamed Generic Layer'));
    select_0.appendChild(this.createOption('camera', 'Unnamed Camera Layer'));
    // select_0.appendChild(this.createOption('radio', 'Unnamed Radio Layer'));
    select_0.appendChild(this.createOption('geomcollection', 'Unnamed GeomCollection Layer'));
    select_0.appendChild(this.createOption('polygon', 'Unnamed Polygon Layer'));
    select_0.appendChild(this.createOption('linestring', 'Unnamed LineString Layer'));
    select_0.appendChild(this.createOption('point', 'Unnamed Point Layer'));
    td_3.appendChild(select_0);
    tr_1.appendChild(td_3);

    table_0.appendChild(tr_1);

    var tr_2 = document.createElement('tr');
    var td_4 = document.createElement('td');
    var input_1 = document.createElement('input');
    input_1.type = "submit";
    input_1.value = "Add layer";
    td_4.appendChild(input_1);
    tr_2.appendChild(td_4);
    var td_5 = document.createElement('td');
    var input_2 = document.createElement('input');
    input_2.type = "button";
    input_2.value = "Cancel";
    input_2.onclick = function () {
        this.form.parentNode.style.display = 'none'
    };
    td_5.appendChild(input_2);
    tr_2.appendChild(td_5);

    table_0.appendChild(tr_2);

    form_newvector_form.appendChild(table_0);

    div_newvector.appendChild(form_newvector_form);

    document.body.appendChild(div_newvector);
};
layerTree.prototype.newVectorLayer = function (form) {
    var type = form.type.value;
    var geomTypes = ['point', 'linestring', 'polygon', 'geomcollection'];
    var sourceTypes = Object.keys(templateLayers);
    if (sourceTypes.indexOf(type) === -1 && geomTypes.indexOf(type) === -1) {
        this.messages.textContent = 'Unrecognized layer type.';
        return false;
    }
    var layer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        name: form.displayname.value || type + ' Layer',
        type: type
    });
    this.addBufferIcon(layer);
    this.map.addLayer(layer);
    layer.getSource().changed();
    if (Object.keys(templateLayers).indexOf(type) !== -1) {
        layer.setStyle(templateLayers[type].styleFunction);
    }
    this.messages.textContent = 'New vector layer created successfully.';
    return this;
};

layerTree.prototype.addSelectEvent = function (node, isChild) {
    var _this = this;
    node.addEventListener('click', function (evt) {
        var targetNode = evt.target;
        if (isChild) {
            evt.stopPropagation();
            targetNode = targetNode.parentNode;
        }
        if (_this.selectedLayer) {
            _this.selectedLayer.classList.remove('active');
        }
        if (_this.selectedLayer !== targetNode) {
            _this.selectedLayer = targetNode;
            _this.selectedLayer.classList.add('active');
        } else {
            _this.selectedLayer = null;
        }
        _this.selectEventEmitter.changed();
    });
    return node;
};
layerTree.prototype.removeRegistry = function (layer) {
    var layerDiv = document.getElementById(layer.get('id'));
    this.layerContainer.removeChild(layerDiv);
    return this;
};
layerTree.prototype.getLayerById = function (id) {
    var layers = this.map.getLayers().getArray();
    for (var i = 0; i < layers.length; i += 1) {
        if (layers[i].get('id') === id) {
            return layers[i];
        }
    }
    return false;
};
layerTree.prototype.identifyLayer = function (layer) {

    var getSourceCandidate = function (featureType) {
        for (var stype in templateLayers) {
            for (var ftype in templateLayers[stype].properties) {
                if (featureType === ftype) {
                    return stype;
                }
            }
        }
    };
    if (layer.getSource().getFeatures().length === 0) {
        return layer;
    }
    if (Object.keys(templateLayers).indexOf(layer.get('type')) >= 0) {
        return layer;
    }
    if (['point', 'linestring', 'polygon', 'geomcollection'].indexOf(layer.get('type')) >= 0) {
        return layer;
    }

    var geomType = null;
    var geomTypes = [];
    var featureTypes = [];
    var sourceType = null;
    var geomTypeIsValid = false;
    var sourceTypeIsValid = false;
    var geomTypeIsVerified = false;
    var sourceTypeIsVerified = false;
    layer.getSource().forEachFeature(function (feat) {
        if (!(geomTypeIsVerified)) {
            var geom = feat.getGeometry();
            var featureType;
            if (geom instanceof ol.geom.Point || geom instanceof ol.geom.MultiPoint) {
                geomType = 'point';
            } else if (geom instanceof ol.geom.LineString || geom instanceof ol.geom.MultiLineString) {
                geomType = 'linestring';
            } else if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon) {
                geomType = 'polygon';
            } else {
                geomType = 'geomcollection';
            }
            if (geomTypes.indexOf(geomType) === -1) {
                geomTypes.push(geomType);
                if (geomType === 'geomcollection' || geomTypes.length >= 2) {
                    geomTypeIsVerified = true;
                    geomTypeIsValid = true;
                }
            }
        }
        if (!(sourceTypeIsVerified)) {
            featureType = feat.get('type');
            if (featureTypes.indexOf(featureType) === -1) {
                if (!(featureType)) { // key is completely missing.
                    sourceTypeIsVerified = true;
                    sourceTypeIsValid = false;
                } else if (!(sourceType)) { // first valid record.
                    sourceType = getSourceCandidate(featureType);
                    sourceTypeIsValid = true;
                } else if (sourceType !== getSourceCandidate(featureType)) { // different sources.
                    sourceTypeIsVerified = true;
                    sourceTypeIsValid = false;
                }
                featureTypes.push(featureType)
            }
        }
        if (sourceTypeIsVerified && geomTypeIsVerified) {
            return true;
        }
    });
    if (sourceTypeIsValid) {
        layer.set('type', sourceType)
    } else if (geomTypeIsValid) {
        layer.set('type', 'geomcollection')
    } else if (geomTypes.length === 1) {
        layer.set('type', geomTypes[0])
    } else {
        // TODO: return as an error message to the messagebar.
    }
    return layer;
};
// layerTree.prototype.getStyle = function (layertag) {
//     ;
// };
layerTree.prototype.stopPropagationOnEvent = function (node, event) {
    node.addEventListener(event, function (evt) {
        evt.stopPropagation();
    });
    return node;
};
layerTree.prototype.styleGraduated = function (layer, attribute) {
    if (layer.get('headers')[attribute] === 'string') {
        this.messages.textContent = 'A numeric column is required for graduated symbology.';
    } else {
        var attributeArray = [];
        layer.getSource().forEachFeature(function (feat) {
            attributeArray.push(feat.get(attribute));
        });
        var max = Math.max.apply(null, attributeArray);
        var min = Math.min.apply(null, attributeArray);
        var step = (max - min) / 5;
        var colors = this.graduatedColorFactory(5, [254, 240, 217], [179, 0, 0]);
        layer.setStyle(function (feature, res) {
            var property = feature.get(attribute);
            var color = property < min + step * 1 ? colors[0] :
                property < min + step * 2 ? colors[1] :
                    property < min + step * 3 ? colors[2] :
                        property < min + step * 4 ? colors[3] : colors[4];
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: [0, 0, 0, 1],
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: color
                })
            });
            return [style];
        });
    }
};
layerTree.prototype.graduatedColorFactory = function (intervals, rgb1, rgb2) {
    var colors = [];
    var step = intervals - 1;
    var redStep = (rgb2[0] - rgb1[0]) / step;
    var greenStep = (rgb2[1] - rgb1[1]) / step;
    var blueStep = (rgb2[2] - rgb1[2]) / step;
    for (var i = 0; i < step; i += 1) {
        var red = Math.ceil(rgb1[0] + redStep * i);
        var green = Math.ceil(rgb1[1] + greenStep * i);
        var blue = Math.ceil(rgb1[2] + blueStep * i);
        colors.push([red, green, blue, 1]);
    }
    colors.push([rgb2[0], rgb2[1], rgb2[2], 1]);
    return colors;
};
layerTree.prototype.styleCategorized = function (layer, attribute) {
    var attributeArray = [];
    var colorArray = [];
    var randomColor;
    var color = new RColor;

    layer.getSource().forEachFeature(function (feat) {
        var property = feat.get(attribute).toString();
        if (attributeArray.indexOf(property) === -1) {
            attributeArray.push(property);
            do {
                randomColor = this.randomHexColor();
                // randomColor = color.get(true, 0.8);
            } while (colorArray.indexOf(randomColor) !== -1);
            colorArray.push(randomColor);
        }
    }, this);
    layer.setStyle(function (feature, res) {
        var index = attributeArray.indexOf(feature.get(attribute).toString());
        var style = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: [0, 0, 0, 1],
                width: 1
            }),
            fill: new ol.style.Fill({
                color: colorArray[index]
            })
        });
        return [style];
    });
};
layerTree.prototype.randomHexColor = function () {
    var num = Math.floor(Math.random() * 16777215).toString(16);
    return '#' + String.prototype.repeat.call('0', 6 - num.length) + num;
};

ol.layer.Vector.prototype.buildHeaders = function () {
    var oldHeaders = this.get('headers') || {};
    var headers = {};
    var features = this.getSource().getFeatures();
    for (var i = 0; i < features.length; i += 1) {
        var attributes = features[i].getProperties();
        for (var j in attributes) {
            if (typeof attributes[j] !== 'object' && !(j in headers)) {
                headers[j] = attributes[j];
            } else if (j in oldHeaders) {
                headers[j] = oldHeaders[j];
            }
        }
    }
    this.set('headers', headers);
    return this;
};

ol.control.Interaction = function (opt_options) {
    var options = opt_options || {};
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-unselectable ol-control';
    var controlButton = document.createElement('button');
    controlButton.textContent = options.label || 'I';
    controlButton.title = 'Add ' + options.feature_type || 'Custom interaction';
    controlDiv.appendChild(controlButton);

    var _this = this;
    controlButton.addEventListener('click', function () {
        if (_this.get('interaction').getActive()) {
            _this.set('active', false);
        } else {
            _this.set('active', true);
        }
    });
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });

    this.setDisabled = function (bool) {
        if (typeof bool === 'boolean') {
            controlButton.disabled = bool;
            return this;
        }
    };

    var interaction = options.interaction;

    this.setProperties({
        interaction: interaction,
        active: false,
        button_type: 'radio',
        feature_type: options.feature_type,
        destroyFunction: function (evt) {
            if (evt.element === _this) {
                this.removeInteraction(_this.get('interaction'));
            }
        }
    });
    this.on('change:active', function () {
        this.get('interaction').setActive(this.get('active'));
        if (this.get('active')) {
            controlButton.classList.add('active');
            $(document).on('keyup', function (evt) {
                if (evt.keyCode == 189 || evt.keyCode == 109) {
                    _this.get('interaction').removeLastPoint();
                } else if (evt.keyCode == 27) {
                    _this.set('active', false);
                }
            });
        } else {
            $(document).off('keyup');
            controlButton.classList.remove('active');
        }
    }, this);
};
ol.inherits(ol.control.Interaction, ol.control.Control);

ol.control.Interaction.prototype.setMap = function (map) {
    ol.control.Control.prototype.setMap.call(this, map);
    var interaction = this.get('interaction');
    if (map === null) {
        ol.Observable.unByKey(this.get('eventId'));
    } else if (map.getInteractions().getArray().indexOf(interaction) === -1) {
        map.addInteraction(interaction);
        interaction.setActive(false);
        this.set('eventId', map.getControls().on('remove', this.get('destroyFunction'), map));
    }
};

var toolBar = function (options) {
    'use strict';
    if (!(this instanceof toolBar)) {
        throw new Error('toolBar must be constructed with the new keyword.');
    } else if (typeof options === 'object' && options.map && options.target && options.layertree) {
        if (!(options.map instanceof ol.Map)) {
            throw new Error('Please provide a valid OpenLayers 3 map object.');
        }
        this.map = options.map;
        this.toolbar = document.getElementById(options.target);
        this.layertree = options.layertree;
        this.controls = new ol.Collection();
        this.bitA = 0;
        this.bitB = 0;
        this.activeControl = undefined;
        this.active = false;
        this.controlEventEmitter = new ol.Observable();
        this.addedFeature = null;
    } else {
        throw new Error('Invalid parameter(s) provided.');
    }
};
toolBar.prototype.addControl = function (control) {
    if (!(control instanceof ol.control.Control)) {
        throw new Error('Only controls can be added to the toolbar.');
    }
    if (control.get('button_type') === 'radio') {
        control.on('change:active', function () {
            if (!(this.bitA | this.bitB)) {
                this.activeControl = control;
                this.active = true;
                this.controlEventEmitter.changed()
            }
            this.bitA ^= 1;
            if (control.get('active')) {
                this.controls.forEach(function (controlToDisable) {
                    if (controlToDisable.get('button_type') === 'radio' && controlToDisable !== control) {
                        controlToDisable.set('active', false);
                    }
                });
            }
            this.bitB ^= 1;
            if (!(this.bitA | this.bitB)) {
                this.activeControl = undefined;
                this.active = false;
                this.controlEventEmitter.changed()
            }
        }, this);
    }
    control.setTarget(this.toolbar);
    this.controls.push(control);
    this.map.addControl(control);
    return this;
};
toolBar.prototype.removeControl = function (control) {
    this.controls.remove(control);
    this.map.removeControl(control);
    return this;
};
toolBar.prototype.addDrawToolBar = function () {
    var layertree = this.layertree;

    this.drawControls = new ol.Collection();

    var drawPoint = new ol.control.Interaction({
        label: ' ',
        feature_type: 'generic',
        geometry_type: 'Point',
        className: 'ol-addpoint ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'Point'}), 'generic')
    }).setDisabled(true);
    this.drawControls.push(drawPoint);
    var drawLineString = new ol.control.Interaction({
        label: ' ',
        feature_type: 'generic',
        geometry_type: 'LineString',
        className: 'ol-addline ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'LineString'}), 'generic')
    }).setDisabled(true);
    this.drawControls.push(drawLineString);
    var drawPolygon = new ol.control.Interaction({
        label: ' ',
        feature_type: 'generic',
        geometry_type: 'Polygon',
        className: 'ol-addpolygon ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'Polygon'}), 'generic')
    }).setDisabled(true);
    this.drawControls.push(drawPolygon);

    var drawAOR = new ol.control.Interaction({
        label: ' ',
        feature_type: 'aor',
        geometry_type: 'Polygon',
        className: 'ol-addaor ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'Polygon'}), 'aor')
    }).setDisabled(true);
    this.drawControls.push(drawAOR);
    var drawBuilding = new ol.control.Interaction({
        label: ' ',
        feature_type: 'building',
        geometry_type: 'Polygon',
        className: 'ol-addbuilding ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'Polygon'}), 'building')
    }).setDisabled(true);
    this.drawControls.push(drawBuilding);
    var drawHerbage = new ol.control.Interaction({
        label: ' ',
        feature_type: 'herbage',
        geometry_type: 'Polygon',
        className: 'ol-addherbage ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'Polygon'}), 'herbage')
    }).setDisabled(true);
    this.drawControls.push(drawHerbage);
    var drawWater = new ol.control.Interaction({
        label: ' ',
        feature_type: 'water',
        geometry_type: 'Polygon',
        className: 'ol-addwater ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'Polygon'}), 'water')
    }).setDisabled(true);
    this.drawControls.push(drawWater);
    var drawWall = new ol.control.Interaction({
        label: ' ',
        feature_type: 'wall',
        geometry_type: 'LineString',
        className: 'ol-addwall ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'LineString'}), 'wall')
    }).setDisabled(true);
    this.drawControls.push(drawWall);
    var drawRoad = new ol.control.Interaction({
        label: ' ',
        feature_type: 'road',
        geometry_type: 'LineString',
        className: 'ol-addroad ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'LineString'}), 'road')
    }).setDisabled(true);
    this.drawControls.push(drawRoad);

    var drawCamera = new ol.control.Interaction({
        label: ' ',
        feature_type: 'camera',
        geometry_type: 'Point',
        className: 'ol-addcamera ol-unselectable ol-control',
        interaction: this.handleEvents(new ol.interaction.Draw({type: 'Point'}), 'camera')
    }).setDisabled(true);
    this.drawControls.push(drawCamera);

    this.activeFeatures = new ol.Collection();

    layertree.selectEventEmitter.on('change', function () {
        var layer;
        if (layertree.selectedLayer) {
            layer = layertree.getLayerById(layertree.selectedLayer.id);
        } else {
            layer = null;
        }

        this.drawControls.forEach(function (control) {
            control.set('active', false);
            control.setDisabled(true);
        });
        if (layer instanceof ol.layer.Vector) { // feature layer.

            console.log('*****************');
            console.log(layer.get('type'));
            layertree.identifyLayer(layer);
            var layerType = layer.get('type');
            console.log(layerType);

            if (layerType === 'aor' || layerType === 'tobject') {
                drawAOR.setDisabled(false);
            }
            if (layerType === 'wall' || layerType === 'tobject') {
                drawWall.setDisabled(false);
            }
            if (layerType === 'road' || layerType === 'tobject') {
                drawRoad.setDisabled(false);
            }
            if (layerType === 'water' || layerType === 'tobject') {
                drawWater.setDisabled(false);
            }
            if (layerType === 'herbage' || layerType === 'tobject') {
                drawHerbage.setDisabled(false);
            }
            if (layerType === 'building' || layerType === 'tobject') {
                drawBuilding.setDisabled(false);
            }
            if (layerType === 'point' || layerType === 'generic' || layerType === 'geomcollection') {
                drawPoint.setDisabled(false);
            }
            if (layerType === 'linestring' || layerType === 'generic' || layerType === 'geomcollection') {
                drawLineString.setDisabled(false);
            }
            if (layerType === 'polygon' || layerType === 'generic' || layerType === 'geomcollection') {
                drawPolygon.setDisabled(false);
            }
            if (layerType === 'camera') {
                drawCamera.setDisabled(false);
            }
            var _this = this;
            setTimeout(function () {
                _this.activeFeatures.clear();
                _this.activeFeatures.extend(layer.getSource().getFeatures());
            }, 0);
        }
    }, this);

    this.drawControls.forEach(function (control) {
        this.addControl(control)
    }, this);

    // this.addControl(drawAOR).addControl(drawBuilding).addControl(drawHerbage)
    //     .addControl(drawWater).addControl(drawWall).addControl(drawRoad)
    //     .addControl(drawPolygon).addControl(drawLine).addControl(drawPoint);
    return this;
};
toolBar.prototype.handleEvents = function (interaction, feature_type) {

    interaction.on('drawend', function (evt) {
        geom = evt.feature.getGeometry();
        if (geom.getType().endsWith('Polygon') && !(isPolyValid(geom))) {
            return;
        } else {
            var id = FID.gen();

            evt.feature.setId(id);
            evt.feature.set('type', feature_type);
            evt.feature.set('name', feature_type.capitalizeFirstLetter() + '-' + id);

            //TODO: The feature shouldn't be added to the layer yet.
            //TODO: Only after deselect should the layer be updated.
            //TODO: Need to Check.
            // var selectedLayer = this.layertree.getLayerById(this.layertree.selectedLayer.id);
            // selectedLayer.getSource().addFeature(evt.feature);
            // this.activeFeatures.push(evt.feature);

            this.addedFeature = evt.feature;
        }
        this.activeControl.set('active', false);
    }, this);
    return interaction;
};

ol.interaction.ChooseHole = function (opt_options) {

    this.emitter = new ol.Observable();

    ol.interaction.Pointer.call(this, {
        handleDownEvent: function (evt) {
            this.set('deleteCandidate', evt.map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    if (this.get('holes').getArray().indexOf(feature) !== -1) {
                        return feature;
                    }
                }, this
            ));
            return !!this.get('deleteCandidate');
        },
        handleUpEvent: function (evt) {
            evt.map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    if (feature === this.get('deleteCandidate')) {
                        layer.getSource().removeFeature(feature);
                        this.get('holes').remove(feature);
                        this.set('hole', feature);
                    }
                }, this
            );
            this.set('deleteCandidate', null);
            this.emitter.changed();
        }
    });
    this.setProperties({
        holes: opt_options.holes,
        deleteCandidate: null
    });
};
ol.inherits(ol.interaction.ChooseHole, ol.interaction.Pointer);

var featureInteractor = function (options) {
    'use strict';
    if (!(this instanceof featureInteractor)) {
        throw new Error('interactor must be constructed with the new keyword.');
    } else if (typeof options === 'object' && options.map && options.layertree && options.toolbar && options.target) {
        if (!(options.map instanceof ol.Map)) {
            throw new Error('Please provide a valid OpenLayers 3 map object.');
        }
        this.map = options.map;
        this.layertree = options.layertree;
        this.toolbar = options.toolbar;
        this.createForm({target: options.target});
        this.wgs84Sphere = new ol.Sphere(6378137);
        this.highlight = undefined;
        var _this = this;
        this.featureOverlay = this.createFeatureOverlay();
        this.map.addLayer(this.featureOverlay);
        this.hoverDisplay = function (evt) {
            if (evt.dragging) return;
            var pixel = _this.map.getEventPixel(evt.originalEvent);
            var feature = _this.getFeatureAtPixel(pixel);
            _this.setMouseCursor(feature);
            _this.displayFeatureInfo(feature);
        };
        this.addInteractions();

        this.map.addInteraction(this.select);
        this.select.setActive(true);

        this.map.on('pointermove', this.hoverDisplay);
        this.map.addInteraction(this.modify);
        this.modify.setActive(false);

        document.getElementById('map').addEventListener('mouseleave', function () {
            if (_this.highlight) {
                _this.featureOverlay.getSource().removeFeature(_this.highlight);
                _this.highlight = undefined;
            }
        });

        this.autoselect = false;

    } else {
        throw new Error('Invalid parameter(s) provided.');
    }
};

featureInteractor.prototype.createOption = function (optionValue) {
    var option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    return option;
};
featureInteractor.prototype.removeContent = function (element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    return this;
};
featureInteractor.prototype.stopPropagationOnEvent = function (node, event) {
    node.addEventListener(event, function (evt) {
        evt.stopPropagation();
    });
    return node;
};

featureInteractor.prototype.createForm = function (options) {

    var _this = this;
    var featureeditor = document.getElementById(options.target);
    featureeditor.className = 'featureeditor';

    var form = document.createElement('form');
    form.className = 'form';
    form.id = 'featureproperties';
    form.style.display = 'none';

    form.appendChild(this.addLayerGeometry());

    var rowElem = document.createElement('div');
    rowElem.className = 'form-row';
    var attributeSpan = document.createElement('div');
    attributeSpan.className = 'form-label';
    attributeSpan.textContent = 'Geometry type: ';
    rowElem.appendChild(attributeSpan);
    var geometryType = document.createElement('div');
    geometryType.className = 'form-value';
    geometryType.id = "geometry-type";
    rowElem.appendChild(geometryType);
    form.appendChild(rowElem);

    var rowElem = document.createElement('div');
    rowElem.className = 'form-row';
    var attributeSpan = document.createElement('div');
    attributeSpan.className = 'form-label';
    attributeSpan.style.display = 'flex';
    var measureLabel = document.createElement('div');
    measureLabel.id = 'measure-label';
    measureLabel.textContent = 'Measure: ';
    attributeSpan.appendChild(measureLabel);
    var geodesic = document.createElement('input');
    geodesic.id = "geodesic";
    geodesic.type = "checkbox";
    geodesic.title = "Use geodesic measures";
    attributeSpan.appendChild(geodesic);
    rowElem.appendChild(attributeSpan);
    var measure = document.createElement('div');
    measure.id = 'measure-feature';
    rowElem.appendChild(measure);
    form.appendChild(rowElem);

    var rowElem = document.createElement('div');
    rowElem.className = 'form-row';
    var attributeSpan = document.createElement('div');
    attributeSpan.className = 'form-label';
    attributeSpan.textContent = 'Name: ';
    rowElem.appendChild(attributeSpan);
    var featureName = document.createElement('input');
    featureName.className = 'form-value';
    featureName.id = "feature-name";
    featureName.type = "text";
    rowElem.appendChild(featureName);
    form.appendChild(rowElem);

    var rowElem = document.createElement('div');
    rowElem.className = 'form-row';
    var attributeSpan = document.createElement('div');
    attributeSpan.className = 'form-label';
    attributeSpan.textContent = 'Hole: ';
    rowElem.appendChild(attributeSpan);
    rowElem.appendChild(this.createHoleButton("draw"));
    rowElem.appendChild(this.createHoleButton("delete"));
    form.appendChild(rowElem);

    var rowElem = document.createElement('div');
    rowElem.className = 'form-row';
    var attributeSpan = document.createElement('div');
    attributeSpan.className = 'form-label';
    attributeSpan.textContent = 'Feature type:';
    rowElem.appendChild(attributeSpan);
    var featureType = document.createElement('select');
    featureType.className = 'form-value';
    featureType.id = "feature-type";
    featureType.addEventListener('change', function () {
        _this.loadFeature(this.value);
    });

    rowElem.appendChild(featureType);
    form.appendChild(rowElem);

    var rowElem = document.createElement('div');
    rowElem.className = 'form-row';
    var attributeSpan = document.createElement('div');
    attributeSpan.className = 'form-label';
    attributeSpan.textContent = 'Sub Type: ';
    rowElem.appendChild(attributeSpan);
    var subType = document.createElement('select');
    subType.className = 'form-value';
    subType.id = "sub-type";
    rowElem.appendChild(subType);
    form.appendChild(rowElem);

    var rowElem = document.createElement('div');
    rowElem.className = 'form-row';
    var attributeSpan = document.createElement('div');
    attributeSpan.className = 'form-label';
    attributeSpan.textContent = 'Height: ';
    rowElem.appendChild(attributeSpan);
    var heightSlider = document.createElement('div');
    heightSlider.id = 'height-slider';
    noUiSlider.create(heightSlider, {
        start: null,
        connect: 'lower',
        behaviour: 'tap',
        range: {
            'min': 0,
            '25%': 1,
            '50%': 10,
            '75%': 100,
            'max': 1000
        }
    });

    var heightInput = document.createElement('input');
    heightInput.className = 'form-value';
    heightInput.id = 'height-input';
    heightInput.type = 'number';
    rowElem.appendChild(heightInput);
    form.appendChild(rowElem);

    // When the slider value changes, update the input and span
    heightSlider.noUiSlider.on('update', function (values, handle) {
        heightInput.value = values[handle];
    });
    // When the input changes, set the slider value
    heightInput.addEventListener('change', function () {
        heightSlider.noUiSlider.set(this.value);
    });

    var rowElem = document.createElement('div');
    rowElem.appendChild(heightSlider);
    form.appendChild(rowElem);


    var rowElem = document.createElement('div');
    rowElem.className = 'form-row';
    var attributeSpan = document.createElement('div');
    attributeSpan.className = 'form-label';
    attributeSpan.textContent = 'Thickness: ';
    rowElem.appendChild(attributeSpan);
    var thicknessSlider = document.createElement('div');
    thicknessSlider.id = 'thickness-slider';
    noUiSlider.create(thicknessSlider, {
        start: null,
        margin: 20,
        connect: 'lower',
        behaviour: 'tap',
        range: {'min': 0, 'max': 50}
    });

    var thicknessInput = document.createElement('input');
    thicknessInput.className = 'form-value';
    thicknessInput.id = 'thickness-input';
    thicknessInput.type = "number";
    rowElem.appendChild(thicknessInput);
    form.appendChild(rowElem);

    // When the slider value changes, update the input and span
    thicknessSlider.noUiSlider.on('update', function (values, handle) {
        thicknessInput.value = values[handle];
    });
    // When the input changes, set the slider value
    thicknessInput.addEventListener('change', function () {
        thicknessSlider.noUiSlider.set(this.value);
    });

    var rowElem = document.createElement('div');
    rowElem.appendChild(thicknessSlider);
    form.appendChild(rowElem);


    // var table = document.createElement('table');
    // table.appendChild(this.addGeometryType());
    // table.appendChild(this.addName());
    // table.appendChild(this.addDrawHoleButton());
    // table.appendChild(this.addDeleteHoleButton());
    // table.appendChild(this.addFeatureType());
    // table.appendChild(this.addSubType());
    // table.appendChild(this.addHeight());
    // table.appendChild(this.addThickness());
    // table.appendChild(this.addLength(geometry_type));
    // table.appendChild(this.addArea(geometry_type));
    // form.appendChild(table);

    featureeditor.appendChild(form);
    return this;
};

featureInteractor.prototype.createLabel = function (label) {
    var td = document.createElement('td');
    var l = document.createTextNode(label);
    td.appendChild(l);
    return td;
};
featureInteractor.prototype.createInput = function (name, type) {
    var td = document.createElement('td');
    var element = document.createElement('input');
    element.name = name;
    element.type = type;
    element.required = true;
    td.appendChild(element);
    return td;
};
featureInteractor.prototype.createHoleButton = function (label) {
    var buttonElem = document.createElement('input');
    buttonElem.id = label + '-hole';
    buttonElem.type = "button";
    buttonElem.value = label.capitalizeFirstLetter();
    var _this = this;

    switch (label) {
        case 'draw':
            buttonElem.title = 'Draw a hole in the selected feature';
            buttonElem.addEventListener('click', function () {
                _this.drawHole();
            });
            return buttonElem;
        case 'delete':
            buttonElem.title = 'Delete a hole from the selected feature';
            buttonElem.addEventListener('click', function () {
                _this.deleteHole();
            });
            return buttonElem;
        default:
            return false;
    }
};
featureInteractor.prototype.createMenu = function (name, id) {
    var td = document.createElement('td');
    var element = document.createElement('select');
    element.name = name;
    element.type = "text";
    element.id = id;
    td.appendChild(element);
    return td;
};

featureInteractor.prototype.addLayerGeometry = function () {
    // readonly
    var p = document.createElement('p');
    p.appendChild(document.createTextNode("layer Geometry:"));
    return p
};
featureInteractor.prototype.addGeometryType = function () {
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Geometry type:"));
    tr.appendChild(this.createInput("geometry_type", "text"));
    return tr;
};
featureInteractor.prototype.addName = function () {
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Name:"));
    tr.appendChild(this.createInput("name", "text"));
    return tr;
};
featureInteractor.prototype.addDrawHoleButton = function () {
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Draw:"));
    // tr.appendChild(this.createButton("draw", "hole"));
    tr.appendChild(this.createButton2("drawhole", "Draw Hole", "drawhole"));
    return tr;
};
featureInteractor.prototype.addDeleteHoleButton = function () {
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Delete:"));
    // tr.appendChild(this.createButton("delete", "hole"));
    tr.appendChild(this.createButton2("deletehole", "Delete Hole", "deletehole"));
    return tr;
};
featureInteractor.prototype.addFeatureType = function () {
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Feature type:"));
    tr.appendChild(this.createMenu("feature_type", "feature-type"));
    return tr;
};
featureInteractor.prototype.addSubType = function () {
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Sub type:"));
    tr.appendChild(this.createMenu("subtype", ""));
    return tr;
};
featureInteractor.prototype.addHeight = function () {
    // add slider.
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Height:"));
    tr.appendChild(this.createInput("height", "number"));
    return tr;
};
featureInteractor.prototype.addThickness = function () {
    // add slider
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Thickness:"));
    tr.appendChild(this.createInput("thickness", "number"));
    return tr;
};
featureInteractor.prototype.addCoordsLat = function () {
    // readonly
    // only for Points (not MultiPoints)
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Lat:"));
    tr.appendChild(this.createInput("lattitude", "number"));
    return tr;
};
featureInteractor.prototype.addCoordsLon = function () {
    // readonly
    // only for Points (not MultiPoints)
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Lon:"));
    tr.appendChild(this.createInput("longitude", "number"));
    return tr;
};
featureInteractor.prototype.addLength = function () {
    // readonly
    // only for Lines and LineStrings
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Length:"));
    tr.appendChild(this.createInput("length", "text"));
    return tr;
};
featureInteractor.prototype.addArea = function () {
    // readonly
    // only for Polygons and MultiPolygons
    var tr = document.createElement('tr');
    tr.appendChild(this.createLabel("Area:"));
    tr.appendChild(this.createInput("area", "text"));
    return tr;
};

featureInteractor.prototype.drawHole = function () {
    var holeStyle = [
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.8)',
                lineDash: [3, 9],
                width: 3
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0)'
            })
        }),
        new ol.style.Style({
            image: new ol.style.RegularShape({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 0, 0, 0.5)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                points: 4,
                radius: 6,
                angle: Math.PI / 4
            })
        })
    ];

    var currFeat = this.select.getFeatures().getArray()[0];
    var geomTypeSelected = currFeat.getGeometry().getType();
    var isMultiPolygon = geomTypeSelected === 'MultiPolygon';
    if (!(geomTypeSelected.endsWith("Polygon"))) {
        alert("Only Polygon and MultiPolygon geometries can have holes. Not " + geomTypeSelected);
        return;
    }
    // Clone and original selected geometry so we can test new vertex points against it in the geometryFunction.
    var origGeom = currFeat.getGeometry().clone();
    var currGeom;
    var polyindex = 0;
    var refGeom;
    if (isMultiPolygon) {
        var pickPoly = function (feature) {
            var points = feature.getGeometry().getCoordinates(false)[0];
            var polygons = origGeom.getPolygons();
            for (var i = 0; i < polygons.length; i++) {
                if (isPointInPoly(polygons[i], points[0])) {
                    polyindex = i;
                }
            }
        }
    }

    var vertsCouter = 0; //this is the number of vertices drawn on the ol.interaction.Draw(used in the geometryFunction)

    //create a hole draw interaction
    var source = new ol.source.Vector();
    var holeDraw = new ol.interaction.Draw({
        source: source,
        type: 'Polygon',
        style: holeStyle,
        condition: function (evt) {
            if (evt.type === 'pointerdown' || ol.events.condition.singleClick(evt)) {
                if (exists(refGeom)) {
                    return (isPointInPoly(refGeom, evt.coordinate))
                } else {
                    return (isPointInPoly(origGeom, evt.coordinate))
                }
            }
        }
    });

    var deleteHoleIsDisabled = document.getElementById('delete-hole').disabled;
    document.getElementById('draw-hole').disabled = true;
    document.getElementById('delete-hole').disabled = true;
    this.map.un('pointermove', this.hoverDisplay);
    this.select.setActive(false);
    this.modify.setActive(false);
    // this.translate.setActive(true);
    this.map.addInteraction(holeDraw);

    var _this = this;

    var finishHole = function () {
        _this.map.removeInteraction(holeDraw);
        _this.modify.setActive(true);
        _this.select.setActive(true);
        // _this.translate.setActive(true);
        _this.map.on('pointermove', _this.hoverDisplay);
        document.getElementById('draw-hole').disabled = false;
        $(document).off('keyup')
    };

    $(document).on('keyup', function (evt) {
        if (evt.keyCode == 189 || evt.keyCode == 109) {
            if (vertsCouter === 1) {
                currGeom.setCoordinates(origGeom.getCoordinates());
                document.getElementById('delete-hole').disabled = deleteHoleIsDisabled;
                finishHole()
            } else {
                holeDraw.removeLastPoint();
            }
        } else if (evt.keyCode == 27) {
            currGeom.setCoordinates(origGeom.getCoordinates());
            document.getElementById('delete-hole').disabled = deleteHoleIsDisabled;
            finishHole()
        }
    });

    holeDraw.on('drawstart', function (evt) {
        var feature = evt.feature; // the hole feature
        var ringAdded = false; //init boolean var to clarify whether drawn hole has already been added or not
        var setCoords;
        var polyCoords;

        currGeom = currFeat.getGeometry();
        if (isMultiPolygon) {
            pickPoly(feature);
            refGeom = currGeom.getPolygon(polyindex);
        } else {
            refGeom = currFeat.getGeometry().clone();
        }

        //set the change feature listener so we get the hole like visual effect
        feature.on('change', function (e) {
            //get draw hole feature geometry
            var currCoords = feature.getGeometry().getCoordinates(false)[0];
            vertsCouter = currCoords.length;

            if (isMultiPolygon) {
                if (currCoords.length >= 3 && ringAdded === false) {
                    polyCoords = currGeom.getCoordinates()[polyindex];
                    polyCoords.push(currCoords);
                    setCoords = currGeom.getCoordinates();
                    setCoords.splice(polyindex, 1, polyCoords);
                    currGeom.setCoordinates(setCoords);
                    ringAdded = true;
                } else if (currCoords.length >= 3 && ringAdded === true) {
                    polyCoords = currGeom.getCoordinates()[polyindex];
                    polyCoords.pop();
                    polyCoords.push(currCoords);
                    setCoords = currGeom.getCoordinates();
                    setCoords.splice(polyindex, 1, polyCoords);
                    currGeom.setCoordinates(setCoords);
                } else if (currCoords.length == 2 && ringAdded === true) {
                    polyCoords = currGeom.getCoordinates()[polyindex];
                    polyCoords.pop();
                    setCoords = currGeom.getCoordinates();
                    setCoords.splice(polyindex, 1, polyCoords);
                    currGeom.setCoordinates(setCoords);
                    ringAdded = false;
                } else if (currCoords.length == 2 && !(exists(polyindex))) {
                    pickPoly(feature);
                    refGeom = currGeom.getPolygon(polyindex)
                } else if (currCoords.length == 1 && exists(polyindex)) {
                    currFeat = null;
                    refGeom = null;
                    polyindex = null;
                }
            } else {
                //if hole has 3 or more coordinate pairs, add the interior ring to feature
                if (currCoords.length >= 3 && ringAdded === false) {
                    currGeom.appendLinearRing(new ol.geom.LinearRing(currCoords));
                    ringAdded = true;
                } else if (currCoords.length >= 3 && ringAdded === true) { //if interior ring has already been added we need to remove it and add back the updated one
                    setCoords = currGeom.getCoordinates();
                    setCoords.pop(); //pop the dirty hole
                    setCoords.push(currCoords); //push the updated hole
                    currGeom.setCoordinates(setCoords); //update currGeom with new coordinates
                } else if (currCoords.length == 2 && ringAdded === true) {
                    setCoords = currGeom.getCoordinates();
                    setCoords.pop();
                    currGeom.setCoordinates(setCoords);
                    ringAdded = false;
                }
            }
        });
    });

    // Check if the hole is valid and remove the hole interaction
    holeDraw.on('drawend', function (evt) {

        if (isMultiPolygon) {
            var rings = currGeom.getCoordinates()[polyindex];
            var holecoords = rings.pop();
        } else {
            var rings = currGeom.getCoordinates();
            var holecoords = rings.pop();
        }

        var isValid = isPolyValid(new ol.geom.Polygon([holecoords]));
        var isInside = doesPolyCoverHole(origGeom, holecoords);
        if (isValid && isInside) {
            source.once('addfeature', function (e) {
                var featuresGeoJSON = new ol.format.GeoJSON().writeFeatures(
                    [currFeat], {featureProjection: 'EPSG:3857'}
                );
                // console.log(featuresGeoJSON)
            });
        } else {
            currGeom.setCoordinates(origGeom.getCoordinates());
        }

        this.autoselect = true;
        document.getElementById('delete-hole').disabled = false;
        finishHole();
    }, this);
};
featureInteractor.prototype.deleteHole = function () {
    var holeStyle = [
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.8)',
                lineDash: [10, 10],
                width: 3
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 1.0)'
            })
        })
    ];

    var getPolyHoles = function (poly) {
        var skip = true;
        var holes = [];
        poly.getLinearRings().forEach(function (ring) {
            if (skip) { // assume the first ring is the exterior ring.
                skip = false;
            } else {
                feature = new ol.Feature(new ol.geom.Polygon([ring.getCoordinates()]));
                holes.push(feature);
            }
        });
        return holes;
    };

    var getHoles = function (currGeom) {
        var holefeats = new ol.Collection();
        var polyholes;
        if (currGeom.getType() === 'MultiPolygon') {
            currGeom.getPolygons().forEach(function (poly) {
                polyholes = getPolyHoles(poly);
                holefeats.extend(polyholes)
            })
        } else {
            polyholes = getPolyHoles(currGeom);
            holefeats.extend(polyholes)
        }
        return holefeats;
    };

    var testCoords = function (poly, coord) {
        var newPoly = null;
        var skip = true;
        var found = false;
        console.log(coord);
        poly.getLinearRings().forEach(function (ring) {
            if (skip) { // assume the first ring is the exterior ring.
                newPoly = new ol.geom.Polygon([ring.getCoordinates()]);
                skip = false;
            } else {
                var rcoord = ring.getFirstCoordinate();
                console.log(rcoord);
                if (rcoord[0] !== coord[0] || rcoord[1] !== coord[1]) {
                    newPoly.appendLinearRing(ring);
                } else {
                    found = true;
                }
            }
        });
        return found ? newPoly : poly;
    };

    var removeHole = function (feature) {
        console.log("---------------------");
        var geom = feature.getGeometry();
        var newGeom = new ol.geom.MultiPolygon(null);
        if (currGeom.getType() === 'MultiPolygon') {
            currGeom.getPolygons().forEach(function (poly) {
                var newPoly = testCoords(poly, geom.getFirstCoordinate());
                newGeom.appendPolygon(newPoly);
            });
        } else {
            newGeom = testCoords(currGeom, geom.getFirstCoordinate());
        }
        currGeom.setCoordinates(newGeom.getCoordinates());
    };

    var _this = this;
    var finishHole = function () {
        _this.autoselect = true;
        _this.map.removeInteraction(chooseHole);
        _this.map.removeLayer(holeOverlay);
        _this.modify.setActive(true);
        _this.select.setActive(true);
        // _this.translate.setActive(true);
        _this.map.on('pointermove', _this.hoverDisplay);
        document.getElementById('draw-hole').disabled = false;
        document.getElementById('delete-hole').disabled = (holeFeats.getArray().length == 0);
        $(document).off('keyup')
    };
    $(document).on('keyup', function (evt) {
        if (evt.keyCode == 27) {
            finishHole()
        }
    });

    document.getElementById('draw-hole').disabled = true;
    document.getElementById('delete-hole').disabled = true;
    this.map.un('pointermove', this.hoverDisplay);
    this.select.setActive(false);
    this.modify.setActive(false);

    var feature = null;
    var currFeat = this.select.getFeatures().getArray()[0];
    var currGeom = currFeat.getGeometry();
    var holeFeats = getHoles(currGeom);

    var source = new ol.source.Vector({
        features: holeFeats
    });
    var holeOverlay = new ol.layer.Vector({
        source: source,
        type: 'overlay',
        style: holeStyle,
        zIndex: 9999
    });
    // holeOverlay.getSource().addFeatures(holeFeats);
    this.map.addLayer(holeOverlay);

    var chooseHole = new ol.interaction.ChooseHole({
        holes: holeFeats
    });
    this.map.addInteraction(chooseHole);

    chooseHole.emitter.on('change', function () {
        feature = chooseHole.get('hole');
        if (feature !== null) {
            removeHole(feature);
        }
        finishHole();
    });
};
featureInteractor.prototype.formatArea = function (geom, sourceProj, sphere) {

    //  var getGeodesicArea = function (poly) {
    //     var area = 0;
    //     var isExterior = true;
    //     poly.getLinearRings().forEach( function (ring) {
    //         if (isExterior) { // assume the first ring is the exterior ring.
    //             area += Math.abs(sphere.geodesicArea(ring.getCoordinates()));
    //             isExterior = false;
    //         } else {
    //             area -= Math.abs(sphere.geodesicArea(ring.getCoordinates()));
    //         }
    //     });
    //     return area;
    // };
    //
    // var area;
    // if (document.getElementById('geodesic').checked) {
    //     // var wgs84Sphere = new ol.Sphere(6378137);
    //     var geom = polygon.clone().transform(sourceProj, 'EPSG:4326');
    //     // var coordinates = geom.getLinearRing(0).getCoordinates();
    //     // area = Math.abs(sphere.geodesicArea(coordinates));
    //     area = 0;
    //     if (geom.getType() === 'MultiPolygon') {
    //         geom.getPolygons().forEach(function (poly) {
    //             area += getGeodesicArea(poly);
    //         });
    //     } else {
    //         area = getGeodesicArea(geom);
    //     }
    // } else {
    //     area = polygon.getArea();
    // }


    var getPolygonArea = function (polygon) {
        var area = 0;
        var area0 = 0;
        var isExterior = true;
        if (document.getElementById('geodesic').checked) {
            var poly = polygon.clone().transform(sourceProj, 'EPSG:4326');
            poly.getLinearRings().forEach(function (ring) {
                if (isExterior) { // assume the first ring is the exterior ring.
                    area += Math.abs(sphere.geodesicArea(ring.getCoordinates()));
                    isExterior = false;
                } else {
                    area -= Math.abs(sphere.geodesicArea(ring.getCoordinates()));
                }
            });
        } else {
            area = polygon.getArea();
        }
        return area;
    };

    var area = 0;
    if (geom.getType() === 'MultiPolygon') {
        geom.getPolygons().forEach(function (poly) {
            area += getPolygonArea(poly)
        })
    } else {
        area = getPolygonArea(geom)
    }

    var output;
    var squared = "2";
    if (area > 100000) {
        output = (Math.round(area / 1000000 * 100) / 100) + " km" + squared.sup();
    } else {
        output = (Math.round(area * 100) / 100) + " m" + squared.sup();
    }
    return output;
};
featureInteractor.prototype.formatLength = function (geom, sourceProj, sphere) {

    var getLineStringLength = function (line) {
        var length = 0;
        if (document.getElementById('geodesic').checked) {
            var coordinates = line.clone().transform(sourceProj, 'EPSG:4326').getCoordinates();
            for (var i = 0; i < coordinates.length - 1; i++) {
                length += sphere.haversineDistance(coordinates[i], coordinates[i + 1]);
            }
        } else {
            length = line.getLength();
        }
        return length;
    };

    var length = 0;
    if (geom.getType() === 'MultiLineString') {
        geom.getLineStrings().forEach(function (line) {
            length += getLineStringLength(line)
        })
    } else {
        length = getLineStringLength(geom)
    }
    var output;
    if (length > 1000) {
        output = (Math.round(length / 1000 * 100) / 100) + ' km';
    } else {
        output = (Math.round(length * 100) / 100) + ' m';
    }
    return output;
};
featureInteractor.prototype.formatPosition = function (point, sourceProj, sphere) {
    var geom = point.clone().transform(sourceProj, 'EPSG:4326');
    var coords = geom.getCoordinates();
    var coord_x = coords[0].toFixed(6);
    var coord_y = coords[1].toFixed(6);
    return coord_x + ', ' + coord_y;
};

featureInteractor.prototype.activateForm = function (feature) {

    var _this = this;
    document.getElementById('featureproperties').style.display = 'block';

    var geometry_type = document.getElementById('geometry-type');
    geometry_type.innerHTML = feature.getGeometry().getType();


    var measureLabel = document.getElementById('measure-label');
    var measure;
    if (feature.getGeometry() instanceof ol.geom.Polygon || feature.getGeometry() instanceof ol.geom.MultiPolygon) {
        measureLabel.innerHTML = 'Area:';
        measure = this.formatArea;
    } else if (feature.getGeometry() instanceof ol.geom.Circle) {
        measureLabel.innerHTML = 'Area:';
        measure = this.formatArea;
    } else if (feature.getGeometry() instanceof ol.geom.LineString || feature.getGeometry() instanceof ol.geom.MultiLineString) {
        measureLabel.innerHTML = 'Length:';
        measure = this.formatLength;
    } else if (feature.getGeometry() instanceof ol.geom.Point) {
        measureLabel.innerHTML = 'Lon, Lat';
        measure = this.formatPosition;
    }
    var measureValue = document.getElementById('measure-feature');
    measureValue.innerHTML = measure(feature.getGeometry(), this.map.getView().getProjection(), this.wgs84Sphere);
    this.geometrylistener = feature.getGeometry().on('change', function (evt) {
        measureValue.innerHTML = measure(evt.target, _this.map.getView().getProjection(), _this.wgs84Sphere);
    });
    this.geodesiclistener = function () {
        measureValue.innerHTML = measure(_this.geometrylistener.target, _this.map.getView().getProjection(), _this.wgs84Sphere);
    };
    document.getElementById('geodesic').addEventListener('change', this.geodesiclistener);


    document.getElementById('feature-name').value = feature.get('name');
    document.getElementById('feature-name').disabled = false;

    document.getElementById('draw-hole').disabled = true;
    document.getElementById('delete-hole').disabled = true;
    if (feature.getGeometry().getType().endsWith('Polygon')) {
        document.getElementById('draw-hole').disabled = false;
        if (feature.getGeometry().getType() === 'MultiPolygon') {
            for (var i = 0; i < feature.getGeometry().getPolygons().length; i++)
                if (feature.getGeometry().getPolygon(i).getLinearRingCount() > 1) {
                    document.getElementById('delete-hole').disabled = false;
                }
        } else if (feature.getGeometry().getLinearRingCount() > 1) {
            document.getElementById('delete-hole').disabled = false;
        }
    }

    for (var key in tobjectProperties) {
        if (feature.getGeometry().getType().endsWith(tobjectProperties[key]["geometry_type"])) {
            document.getElementById('feature-type').appendChild(this.createOption(key));
        }
    }
    document.getElementById('feature-type').appendChild(this.createOption('generic'));

    var feature_type = feature.get('type');
    if (!(feature_type && feature_type in tobjectProperties)) {
        feature_type = 'generic';
    }

    document.getElementById('feature-type').value = feature_type;

    var feature_properties = tobjectProperties[feature_type];
    if (feature_properties['subtype']) {
        feature_properties['subtype'].forEach(function (sub_type) {
            document.getElementById('sub-type').appendChild(this.createOption(sub_type));
        }, this);
        if (feature.get('subtype')) {
            document.getElementById('sub-type').value = feature.get('subtype');
        }
        document.getElementById('sub-type').disabled = false;
    } else {
        document.getElementById('sub-type').disabled = true;
    }

    var heightinput = document.getElementById('height-input');
    var heightslider = document.getElementById('height-slider');
    if (feature.get('height')) {
        heightinput.disabled = false;
        heightinput.value = feature.get('height');
        heightslider.removeAttribute('disabled');
        heightslider.noUiSlider.set(feature.get('height'));
    } else if (feature_properties['height']) {
        heightinput.disabled = false;
        heightinput.value = feature_properties['height'];
        heightslider.removeAttribute('disabled');
        heightslider.noUiSlider.set(feature_properties['height']);
    } else {
        heightinput.disabled = true;
        heightslider.setAttribute('disabled', true);
    }

    var thicknessinput = document.getElementById('thickness-input');
    var thicknessslider = document.getElementById('thickness-slider');
    if (feature.get('thickness')) {
        thicknessinput.disabled = false;
        thicknessinput.value = feature.get('thickness');
        thicknessslider.removeAttribute('disabled');
        thicknessslider.noUiSlider.set(feature.get('thickness'));
    } else if (feature_properties['thickness']) {
        thicknessinput.disabled = false;
        thicknessinput.value = feature_properties['thickness'];
        thicknessslider.removeAttribute('disabled');
        thicknessslider.noUiSlider.set(feature_properties['thickness']);
    } else {
        thicknessinput.disabled = true;
        thicknessslider.noUiSlider.set(null);
        thicknessslider.setAttribute('disabled', true);
    }
};
featureInteractor.prototype.loadFeature = function (feature_type) {
    console.log(feature_type);

    var feature_properties = tobjectProperties[feature_type];

    var geometry_type = document.getElementById('geometry-type');
    var feature_name = document.getElementById('feature-name');
    for (var key in tobjectProperties) {
        if (tobjectProperties[key]["geometry_type"]) {
            if (geometry_type.innerHTML.startsWith(tobjectProperties[key]["geometry_type"])) {
                if (feature_name.value.startsWith(key.capitalizeFirstLetter())) {
                    feature_name.value = feature_name.value.replace(key.capitalizeFirstLetter(), feature_type.capitalizeFirstLetter());
                }
            }
        } else if (key === 'generic') {
            if (feature_name.value.startsWith(key.capitalizeFirstLetter())) {
                feature_name.value = feature_name.value.replace(key.capitalizeFirstLetter(), feature_type.capitalizeFirstLetter());
            }
        }
    }

    document.getElementById('feature-type').value = feature_type;

    var sub_type = document.getElementById('sub-type');
    this.removeContent(sub_type);
    if (feature_properties['subtype']) {
        feature_properties['subtype'].forEach(function (st) {
            sub_type.appendChild(this.createOption(st));
        }, this);
        sub_type.disabled = false;
    } else {
        sub_type.disabled = true;
    }

    var heightinput = document.getElementById('height-input');
    var heightslider = document.getElementById('height-slider');

    if (!(heightinput.disabled || feature_properties['height'])) {
        heightslider.noUiSlider.set(0);
        heightslider.setAttribute('disabled', true);
        heightinput.disabled = true;
        heightinput.value = null;
    } else if (heightinput.disabled && feature_properties['height']) {
        heightslider.noUiSlider.set(feature_properties['height']);
        heightslider.removeAttribute('disabled');
        heightinput.disabled = false;
    }

    var thicknessinput = document.getElementById('thickness-input');
    var thicknessslider = document.getElementById('thickness-slider');

    if (!(thicknessinput.disabled || feature_properties['thickness'])) {
        thicknessslider.noUiSlider.set(0);
        thicknessslider.setAttribute('disabled', true);
        thicknessinput.disabled = true;
        thicknessinput.value = null;
    } else if (thicknessinput.disabled && feature_properties['thickness']) {
        thicknessslider.noUiSlider.set(feature_properties['thickness']);
        thicknessslider.removeAttribute('disabled');
        thicknessinput.disabled = false;
    }
    return this;
};
featureInteractor.prototype.deactivateForm = function (feature) {

    var feature_name = document.getElementById('feature-name');
    if (feature.get('name')) {
        feature.set('name', feature_name.value);
    }
    feature_name.value = null;
    feature_name.disabled = true;

    document.getElementById('draw-hole').disabled = true;
    document.getElementById('delete-hole').disabled = true;

    var feature_type = document.getElementById('feature-type');
    if (feature.get('type')) {
        feature.set('type', feature_type.value);
    }
    this.removeContent(feature_type);

    var subtype = document.getElementById('sub-type');
    if (feature.get('subtype')) {
        feature.set('subtype', subtype.value);
    }
    this.removeContent(subtype);

    var heightinput = document.getElementById('height-input');
    if (feature.get('height')) {
        feature.set('height', heightinput.value);
    }
    heightinput.value = null;
    heightinput.disabled = true;

    var thicknessinput = document.getElementById('thickness-input');
    if (feature.get('thickness')) {
        feature.set('thickness', thicknessinput.value);
    }
    thicknessinput.value = null;
    thicknessinput.disabled = true;

    document.getElementById('featureproperties').style.display = 'none';

    document.getElementById('geodesic').removeEventListener('change', this.geodesiclistener);
    ol.Observable.unByKey(this.geometrylistener);
    this.geometrylistener = null;
    this.geodesiclistener = null;
};

featureInteractor.prototype.createFeatureOverlay = function () {
    var highlightStyleCache = {};
    var _this = this;
    var overlayStyleFunction = (function () {
        var setStyle = function (color, opacity, text) {
            var style = new ol.style.Style({
                text: new ol.style.Text({
                    font: '14px Calibri,sans-serif',
                    text: text,
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 5
                    }),
                    fill: new ol.style.Fill({
                        color: '#000'
                    })
                }),
                stroke: new ol.style.Stroke({
                    color: color.concat(1),
                    width: 4
                }),
                fill: new ol.style.Fill({
                    color: color.concat(opacity)
                })
            });
            return [style]
        };
        return function (feature, resolution) {
            var color;
            var opacity;
            if (exists(feature.get('type')) && tobjectProperties.hasOwnProperty(feature.get('type'))) {
                color = tobjectProperties[feature.get('type')]['color'];
            } else {
                color = [255, 0, 0];
            }
            if (feature.get('type') === 'aor') {
                opacity = 0
            } else {
                opacity = fillOpacity[feature.getGeometry().getType()];
                opacity = opacity ? opacity : 0;
            }
            var text = resolution < 50000 ? feature.get('name') : '';
            if (!highlightStyleCache[text]) {
                highlightStyleCache[text] = setStyle(color, opacity, text);
            }
            return highlightStyleCache[text];
        }
    })();
    var featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector(),
        type: 'overlay',
        style: overlayStyleFunction,
        zIndex: 9900
    });
    return featureOverlay
};
featureInteractor.prototype.getFeatureAtPixel = function (pixel) {
    var coord = this.map.getCoordinateFromPixel(pixel);
    var smallestArea = 5.1e14; // approximate surface area of the earth
    var smallestFeature = null;
    // var _this = this;
    var feature = this.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
        var geom = feature.getGeometry();
        if (geom instanceof ol.geom.Point) {
            //Need to add functionality for sensors here.
            return feature;
        } else if (geom instanceof ol.geom.LineString || geom instanceof ol.geom.MultiLineString) {
            return feature;
        } else if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon) {
            if (feature.get('type') === 'aor') {
                var point = geom.getClosestPoint(coord);
                var pixel0 = this.map.getPixelFromCoordinate(coord);
                var pixel1 = this.map.getPixelFromCoordinate(point);
                if (Math.abs(pixel0[0] - pixel1[0]) < 8 && Math.abs(pixel0[1] - pixel1[1]) < 8) {
                    return feature;
                }
            } else {
                var area = geom.getArea();
                if (area < smallestArea) {
                    smallestArea = area;
                    smallestFeature = feature;
                }
            }
        }
    }, this, function (layer) {
        if (this.layertree.selectedLayer) {
            return layer === this.layertree.getLayerById(this.layertree.selectedLayer.id)
        }
    }, this);
    return exists(feature) ? feature : smallestFeature;
};
featureInteractor.prototype.setMouseCursor = function (feature) {
    if (feature) {
        this.map.getTarget().style.cursor = 'pointer';
    } else {
        this.map.getTarget().style.cursor = '';
    }
};
featureInteractor.prototype.displayFeatureInfo = function (feature) {
    if (feature !== this.highlight) {
        if (this.highlight) {
            this.featureOverlay.getSource().removeFeature(this.highlight);
        }
        if (feature) {
            this.featureOverlay.getSource().addFeature(feature);
        }
        this.highlight = feature;
    }
};

featureInteractor.prototype.addInteractions = function () {
    /*********** SELECT ************/
    var _this = this;
    var selectedLayer;
    this.select = new ol.interaction.Select({
        layers: [this.featureOverlay],
        toggleCondition: ol.events.condition.never,
        condition: function (evt) {
            if (ol.events.condition.singleClick(evt) || ol.events.condition.doubleClick(evt)) {
                if (_this.toolbar.addedFeature || _this.autoselect) {
                    _this.toolbar.addedFeature = null;
                    _this.autoselect = false;
                    return false;
                }
                return true;
            }
        },
        // style: this.featureOverlay.getStyle()
        // style: new ol.style.Style({
        //     stroke: new ol.style.Stroke({
        //         color: 'rgba(255, 255, 255, 1)',
        //         width: 3
        //     }),
        //     fill: new ol.style.Fill({
        //         color: 'rgba(255, 255, 255, 0.2)'
        //     })
        // })
    });
    this.select.on('select', function (evt) {
        var feature;
        // Handle deselect first so we can move the feature back to the active layer.
        if (evt.deselected.length == 1) {
            feature = evt.deselected[0];
            _this.modify.setActive(false);
            // translate.setActive(false);
            console.log('auto deselect:', feature.get('name'), feature.getRevision());
            _this.deactivateForm(feature);

            selectedLayer = _this.layertree.getLayerById(_this.layertree.selectedLayer.id);
            selectedLayer.getSource().addFeature(feature);
            // _this.toolbar.activeFeatures.push(feature);

            // transactWFS('insert', evt.feature);
            // source.once('addfeature', function (evt) {
            //     var parser = new ol.format.GeoJSON();
            //     var features = source.getFeatures();
            //     var featuresGeoJSON = parser.writeFeatures(features, {
            //         featureProjection: 'EPSG:3857',
            //     });
            //     console.log(featuresGeoJSON)
            //     $.ajax({
            //         url: 'test_project/features.geojson', // what about aor?
            //         type: 'POST',
            //         data: featuresGeoJSON
            //     }).then(function (response) {
            //         console.log(response);
            //     });
            // });
        }

        if (evt.selected.length == 1) {
            feature = evt.selected[0];
            _this.modify.setActive(true);
            //translate.setActive(true);
            console.log('auto select:  ', feature.get('name'), feature.getRevision());
            _this.activateForm(feature);

            selectedLayer = _this.layertree.getLayerById(_this.layertree.selectedLayer.id);
            selectedLayer.getSource().removeFeature(feature);
            // _this.toolbar.activeFeatures.push(feature);

        }
    });

    /*********** MODIFY ************/
    var origGeom;
    this.modify = new ol.interaction.Modify({
        features: this.select.getFeatures()
    });
    this.modify.on('modifystart', function (evt) {
        origGeom = evt.features.getArray()[0].getGeometry().clone();
    });
    this.modify.on('modifyend', function (evt) {
        if (!(isPolyValid(evt.features.getArray()[0].getGeometry()))) {
            evt.features.getArray()[0].getGeometry().setCoordinates(origGeom.getCoordinates());
        }
    });

    /********* TRANSLATE ***********/
    // When the translate interaction is active, it
    // causes the mouse cursor to turn into a
    // pointer when hovering over the interior
    // of the AOR. Need to find out why.
    // Disable until solution is found.
    //
    // var translate = new ol.interaction.Translate({
    //     features: select.getFeatures()
    // });
    // map.addInteraction(translate);
    // translate.setActive(false);

    var remove = function (evt) {
        console.log(evt.keyCode);
        if (exists(_this.highlight) && evt.keyCode == 46) { //delete key pressed
            var layer = _this.layertree.getLayerById(_this.layertree.selectedLayer.id);
            layer.getSource().removeFeature(_this.highlight);
            _this.featureOverlay.getSource().removeFeature(_this.highlight);
            _this.highlight = undefined;
        }
    };
    document.addEventListener('keydown', remove, false);

    this.toolbar.controlEventEmitter.on('change', function (evt) {
        var selectedFeatures = _this.select.getFeatures();
        var selectedFeature;
        if (_this.toolbar.active == true) {
            _this.map.un('pointermove', _this.hoverDisplay);

            if (selectedFeatures.getArray().length === 1) {
                selectedFeature = selectedFeatures.getArray()[0];
                console.log('manual deselect:', selectedFeature.get('name'), selectedFeature.getRevision());
                _this.deactivateForm(selectedFeature);

                // var selectedLayer = _this.layertree.getLayerById(_this.layertree.selectedLayer.id);
                // selectedLayer.getSource().addFeature(feature);
                // _this.activeFeatures.push(feature);

                selectedFeatures.forEach(selectedFeatures.remove, selectedFeatures);
            } else {
                console.log('This is unexpected. debug!')
            }

            // translate.setActive(false);
            _this.modify.setActive(false);
            _this.select.setActive(false);
        } else {
            _this.select.setActive(true);
            _this.modify.setActive(true);
            // translate.setActive(true);

            if (_this.toolbar.addedFeature) {
                // _this.featureOverlay.
                selectedFeatures.push(_this.toolbar.addedFeature);

                selectedFeature = selectedFeatures.getArray()[0];
                console.log('manual select:    ', selectedFeature.get('name'), selectedFeature.getRevision());
                _this.activateForm(selectedFeature);
            } else {
                console.log('HHHHHHHERREE!!!')
            }

            _this.map.on('pointermove', _this.hoverDisplay);
        }
    });
};

function init() {
    document.removeEventListener('DOMContentLoaded', init);

    var mouseProjection = 'EPSG:4326';
    var mousePrecision = 4;
    var view = new ol.View({
        // center: ol.proj.transform([-86.711, 34.636], 'EPSG:4326', 'EPSG:3857'),
        // center: ol.proj.transform([-73.9812, 40.6957], 'EPSG:4326', 'EPSG:3857'),
        center: ol.proj.transform([-105.539, 39.771], 'EPSG:4326', 'EPSG:3857'),
        // center: [-8236600, 4975706],
        // center: [0, 0],
        zoom: 15
    });
    view.on('change:resolution', function (evt) {
        var coord0 = evt.target.getCenter();
        var pixel0 = map.getPixelFromCoordinate(coord0);
        var pixel1 = [pixel0[0] + 1.0, pixel0[1] - 1.0];
        var coord1 = map.getCoordinateFromPixel(pixel1);
        var currentProj = map.getView().getProjection().getCode();
        if (mouseProjection !== currentProj) {
            coord0 = ol.proj.transform(coord0, currentProj, mouseProjection);
            coord1 = ol.proj.transform(coord1, currentProj, mouseProjection);
        }
        var dx = Math.abs(coord1[0] - coord0[0]);
        var dy = Math.abs(coord1[1] - coord0[1]);

        var xp = Number(Math.abs(Math.min(0, Math.floor(Math.log10(dx)))).toFixed());
        var yp = Number(Math.abs(Math.min(0, Math.floor(Math.log10(dy)))).toFixed());

        mousePrecision = Math.max(xp, yp);
        var format = ol.coordinate.createStringXY(mousePrecision);
        mousePositionControl.setCoordinateFormat(format);
    });

    var bingkey = 'AsPHemiyjrAaLwkdh3DLil_xdTJN7QFGPaOi9-a4sf8hbAwA3Z334atxK8GxYcxy';
    var thunderforestAttributions = [
        new ol.Attribution({
            html: 'Tiles &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>'
        }),
        ol.source.OSM.ATTRIBUTION
    ];

    var map = new ol.Map({
        interactions: ol.interaction.defaults({doubleClickZoom: false}),
        target: document.getElementById('map'),
        view: view,
        logo: {
            src: 'res/saic-logo2.png',
            href: 'http://www.saic.com'
        },
        controls: [new ol.control.Attribution(), new ol.control.Zoom()],
        layers: [
            new ol.layer.Group({
                title: 'Bing',
                layers: [
                    new ol.layer.Tile({
                        title: 'Labels',
                        type: 'base',
                        visible: false,
                        source: new ol.source.BingMaps({
                            key: bingkey,
                            imagerySet: 'Road'
                        })
                    }),
                    new ol.layer.Tile({
                        title: 'Aerial',
                        type: 'base',
                        visible: false,
                        source: new ol.source.BingMaps({
                            key: bingkey,
                            imagerySet: 'Aerial'
                        })
                    }),
                    new ol.layer.Tile({
                        title: 'Aerial + Labels',
                        type: 'base',
                        visible: false,
                        source: new ol.source.BingMaps({
                            key: bingkey,
                            imagerySet: 'AerialWithLabels'
                        })
                    })
                ]
            }),
            new ol.layer.Group({
                title: 'MapQuest',
                layers: [
                    new ol.layer.Tile({
                        title: 'Labels',
                        type: 'base',
                        visible: false,
                        source: new ol.source.MapQuest({layer: 'osm'})
                    }),
                    new ol.layer.Tile({
                        title: 'Sat',
                        type: 'base',
                        visible: false,
                        source: new ol.source.MapQuest({layer: 'sat'})
                    }),
                    new ol.layer.Group({
                        title: 'Sat + Labels',
                        type: 'base',
                        visible: false,
                        layers: [
                            new ol.layer.Tile({
                                source: new ol.source.MapQuest({layer: 'sat'})
                            }),
                            new ol.layer.Tile({
                                source: new ol.source.MapQuest({layer: 'hyb'})
                            })
                        ]
                    })
                ]
            }),
            new ol.layer.Group({
                title: 'Thunderforest',
                layers: [
                    new ol.layer.Tile({
                        title: 'OpenCycleMap',
                        type: 'base',
                        visible: false,
                        source: new ol.source.OSM({
                            url: 'http://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png',
                            attributions: thunderforestAttributions
                        })
                    }),
                    new ol.layer.Tile({
                        title: 'Outdoors',
                        type: 'base',
                        visible: false,
                        source: new ol.source.OSM({
                            url: 'http://{a-c}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png',
                            attributions: thunderforestAttributions
                        })
                    }),
                    new ol.layer.Tile({
                        title: 'Landscape',
                        type: 'base',
                        visible: false,
                        source: new ol.source.OSM({
                            url: 'http://{a-c}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
                            attributions: thunderforestAttributions
                        })
                    }),
                    new ol.layer.Tile({
                        title: 'Transport',
                        type: 'base',
                        visible: false,
                        source: new ol.source.OSM({
                            url: 'http://{a-c}.tile.thunderforest.com/transport/{z}/{x}/{y}.png',
                            attributions: thunderforestAttributions
                        })
                    }),
                    new ol.layer.Tile({
                        title: 'Transport Dark',
                        type: 'base',
                        visible: false,
                        source: new ol.source.OSM({
                            url: 'http://{a-c}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png',
                            attributions: thunderforestAttributions
                        })
                    })
                ]
            }),
            new ol.layer.Group({
                title: 'OpenStreetMap',
                layers: [
                    new ol.layer.Tile({
                        title: 'OpenStreetMap',
                        type: 'base',
                        visible: true,
                        source: new ol.source.OSM()
                    })
                ]
            }),
            new ol.layer.Group({
                title: 'Localhost',
                layers: [
                    new ol.layer.Tile({
                        title: 'OpenStreetMap',
                        type: 'base',
                        visible: false,
                        source: new ol.source.OSM({url: 'http://localhost/osm_tiles/{z}/{x}/{y}.png'})
                    })
                ]
            })
            // new ol.layer.Group({
            //     title: 'Extra',
            //     layers: [
            //         new ol.layer.Tile({
            //             title: 'Countries',
            //             type: 'vector',
            //             source: new ol.source.TileWMS({
            //                 url: 'http://demo.opengeo.org/geoserver/wms',
            //                 params: {'LAYERS': 'ne:ne_10m_admin_1_states_provinces_lines_shp'},
            //                 serverType: 'geoserver'
            //             })
            //         })
            //     ]
            // })
        ],
        loadTilesWhileInteracting: true,
        loadTilesWhileAnimating: true
    });

    var tree = new layerTree({map: map, target: 'layertree', messages: 'messageBar'});

    var tools = new toolBar({map: map, target: 'toolbar', layertree: tree});

    tools.addDrawToolBar();

    var interactor = new featureInteractor({map: map, toolbar: tools, layertree: tree, target: 'featureeditor'});


    // var vector_aor = new ol.layer.Vector({
    //     title: 'AOR',
    //     name: 'AOR',
    //     type: 'vector',
    //     source: new ol.source.Vector(),
    //     style: tobjectsStyleFunction
    // });
    // var vector = new ol.layer.Vector({
    //     title: 'tobjects',
    //     name: 'tobjects',
    //     type: 'vector',
    //     source: new ol.source.Vector(),
    //     style: tobjectsStyleFunction
    // });
    // var projectGroup = new ol.layer.Group({
    //     title: 'Project',
    //     layers: [
    //         // layerVector,
    //         vector_aor,
    //         vector
    //     ]
    // });
    // map.addLayer(projectGroup);

    // var selectedFeature = null;
    // var getSelectedFeatureAtPixel = function (pixel) {
    //     var feature = map.forEachFeatureAtPixel(pixel, function (feature, layer) {
    //         if (feature.getId() == selectedFeature.getId()) {
    //             return feature;
    //         } else {
    //             return undefined;
    //         }
    //     })
    //     return feature;
    // };
    //
    // var setSelectMousePointer = function (evt) {
    //     if (evt.dragging) return;
    //     var pixel = map.getEventPixel(evt.originalEvent);
    //     var intersectingFeature = getSelectedFeatureAtPixel(pixel);
    //     setMouseCursor(intersectingFeature)
    // };

    /*********** WFS-T *************/
    // var url="http://gis.local.osm:8080/geoserver/wfs?service=wfs&version=1.1.0&request=GetFeature&typeName=cite:nyc_buildings";
    // sourceVector = new ol.source.Vector({
    // 	url: '/cgi-bin/proxy.py?url='+ encodeURIComponent(url),
    // 	format: new ol.format.WFS()
    // });
    //
    //wfs-t
    // url = 'http://gis.local.osm:8080/geoserver/wfs';
    // url = /^((http)|(https))(:\/\/)/.test(url) ? url : 'http://' + url;
    // url = /\?/.test(url) ? url + '&' : url + '?';
    // var typeName = 'cite:nyc_buildings';
    // var proj = 'EPSG:3857';
    // var formatWFS = new ol.format.WFS();
    // sourceVector = new ol.source.Vector({
    //     loader: function (extent) {
    //     	$.ajax('/cgi-bin/proxy.py?url='+'http://gis.local.osm:8080/geoserver/wfs', {
    //     		type: 'GET',
    //     		data: {
    //     			service: 'WFS',
    //     			version: '2.0.0',
    //     			request: 'GetFeature',
    //     			typename: 'cite:nyc_buildings',
    //     			srsname: 'EPSG:3857',
    //     			bbox: extent.join(',') + ',EPSG:3857'
    //     		},
    //     	}).done(function (response) {
    //     		formatWFS = new ol.format.WFS(),
    //     			sourceVector.addFeatures(formatWFS.readFeatures(response))
    //     	});
    //     },
    // 	loader: function (extent, res, mapProj) {
    // 		proj = proj || mapProj.getCode();
    // 		var request = new XMLHttpRequest();
    // 		request.onreadystatechange = function () {
    // 			if (request.readyState === 4 && request.status === 200) {
    // 				sourceVector.addFeatures(formatWFS.readFeatures(request.responseText, {
    // 					dataProjection: proj,
    // 					featureProjection: mapProj.getCode()
    // 				}));
    // 			}
    // 		};
    // 		url = url + 'SERVICE=WFS&REQUEST=GetFeature&TYPENAME=' + typeName + '&VERSION=1.1.0&SRSNAME=' + proj + '&BBOX=' + extent.join(',');
    // 		request.open('GET', '/cgi-bin/proxy.py?' + encodeURIComponent(url));
    // 		//request.open('GET', url);
    // 		request.send();
    // 	},
    // 	strategy: ol.loadingstrategy.bbox
    // });
    //
    // var layerVector = new ol.layer.Vector({
    // 	title: 'WFS-T',
    // 	type: 'vector',
    // 	source: sourceVector
    // });
    //
    // var dirty = {};
    // var formatWFS = new ol.format.WFS();
    // var formatGML = new ol.format.GML({
    // 	featureNS: 'http://argeomatica.com',
    // 	featureType: 'cite:nyc_buildings',
    // 	srsName: 'EPSG:3857'
    // });
    // var transactWFS = function (p, f) {
    // 	switch (p) {
    // 		case 'insert':
    // 			node = formatWFS.writeTransaction([f], null, null, formatGML);
    // 			break;
    // 		case 'update':
    // 			node = formatWFS.writeTransaction(null, [f], null, formatGML);
    // 			break;
    // 		case 'delete':
    // 			node = formatWFS.writeTransaction(null, null, [f], formatGML);
    // 			break;
    // 	}
    // 	s = new XMLSerializer();
    // 	str = s.serializeToString(node);
    // 	$.ajax('http://gis.local.osm/geoserver/wfs', {
    // 		type: 'POST',
    // 		dataType: 'xml',
    // 		processData: false,
    // 		contentType: 'text/xml',
    // 		data: str
    // 	}).done();
    // };

    /********* TRANSLATE ***********/
    // When the translate interaction is active, it
    // causes the mouse cursor to turn into a
    // pointer when hovering over the interior
    // of the AOR. Need to find out why.
    // Disable until solution is found.
    //
    // var translate = new ol.interaction.Translate({
    //     features: select.getFeatures()
    // });
    // map.addInteraction(translate);
    // translate.setActive(false);

    /********* ADD SENSOR **********/
    // var iconFeature = new ol.Feature({
    //     geometry: new ol.geom.Point([0, 0]),
    //     name: 'Camera',
    //     maxRange: 4000,
    //     minRange: 500,
    //     sourceHeight: 3,
    //     targetHeight: 3
    // });
    // var iconStyle = new ol.style.Style({
    //     image: new ol.style.Icon({
    //         anchor: [0.5, 46],
    //         anchorXUnits: 'fraction',
    //         anchorYUnits: 'pixels',
    //         src: 'resources/camera-normal.png'
    //     })
    // });
    // iconFeature.setStyle(iconStyle);
    // var vectorSource = new ol.source.Vector({
    //     features: [iconFeature]
    // });

    /********* ADD PROJECT *********/

    /*var loadProject = document.getElementById('loadProject');
    loadProject.onclick = function (e) {

        map.removeLayer(featureOverlay);
        map.removeLayer(projectGroup);

        var bounds = [-105.54833333333333, 39.76361111111111, -105.52694444444444, 39.778055555555554];

        var image = new ol.layer.Image({
            title: 'camera',
            type: 'overlay',
            source: new ol.source.ImageStatic({
                url: 'test_project/package_patched2.png',
                imageExtent: ol.proj.transformExtent(bounds, 'EPSG:4326', 'EPSG:3857')
            }),
            // Replace with an opacity slider-bar.
            opacity: 0.2
        });
        vector_aor = new ol.layer.Vector({
            title: 'AOR',
            type: 'overlay',
            source: new ol.source.Vector({
                url: 'test_project/aor.geojson',
                format: new ol.format.GeoJSON()
            }),
            style: tobjectsStyleFunction
        });
        vector = new ol.layer.Vector({
            title: 'tobjects',
            type: 'overlay',
            source: new ol.source.Vector({
                url: 'test_project/tobjects_test.geojson',
                format: new ol.format.GeoJSON()
            }),
            style: tobjectsStyleFunction
        });
        projectGroup = new ol.layer.Group({
            title: 'Project',
            layers: [
                image,
                vector_aor,
                vector
            ]
        });

        map.addLayer(projectGroup);
        map.addLayer(featureOverlay);

        // Need to add in auto-zoom-in functionality here.

        vector_aor.getSource().on('change', function (evt) {
            var source = evt.target;
            if (source.getState() === 'ready') {
                view.setCenter(ol.extent.getCenter(source.getExtent()));
            };
        });
    }
*/
    /******* LAYER SWITCHER ********/
    var layerSwitcher = new ol.control.LayerSwitcher();
    map.addControl(layerSwitcher);

    /********** SCALELINE **********/
    var scaleLineControl = new ol.control.ScaleLine({
        // className: 'ol-scale-line ol-scale-line-inner text-stroke',
    });
    map.addControl(scaleLineControl);

    var unitsSelect = $('#units');
    unitsSelect.on('change', function () {
        scaleLineControl.setUnits(this.value);
    });
    unitsSelect.val(scaleLineControl.getUnits());

    /******** MOUSEPOSITION ********/
    var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(mousePrecision),
        projection: mouseProjection,
        target: 'coordinates'
    });
    map.addControl(mousePositionControl);

    var projectionSelect = $('#projection');
    projectionSelect.on('change', function () {
        mouseProjection = ol.proj.get(this.value);
        mousePositionControl.setProjection(mouseProjection);

    });
    projectionSelect.val(mousePositionControl.getProjection().getCode());

    var mousePositionControl2 = new ol.control.MousePosition({
        coordinateFormat: function (coordinates) {
            var zoom = view.getZoom();
            var xytile = deg2tile(coordinates[0], coordinates[1], zoom);
            return "Tile: [Z: " + zoom + "  X: " + xytile[0] + "  Y: " + xytile[1] + "]";
        },
        projection: 'EPSG:4326',
        target: 'tile'
    });
    map.addControl(mousePositionControl2);

    document.getElementById('checkwmslayer').addEventListener('click', function () {
        tree.checkWmsLayer(this.form);
    });
    document.getElementById('addwms_form').addEventListener('submit', function (evt) {
        evt.preventDefault();
        tree.addWmsLayer(this);
        this.parentNode.style.display = 'none';
    });
    document.getElementById('wmsurl').addEventListener('change', function () {
        tree.removeContent(this.form.layer)
            .removeContent(this.form.format);
    });
    document.getElementById('addwfs_form').addEventListener('submit', function (evt) {
        evt.preventDefault();
        tree.addWfsLayer(this);
        this.parentNode.style.display = 'none';
    });
    document.getElementById('addvector_form').addEventListener('submit', function (evt) {
        evt.preventDefault();
        tree.addVectorLayer(this);
        this.parentNode.style.display = 'none';
    });
    document.getElementById('newvector_form').addEventListener('submit', function (evt) {
        evt.preventDefault();
        tree.newVectorLayer(this);
        this.parentNode.style.display = 'none';
    });

    /**
     * TODO: Need to integrate the opacity sliders from this code into the layerswitcher code.
     * See http://openlayers.org/en/v3.13.0/examples/layer-group.html?q=mapquest

     function bindInputs(layerid, layer) {
        var visibilityInput = $(layerid + ' input.visible');
        visibilityInput.on('change', function () {
            layer.setVisible(this.checked);
        });
        visibilityInput.prop('checked', layer.getVisible());

        var opacityInput = $(layerid + ' input.opacity');
        opacityInput.on('input change', function () {
            layer.setOpacity(parseFloat(this.value));
        });
        opacityInput.val(String(layer.getOpacity()));
    }
     map.getLayers().forEach(function (layer, i) {
        bindInputs('#layer' + i, layer);
        if (layer instanceof ol.layer.Group) {
            layer.getLayers().forEach(function (sublayer, j) {
                bindInputs('#layer' + i + j, sublayer);
            });
        }
    });
     **/
}
document.addEventListener('DOMContentLoaded', init);