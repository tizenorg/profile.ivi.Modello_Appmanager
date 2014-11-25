/*global Bootstrap, StoreLibrary, PackageRepository, packageRepository, template, Speech, AppModel, ThemeKeyColor, _applicationDetail, _categories, popularAppsModel, popularController */

/**
 * Store application provides access to [remote package server](../../package_server/index.html) with installable WGT packages. Packages are grouped
 * into package categories like *System*, *Utilities* or *Media*. Package server takes following information from WGT
 * package `config.xml` file:
 *
 * * application icon
 * * application name
 * * application version
 *
 * Package server provides additional metadata processed by Store application:
 *
 * * application rating
 * * category
 * * application description
 * * price for application
 * * application screenshots
 * * flag assigning application into Promoted and/or Popular groups
 *
 * Store application uses {{#crossLink "PackageRepository"}}{{/crossLink}} class to download, install and uninstall applications.
 *
 * Package server address and credentials can be configured by updating {{#crossLink "Store/Config:property"}}{{/crossLink}} property.
 * Please refer to [Package server documenation](../../package_server/index.html) for more details.
 *
 * Hover and click on elements in images below to navigate to components of Store application.
 *
 * <img id="Image-Maps_1201312180420487" src="../assets/img/store.png" usemap="#Image-Maps_1201312180420487" border="0" width="649" height="1152" alt="" />
 *   <map id="_Image-Maps_1201312180420487" name="Image-Maps_1201312180420487">
 *     <area shape="rect" coords="0,0,573,78" href="../classes/TopBarIcons.html" alt="top bar icons" title="Top bar icons" />
 *     <area shape="rect" coords="0,77,644,132" href="../classes/Clock.html" alt="clock" title="Clock"    />
 *     <area shape="rect" coords="0,994,644,1147" href="../classes/BottomPanel.html" alt="bottom panel" title="Bottom panel" />
 *     <area shape="rect" coords="573,1,644,76" href="../modules/Settings.html" alt="Settings" title="Settings" />
 *     <area  shape="rect" coords="497,135,648,178" alt="Store Library" title="Store Library" target="_self" href="../classes/StoreLibrary.html"     >
 *     <area  shape="rect" coords="0,476,648,1001" alt="Popular applications" title="Popular applications" target="_self" href="../classes/popularController.html"     >
 *     <area  shape="rect" coords="1,188,648,457" alt="Promoted applications" title="Promoted applications" target="_self" href="../classes/Store.html#property_promotedApplicationsModel"     >
 *   </map>
 *
 * @module StoreApplication
 * @main StoreApplication
 * @class Store
 **/

var moved = false;

/**
 * Configuration object holding url and authentication access to remote store server
 * @property Config
 * @static
 **/
var Config = {
	httpPrefix: "http://localhost:80",
	username: "intel",
	pwd: "TiZ3N456!",
	defaultIcon: "css/car/images/default_icon.png"
};

/**
 * Reference to instance of object holding data about promoted applications
 * @property promotedApplicationsModel {Object}
 */
var promotedApplicationsModel;

/**
 * Object handling speech commands to install or uninstall application
 * @property speechObj {Object}
 */
var speechObj;

/**
 * Object holding data about apps installed on the device
 * @property installedApps {Object}
 */
var installedApps;

var bootstrap;

/**
 * Method fills Promoted Applications carousel with data and rendering
 * @method setupCarousel
 * @static
 **/
function setupCarousel() {
	"use strict";
	template.compile(promotedApplicationsModel, "templates/carouselDelegate.html", "#carousel_wrap", function() {
		$('#carousel_wrap').carouFredSel({
			auto: false,
			width: 720,
			items: {
				visible: 3
			},
			swipe: {
				onMouse: true,
				onTouch: true
			},
			scroll: {
				items: 1
			}
		});

		$('.carouselItem').on("touchstart", function (event) {
			moved = false;
		});

		$('.carouselItem').on("touchmove", function (event) {
			moved = true;
		});
	});
}

/**
 * Function invoked after `touchend` event on the carousel item
 * @method triggerTouchEnd
 * @param cat {String} Category
 * @param app {String} Application
 * @static
 **/
function triggerTouchEnd(cat, app) {
	"use strict";
	if (moved === false) {
		StoreLibrary.setAppDetailAndCategory(cat, app);
	}
}

