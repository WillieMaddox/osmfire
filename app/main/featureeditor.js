/**
 * Created by maddoxw on 10/14/16.
 */

define(['jquery', 'ol',
    'exists',
    'utils',
    'map',
    'layerinteractor',
    'ttemplate',
    'ispolyvalid',
    'ispointinpoly',
    'doespolycoverhole'
], function ($, ol,
             exists,
             utils,
             map,
             layerinteractor,
             tobjectTemplates,
             isPolyValid,
             isPointInPoly,
             doesPolyCoverHole) {

    'use strict';

    var formElements = {};
    var wgs84Sphere = new ol.Sphere(6378137);

    return {
        init: function () {
            this.isStyled = false;
            this.$form = this.createForm();
        },
        createForm: function () {
            formElements.featurename = this.createNameNodes();
            formElements.geometrytype = this.createGeometryTypeNodes();
            formElements.measure = this.createMeasureNodes();
            formElements.featuretype = this.createFeatureTypeNodes();
            formElements.hole = this.createHoleNodes();
            formElements.height = this.createHeightNodes();
            formElements.thickness = this.createThicknessNodes();
            var $form = $("<form id='featureproperties' class='form'>");
            $form.append(this.addFormRow(['featurename']));
            $form.append(this.addFormRow(['geometrytype', 'measure']));
            $form.append(this.addFormRow(['featuretype', 'hole']));
            $form.append(this.addFormRow(['height']));
            $form.append(this.addFormRow(['thickness']));
            return $form;
        },
        styleForm: function () {

            var _this = this;
            $('#measure-units').selectmenu({
                classes: {
                    "ui-selectmenu-button": "menuselect"
                }
            });
            $('#geodesic').checkboxradio();

            $('#feature-type').selectmenu({
                classes: {
                    "ui-selectmenu-button": "menuselect"
                }
            }).on('change', function () {
                _this.changeFeatureType(this.value);
            });

            $('#draw-hole').button({
                label: "Draw"
            }).on('click', function () {
                _this.drawHole();
            });
            $('#delete-hole').button({
                label: "Delete"
            }).on('click', function () {
                _this.deleteHole();
            });

            $('#height-slider').slider({
                animate: true,
                range: "min",
                min: 0,
                max: 100,
                step: 0.01,
            }).on('slide', function (event, ui) {
                $("#height-spinner").spinner("value", utils.pow10Slider(ui.value));
            }).on('slidechange', function (event, ui) {
                $("#height-spinner").spinner("value", utils.pow10Slider(ui.value));
            });

            $('#height-spinner').spinner({
                value: 10,
                min: 0,
                max: 1000,
                step: 0.1
            }).on('spin', function (event, ui) {
                $("#height-slider").slider("value", utils.log10Slider(ui.value));
            }).on('spinchange', function () {
                if (this.value.length > 0) {
                    $("#height-slider").slider("value", utils.log10Slider(this.value));
                }
            });

            // $('#thickness-slider').slider({
            //     animate: true,
            //     range: "min",
            //     min: 0,
            //     max: 50,
            //     step: 0.01,
            //     slide: function (event, ui) {
            //         $('#thickness-spinner').spinner("value", ui.value)
            //     },
            //     change: function (event, ui) {
            //         $('#thickness-spinner').spinner("value", ui.value)
            //     }
            // });
            //
            // $('#thickness-spinner').spinner({
            //     min: 0,
            //     max: 50,
            //     step: 0.01,
            //     spin: function (event, ui) {
            //         $('#thickness-slider').slider("value", ui.value)
            //     },
            //     change: function () {
            //         if (this.value.length > 0) {
            //             $('#thickness-slider').slider("value", this.value);
            //         }
            //     }
            // }).spinner("value", 5);

            $('#thickness-slider').slider({
                animate: true,
                range: "min",
                min: 0,
                max: 50,
                step: 0.01
            }).on('slide', function (event, ui) {
                $('#thickness-spinner').spinner("value", ui.value)
            }).on('slidechange', function (event, ui) {
                $('#thickness-spinner').spinner("value", ui.value)
            });

            $('#thickness-spinner').spinner({
                value: 5,
                min: 0,
                max: 50,
                step: 0.01
            }).on('spin', function (event, ui) {
                $('#thickness-slider').slider("value", ui.value)
            }).on('spinchange', function () {
                if (this.value.length > 0) {
                    $('#thickness-slider').slider("value", this.value);
                }
            });

            this.isStyled = true;
        },
        addFormRow: function (labels) {
            var $formRow = $("<div class='form-row'>");
            for (let label of labels) {
                $formRow.append(formElements[label])
            }
            return $formRow
        },
        createNameNodes: function () {
            var $formElem = $("<div class='form-elem'>");
            var $formValue = $("<div class='form-value'>");
            $formElem.append($("<div id='feature-name-label' class='form-label'>Feature Name</div>"));
            $formValue.append($("<input type='text' id='feature-name' class='ui-widget'>"));
            $formElem.append($formValue);
            return $formElem
        },
        createGeometryTypeNodes: function () {
            var $formElem = $("<div class='form-elem' style='width:12em'>");
            var $formValue = $("<div class='form-value'>");
            $formElem.append($("<div id='geometry-type-label' class='form-label'>Geometry Type</div>"));
            $formValue.append($("<input type='text' id='geometry-type' readonly>"));
            $formElem.append($formValue);
            return $formElem
        },
        createMeasureNodes: function () {
            var $formElem = $("<div class='form-elem'>");
            var $formValue = $("<div class='form-value'>");
            $formElem.append($("<div id='measure-label' class='form-label'>Measure</div>"));
            $formValue.append($("<div id='measure' readonly>"));
            var $selectNode = $("<select id='measure-units'>");
            $selectNode.append(utils.createMenuOption("metric", "Metric"));
            $selectNode.append(utils.createMenuOption("english", "English"));
            $formValue.append($selectNode);
            $formValue.append($("<label for='geodesic' class='visible' title='Use geodesic measures'>"));
            $formValue.append($("<input type='checkbox' id='geodesic' checked>"));
            $formElem.append($formValue);
            return $formElem
        },
        createFeatureTypeNodes: function () {
            var $formElem = $("<div class='form-elem'>");
            var $formValue = $("<div class='form-value'>");
            $formElem.append($("<div id='feature-type-label' class='form-label'>Feature Type</div>"));
            $formValue.append($("<select id='feature-type'>"));
            $formElem.append($formValue);
            return $formElem
        },
        createHoleNodes: function () {
            var $formElem = $("<div class='form-elem'>");
            var $formValue = $("<div class='form-value'>");
            $formElem.append($("<div id='hole-label' class='form-label'>Hole</div>"));
            $formValue.append(this.createHoleButton('draw', 'Draw a hole in the selected feature'));
            $formValue.append(this.createHoleButton('delete', 'Delete a hole from the selected feature'));
            // $formValue.append($('<button id="draw-hole" class="ol-unselectable ol-control hole-buttons" title="Draw a hole in the selected feature">Draw</button>'));
            // $formValue.append($('<button id="delete-hole" class="ol-unselectable ol-control hole-buttons" title="Delete a hole from the selected feature">Delete</button>'));
            $formElem.append($formValue);
            return $formElem
        },
        createHeightNodes: function () {
            var $formElem = $("<div class='form-elem'>");
            var $formValue = $("<div class='form-value'>");
            $formElem.append($("<div id='height-label' class='form-label'>Height</div>"));
            $formValue.append($("<div id='height-slider'>"));
            $formValue.append($("<input id='height-spinner'>"));
            $formElem.append($formValue);
            return $formElem
        },
        createThicknessNodes: function () {
            var $formElem = $("<div class='form-elem'>");
            var $formValue = $("<div class='form-value'>");
            $formElem.append($("<div id='thickness-label' class='form-label'>Thickness</div>"));
            $formValue.append($("<div id='thickness-slider'>"));
            $formValue.append($("<input id='thickness-spinner'>"));
            $formElem.append($formValue);
            return $formElem
        },

        createHoleButton: function (label, title) {
            var $buttonElem = $('<button id="' + label + '-hole">');
            $buttonElem.addClass("ol-unselectable ol-control hole-buttons");
            $buttonElem.val(label.capitalizeFirstLetter());
            $buttonElem.attr('title', title);
            return $buttonElem;
        },
        drawHole: function () {
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

            var currFeat = layerinteractor.select.getFeatures().getArray()[0];
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
                    var nPolygons = polygons.length;
                    for (var i = 0; i < nPolygons; i++) {
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

            $('#draw-hole').button('disable');
            $('#delete-hole').button('disable');
            map.un('pointermove', layerinteractor.hoverDisplay);
            layerinteractor.select.setActive(false);
            layerinteractor.modify.setActive(false);
            // this.translate.setActive(true);
            map.addInteraction(holeDraw);

            var _this = this;

            var getPolyHoles = function (poly) {
                var skip = true;
                var holes = [];
                poly.getLinearRings().forEach(function (ring) {
                    if (skip) { // assume the first ring is the exterior ring.
                        skip = false;
                    } else {
                        holes.push(new ol.Feature(new ol.geom.Polygon([ring.getCoordinates()])));
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

            var finishHole = function () {
                map.removeInteraction(holeDraw);
                layerinteractor.modify.setActive(true);
                layerinteractor.select.setActive(true);
                // _this.translate.setActive(true);
                map.on('pointermove', layerinteractor.hoverDisplay);
                $('#draw-hole').button('enable');
                // $('#delete-hole').button('enable');
                var holeFeats = getHoles(currGeom);
                $('#delete-hole').button('option', 'disabled', holeFeats.getArray().length === 0);
                $(document).off('keyup')
            };

            $(document).on('keyup', function (evt) {
                if (evt.keyCode == 189 || evt.keyCode == 109) {
                    if (vertsCouter === 1) {
                        currGeom.setCoordinates(origGeom.getCoordinates());
                        finishHole()
                    } else {
                        holeDraw.removeLastPoint();
                    }
                } else if (evt.keyCode == 27) {
                    currGeom.setCoordinates(origGeom.getCoordinates());
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

                layerinteractor.autoselect = true;
                $('#delete-hole').button('enable');
                finishHole();
            }, this);
        },
        deleteHole: function () {
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
                poly.getLinearRings().forEach(function (ring) {
                    if (skip) { // assume the first ring is the exterior ring.
                        newPoly = new ol.geom.Polygon([ring.getCoordinates()]);
                        skip = false;
                    } else {
                        var rcoord = ring.getFirstCoordinate();
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
                layerinteractor.autoselect = true;
                map.removeInteraction(chooseHole);
                map.removeLayer(holeOverlay);
                layerinteractor.modify.setActive(true);
                layerinteractor.select.setActive(true);
                // _this.translate.setActive(true);
                map.on('pointermove', layerinteractor.hoverDisplay);
                $('#draw-hole').button('enable');
                if (holeFeats.getArray().length > 0) {
                    $('#delete-hole').button('enable');
                }
                $(document).off('keyup')
            };
            $(document).on('keyup', function (evt) {
                if (evt.keyCode == 27) {
                    finishHole()
                }
            });

            $('#draw-hole').button('disable');
            $('#delete-hole').button('disable');
            map.un('pointermove', layerinteractor.hoverDisplay);
            layerinteractor.select.setActive(false);
            layerinteractor.modify.setActive(false);

            var feature = null;
            var currFeat = layerinteractor.select.getFeatures().getArray()[0];
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
            map.addLayer(holeOverlay);

            var chooseHole = new ol.interaction.ChooseHole({
                holes: holeFeats
            });
            map.addInteraction(chooseHole);

            chooseHole.emitter.on('change', function () {
                feature = chooseHole.get('hole');
                if (feature !== null) {
                    removeHole(feature);
                }
                finishHole();
            });
        },

        formatArea: function (geom, sourceProj) {

            //  var getGeodesicArea = function (poly) {
            //     var area = 0;
            //     var isExterior = true;
            //     poly.getLinearRings().forEach( function (ring) {
            //         if (isExterior) { // assume the first ring is the exterior ring.
            //             area += Math.abs(wgs84Sphere.geodesicArea(ring.getCoordinates()));
            //             isExterior = false;
            //         } else {
            //             area -= Math.abs(wgs84Sphere.geodesicArea(ring.getCoordinates()));
            //         }
            //     });
            //     return area;
            // };
            //
            // var area;
            // if (document.getElementById('geodesic').checked) {
            //     var geom = polygon.clone().transform(sourceProj, 'EPSG:4326');
            //     // var coordinates = geom.getLinearRing(0).getCoordinates();
            //     // area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
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
                if ($("#geodesic").is(":checked")) {
                    var poly = polygon.clone().transform(sourceProj, 'EPSG:4326');
                    poly.getLinearRings().forEach(function (ring) {
                        if (isExterior) { // assume the first ring is the exterior ring.
                            area += Math.abs(wgs84Sphere.geodesicArea(ring.getCoordinates()));
                            isExterior = false;
                        } else {
                            area -= Math.abs(wgs84Sphere.geodesicArea(ring.getCoordinates()));
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
            $('#measure').html(output);
        },
        formatLength: function (geom, sourceProj) {

            var getLineStringLength = function (line) {
                var length = 0;
                if ($("#geodesic").is(":checked")) {
                    var coordinates = line.clone().transform(sourceProj, 'EPSG:4326').getCoordinates();
                    var nCoords = coordinates.length;
                    for (var i = 0; i < nCoords - 1; i++) {
                        length += wgs84Sphere.haversineDistance(coordinates[i], coordinates[i + 1]);
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
            $('#measure').html(output);
        },
        formatPosition: function (point, sourceProj) {
            var geom = point.clone().transform(sourceProj, 'EPSG:4326');
            var coords = geom.getCoordinates();
            var coord_x = coords[0].toFixed(6);
            var coord_y = coords[1].toFixed(6);
            return coord_x + ', ' + coord_y;
        },

        activateForm: function (feature) {

            var _this = this;
            var $featureName = $('#feature-name');
            var $geometryType = $('#geometry-type');
            var $measureLabel = $('#measure-label');
            var $measureUnits = $('#measure-units');
            var $geodesic = $('#geodesic');
            var measure;
            var $deleteHole = $('#delete-hole');
            var $featureType = $('#feature-type');
            var feature_type = feature.get('type');
            var $heightSpinner = $('#height-spinner');
            var $heightSlider = $('#height-slider');
            var $thicknessSpinner = $('#thickness-spinner');
            var $thicknessSlider = $('#thickness-slider');

            $('#featureproperties').show();

            $('#feature-name-label').removeClass('disabled');
            $featureName.removeClass('ui-state-disabled');
            $featureName.val(feature.get('name'));

            $('#geometry-type-label').removeClass('disabled');
            $geometryType.val(feature.getGeometry().getType());

            $measureLabel.removeClass('disabled');
            if (feature.getGeometry().getType().endsWith('Polygon')) {
                $measureLabel.html('Area');
                measure = this.formatArea;
            } else if (feature.getGeometry().getType().endsWith('LineString')) {
                $measureLabel.html('Length');
                measure = this.formatLength;
            } else if (feature.getGeometry().getType().endsWith('Point')) {
                $measureLabel.html('Lon, Lat');
                measure = this.formatPosition;
            }
            $geodesic.checkboxradio('enable');
            $measureUnits.selectmenu('enable');
            measure(feature.getGeometry(), map.getView().getProjection());
            this.geometrylistener = feature.getGeometry().on('change', function (evt) {
                measure(evt.target, map.getView().getProjection());
            });
            $geodesic.on('change', function () {
                // For some reason this checkbox doesn't auto reset on change, so we force a refresh here.
                $(this).checkboxradio("refresh");
                measure(_this.geometrylistener.target, map.getView().getProjection());
            });

            if (feature.getGeometry().getType().endsWith('Polygon')) {
                $('#hole-label').removeClass('disabled');
                $('#draw-hole').button('enable');
                if (feature.getGeometry().getType() === 'MultiPolygon') {
                    var nPolygons = feature.getGeometry().getPolygons().length;
                    for (var i = 0; i < nPolygons; i++)
                        if (feature.getGeometry().getPolygon(i).getLinearRingCount() > 1) {
                            $deleteHole.button('enable');
                        }
                } else if (feature.getGeometry().getLinearRingCount() > 1) {
                    $deleteHole.button('enable');
                }
            }

            $('#feature-type-label').removeClass('disabled');
            $featureType.selectmenu('enable');
            for (var key in tobjectTemplates) {
                if (feature.getGeometry().getType().endsWith(tobjectTemplates[key]["geometry_type"])) {
                    $featureType.append(utils.createMenuOption(key));
                }
            }
            $featureType.append(utils.createMenuOption('generic'));

            if (!(feature_type && feature_type in tobjectTemplates)) {
                feature_type = 'generic';
            }
            $('#feature-type-button').find('.ui-selectmenu-text').text(feature_type);
            $featureType.val(feature_type);

            var feature_properties = tobjectTemplates[feature_type];

            if (feature_properties['height']) {
                $('#height-label').removeClass('disabled');
                $heightSpinner.spinner('enable');
                $heightSlider.slider('enable');
                $heightSpinner.spinner("value", feature.get('height') || feature_properties['height']);
            }

            if (feature_properties['thickness']) {
                $('#thickness-label').removeClass('disabled');
                $thicknessSpinner.spinner('enable');
                $thicknessSlider.slider('enable');
                $thicknessSpinner.spinner("value", feature.get('thickness') || feature_properties['thickness']);
            }
        },
        changeFeatureType: function (feature_type) {
            var feature_properties = tobjectTemplates[feature_type];

            var $featureName = $('#feature-name');
            for (var key in tobjectTemplates) {
                if (tobjectTemplates[key]["geometry_type"]) {
                    if ($('#geometry-type').val().startsWith(tobjectTemplates[key]["geometry_type"])) {
                        if ($featureName.val().startsWith(key.capitalizeFirstLetter())) {
                            $featureName.val($featureName.val().replace(key.capitalizeFirstLetter(), feature_type.capitalizeFirstLetter()));
                        }
                    }
                } else if (key === 'generic') {
                    if ($featureName.val().startsWith(key.capitalizeFirstLetter())) {
                        $featureName.val($featureName.val().replace(key.capitalizeFirstLetter(), feature_type.capitalizeFirstLetter()));
                    }
                }
            }

            $('#feature-type').val(feature_type);

            var $heightSpinner = $('#height-spinner');
            var $heightSlider = $('#height-slider');
            if (!($heightSpinner.spinner('option', 'disabled') || feature_properties['height'])) {
                $heightSpinner.spinner("value", 0);
                $heightSlider.slider("value", 0);
                $heightSpinner.spinner('disable');
                $heightSlider.slider('disable');
                $('#height-label').addClass('disabled');
            } else if ($heightSpinner.spinner('option', 'disabled') && feature_properties['height']) {
                $heightSpinner.spinner("value", feature_properties['height']);
                $heightSlider.slider("value", feature_properties['height']);
                $heightSpinner.spinner('enable');
                $heightSlider.slider('enable');
                $('#height-label').removeClass('disabled');
            }

            var $thicknessSpinner = $('#thickness-spinner');
            var $thicknessSlider = $('#thickness-slider');
            if (!($thicknessSpinner.spinner('option', 'disabled') || feature_properties['thickness'])) {
                $thicknessSpinner.spinner("value", 0);
                $thicknessSlider.slider("value", 0);
                $thicknessSpinner.spinner('disable');
                $thicknessSlider.slider('disable');
                $('#thickness-label').addClass('disabled');
            } else if ($thicknessSpinner.spinner('option', 'disabled') && feature_properties['thickness']) {
                $thicknessSpinner.spinner("value", feature_properties['thickness']);
                $thicknessSlider.slider("value", feature_properties['thickness']);
                $thicknessSpinner.spinner('enable');
                $thicknessSlider.slider('enable');
                $('#thickness-label').removeClass('disabled');
            }
            return this;
        },
        loadFeature: function (feature) {
            if (feature.get('name')) {
                feature.set('name', $('#feature-name').val());
            }
            if (feature.get('type')) {
                feature.set('type', $('#feature-type').val());
            }

            // feature.set('height', $('#height-spinner').spinner("value"));
            var $heightSpinner = $('#height-spinner');
            if ($heightSpinner.spinner("value")) {
                feature.set('height', $heightSpinner.spinner("value"));
            }

            // feature.set('thickness', $('#thickness-spinner').spinner("value"));
            var $thicknessSpinner = $('#thickness-spinner');
            if ($thicknessSpinner.spinner("value")) {
                feature.set('thickness', $thicknessSpinner.spinner("value"));
            }
        },
        deactivateForm: function () {

            var $featureName = $('#feature-name');
            var $featureType = $('#feature-type');
            var $heightSpinner = $('#height-spinner');
            var $heightSlider = $('#height-slider');
            var $thicknessSpinner = $('#thickness-spinner');
            var $thicknessSlider = $('#thickness-slider');
            var $geodesic = $('#geodesic');

            $featureName.val(null);
            $featureName.addClass('ui-state-disabled');

            $('#geometry-type').val(null);

            $geodesic.off('change');
            ol.Observable.unByKey(this.geometrylistener);
            this.geometrylistener = null;
            $geodesic.checkboxradio('disable');
            $('#measure').html(null);
            $('#measure-label').html('Measure');
            $('#measure-units').selectmenu('disable');
            $('#measure-units-button').find('.ui-selectmenu-text').html('&nbsp;');

            $featureType.empty();
            $featureType.val('');
            $('#feature-type-button').find('.ui-selectmenu-text').html('&nbsp;');
            $featureType.selectmenu('disable');

            $('#draw-hole').button('disable');
            $('#delete-hole').button('disable');

            // $heightSpinner.spinner("value", null);
            // $heightSlider.slider("value", 0);
            $heightSpinner.spinner('disable');
            $heightSlider.slider('disable');

            // $thicknessSpinner.spinner("value", null);
            // $thicknessSlider.slider("value", 0);
            $thicknessSpinner.spinner('disable');
            $thicknessSlider.slider('disable');

            $('.form-label').addClass('disabled');
        }
    }
});