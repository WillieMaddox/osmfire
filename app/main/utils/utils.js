/**
 * Created by maddoxw on 1/3/17.
 */

define([], function () {

    var utils = {};

    utils.FID = (function () {
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
        var seed;
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
                for (var i = 0; i < idlength; i++) {
                    t = Math.floor(z / Math.pow(chlength, i)) % chlength;
                    idtag += chars.charAt(t);
                }
                return idtag;
            }
        }
    })();

    utils.log10Slider = function (pval) {
        var lval = 0;
        if (pval > 0.1) {
            lval = 25.0 * (Math.log10(pval) + 1.0);
        }
        return lval;
    };
    utils.pow10Slider = function (lval) {
        var pval = 0;
        if (lval > 0) {
            pval = Math.pow(10, (lval / 25 - 1));
        }
        return String(pval);
    };

    utils.createLabel = function (label) {
        var $label = $('<label>');
        $label.attr('for', label);
        return $label;
    };
    utils.createInput = function (name, type) {
        var $input = $('<input>');
        $input.name = name;
        $input.type = type;
        $input.required = true;
        return $input;
    };
    utils.createMenu = function (name, id) {
        var $menu = $('<select>');
        $menu.name = name;
        $menu.type = "text";
        $menu.id = id;
        return $menu;
    };
    utils.createMenuOption = function (value, text) {
        var $option = $('<option>');
        $option.val(value);
        $option.text(text || value);
        return $option;
    };

    return utils
});