/**
 * Adds http prefix to application icons' urls for apps from the store
 * @method enhanceModelUrls
 * @static
 **/
function enhanceModelUrls(model) {
	"use strict";
	$.each(model, function (itemIndex, item) {
		if (item.iconUrl.indexOf(Config.httpPrefix) < 0) {
			item.iconUrl = Config.httpPrefix + item.iconUrl;
		}
	});
}

/**
 * Looks for application icon file and provides a path to default one if not found
 * @method getAppIcon
 * @static
 **/
function getAppIcon(appIconPath, callback) {
	"use strict";
	try {
		tizen.filesystem.resolve("file://"+appIconPath, function (iconFile) {
			callback(iconFile.fullPath);
		}, function (error) {
			callback(Config.defaultIcon);
		});
	} catch(ex) {
		console.log("EXCEPTION when trying to find icon file: " + ex.message);
	}
}

/**
 * Applies selected theme to application icons
 * @method setThemeImageColor
 * @static
 **/
function setThemeImageColor() {
	"use strict";
	var imageSource;
	$('body').find('img').each(function() {
		var self = this;
		imageSource = $(this).attr('src');

		if (typeof(imageSource) !== 'undefined' && $(this.parentElement).hasClass('themeImage') === false &&
			(imageSource.indexOf(Config.httpPrefix) >= 0 || imageSource.indexOf('base64') >= 0)) {
			var img = new Image();
			var ctx = document.createElement('canvas').getContext('2d');
			img.onload = function () {
				var w = ctx.canvas.width = img.width;
				var h = ctx.canvas.height = img.height;
				ctx.fillStyle = ThemeKeyColor;
				ctx.fillRect(0, 0, w, h);
				ctx.globalCompositeOperation = 'destination-in';
				ctx.drawImage(img, 0, 0);

				$(self).attr('src', ctx.canvas.toDataURL());
				$(self).hide(0, function() { $(self).show();});
			};

			img.src = imageSource;
		}
	});
}

/**
 * Sets up voice recognition listeners for un/installing applications
 * @method setupSpeechRecognition
 * @static
 **/
function setupSpeechRecognition() {
	"use strict";
	console.log("Store setupSpeechRecognition");
	Speech.addVoiceRecognitionListener({
		onapplicationinstall : function() {
			console.log("Speech application install invoked");
			if (_applicationDetail.id !== undefined && $('#storeLibrary').library('isVisible') &&
				(!_applicationDetail.installed || _applicationDetail.installed === false)) {
				StoreLibrary.installApp(_applicationDetail.id);
			}
		},
		onapplicationuninstall : function() {
			console.log("Speech application uninstall invoked");
			if (_applicationDetail.id !== undefined && $('#storeLibrary').library('isVisible') && _applicationDetail.installed === true) {
				StoreLibrary.uninstallApp(_applicationDetail.id);
			}
		}

	});
}

/**
 * Applies Base64 conversion to icon urls in the model
 * @method setThemeIconColorBeforeRender
 * @static
 **/
function setThemeIconColorBeforeRender(model) {
	"use strict";
	if (!!model) {
		$.each(model, function (itemIndex, item) {
			if (item.iconUrl.indexOf(Config.httpPrefix) >= 0 || item.iconUrl.indexOf('base64') >= 0 || item.iconUrl.indexOf('intelPoc') >= 0) {
				var img = new Image();
				var aIcon = item.iconUrl;
				var ctx = document.createElement('canvas').getContext('2d');
				img.onload = function () {
					var w = ctx.canvas.width = img.width;
					var h = ctx.canvas.height = img.height;
					ctx.fillStyle = ThemeKeyColor;
					ctx.fillRect(0, 0, w, h);
					ctx.globalCompositeOperation = 'destination-in';
					ctx.drawImage(img, 0, 0);
					item.iconUrl = ctx.canvas.toDataURL();
				};

				img.src = item.iconUrl;
			}
		});
	}
}

/**
 * Loads store data and builds the page based on the data
 * @method loadUi
 * @static
 **/
