/*global template, setThemeImageColor*/

/**
 * Provides controller for popular applications list.
 * @class popularController
 * @module StoreApplication
 * @static
 **/

/**
 * Hols popular apps model.
 * @property popularAppsModel
 * @type object
 * @default null
 * @static
 **/
var popularAppsModel = null;
/**
 * Holds popular apps model length.
 * @property popularAppsModelLenght
 * @type int
 * @default null
 * @static
 **/
var popularAppsModelLenght;
var popularController = {
		/**
		 * Adds header bar to store app.
		 * @method addHeader
		 **/
		addHeader: function () {
			"use strict";
			$('#appDetailWraper').append('<div class="popularHeader fontSizeXLarge fontWeightBold fontColorDark">MOST POPULAR</div>');
			$('#appDetailWraper').append('<div id="popularApps" class="popularAppsContainer"></div>');
		},
		/**
		 * Creates store view based on model parameter.
		 * @method fillView
		 * @param model {array} Contains array of objects which holds popular apps informations.
		 **/
		fillView: function (model) {
			"use strict";
			popularAppsModelLenght = model.length;
			console.log("filling popular view with " + popularAppsModelLenght + " items");
			var i;
			for (i = 0; i < popularAppsModelLenght; i++) {
				model[i].index = i;
			}
			template.compile(model, "templates/popularAppsContainer.html", "#popularApps", function () {
				setThemeImageColor();
			});
		}
	};