function loadUi() {
	"use strict";
	var self;
	packageRepository = new PackageRepository();
	packageRepository.availableApplications(function (appData) {
		AppModel = appData;
		enhanceModelUrls(AppModel);
		setThemeIconColorBeforeRender(AppModel);

		promotedApplicationsModel = packageRepository.getPromotedApplications();
		setTimeout(function() {
			setupCarousel();

			packageRepository.getAppsInfo(function (appsInfo) {
				installedApps = appsInfo;
				var appsNotInStore = [];
				var foundInStore = false;
				var appsLength = appsInfo.length;
				var appModelLength = AppModel.length;

				var processApplication = function(i) {
					for (var j = 0; j < appModelLength; j++) {
						if (appsInfo[i].name === AppModel[j].name) {
							foundInStore = true;
							AppModel[j].installed = true;

							break;
						} else if (!AppModel[j].installed) {
							AppModel[j].installed = false;
						}
					}
					if (foundInStore === false &&
						(appsInfo[i].name.toLowerCase() !== "store" && appsInfo[i].name.toLowerCase() !== "homescreen" && appsInfo[i].name.toLowerCase() !== "home screen")) {
						var appNotInStore = {};
						appNotInStore.id = appsInfo[i].id;
						appNotInStore.name = appsInfo[i].name;
						appNotInStore.version = 0;
						appNotInStore.silentInstall = false;
						/* jshint camelcase: false */
						appNotInStore.category_id = "system";
						/* jshint camelcase: true */
						appNotInStore.price = "0";
						appNotInStore.rating = "0";
						appNotInStore.description = "";
						appNotInStore.isPromoted = false;
						appNotInStore.isPopular = false;
						appNotInStore.screenshots = [];
						appNotInStore.downloadUrl = "";
						getAppIcon(appsInfo[i].iconPath, function(resolvedPath) {
							appNotInStore.iconUrl = resolvedPath;
						});
						appNotInStore.installed = true;
						AppModel.push(appNotInStore);
					}
					foundInStore = false;
				};

				for (var i = 0; i < appsLength; i++) {
					processApplication(i);
				}
				popularAppsModel = packageRepository.getPopularApplications();
				popularController.addHeader();
				popularController.fillView(popularAppsModel);
			});

		},500);
	}, function() {
			packageRepository.getAppsInfo(function (appsInfo) {
				installedApps = appsInfo;
				var appsNotInStore = [];
				var appsLength = appsInfo.length;

				var processApplication = function(i) {
					if (appsInfo[i].name.toLowerCase() !== "store" && appsInfo[i].name.toLowerCase() !== "homescreen" && appsInfo[i].name.toLowerCase() !== "home screen") {
						var appNotInStore = {};
						appNotInStore.id = appsInfo[i].id;
						appNotInStore.name = appsInfo[i].name;
						appNotInStore.version = 0;
						appNotInStore.silentInstall = false;
						/* jshint camelcase: false */
						appNotInStore.category_id = "system";
						/* jshint camelcase: true */
						appNotInStore.price = "0";
						appNotInStore.rating = "0";
						appNotInStore.description = "";
						appNotInStore.isPromoted = false;
						appNotInStore.isPopular = false;
						appNotInStore.screenshots = [];
						appNotInStore.downloadUrl = "";
						getAppIcon(appsInfo[i].iconPath, function(resolvedPath) {
							appNotInStore.iconUrl = resolvedPath;
						});
						appNotInStore.installed = true;
						AppModel.push(appNotInStore);
					}
				};

				for (var i = 0; i < appsLength; i++) {
					processApplication(i);
				}
			});
	});
	packageRepository.getCategories(function (catData) {
		_categories = catData;
	});

}

/**
 * Initialize plugins and register events for Store app.
 * @method init
 * @static
 **/
var init = function () {
	"use strict";
	bootstrap = new Bootstrap(function (status) {
		$("#topBarIcons").topBarIconsPlugin('init', 'store');
		$("#clockElement").ClockPlugin('init', 5);
		$("#clockElement").ClockPlugin('startTimer');
		$('#bottomPanel').bottomPanel('init');

		loadUi();
		if (tizen.speech) {
			setupSpeechRecognition();
		} else {
			console.log("Store: Speech Recognition not running, voice control will be unavailable");
		}

		bootstrap.themeEngine.addStatusListener(function (eData) {
			setThemeImageColor();
		});
	});
};

$(document).ready(init);

/**
 * Opens store library after it's initialization or initialize library if it's not.
 * @method openStoreLibrary
 * @static
 **/
function openStoreLibrary() {
	"use strict";
	if (!StoreLibrary.initialized) {
		StoreLibrary.init();
	} else {
		StoreLibrary.show();
	}
	setThemeIconColorBeforeRender(AppModel);
}
