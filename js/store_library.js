/*global PackageRepository, setThemeImageColor, GRID_TAB, LIST_TAB, Config, AppModel, popularAppsModel, popularController */

/**
 * Provides implementation of {{#crossLink "Library"}}{{/crossLink}} object for Store application. Applications are displayed in
 * following hierarchy:
 *
 * * List of application categories
 *   * List of applications for one category
 *      * Application detail
 *
 *
 * @class StoreLibrary
 * @module StoreApplication
 * @static
 **/

/**
 * Holds array of apps categories.
 * @property _categories
 * @type array
 * @default empty
 * @static
 **/
var _categories = [];

/**
 * Holds object of selected apps category.
 * @property _selectedCategory
 * @type object
 * @default empty
 * @static
 **/
var _selectedCategory = {};

/**
 * Hols array of apps in selected category.
 * @property _categoryApplications
 * @type array
 * @default empty
 * @static
 **/
var _categoryApplications = [];

/**
 * Hols object of selected app detailed informations.
 * @property _selectedCategory
 * @type object
 * @default empty
 * @static
 **/
var _applicationDetail = {};

/**
 * Hols object of instalation timer.
 * @property _progress
 * @type timer
 * @default null
 * @static
 **/
var _progress;

/**
 * Hols object of uninstalation timer.
 * @property _unProgress
 * @type timer
 * @default null
 * @static
 **/
var _unProgress;

/**
 * Hols object of package repository.
 * @property packageRepository
 * @type PackageRepository
 * @default null
 * @static
 **/
var packageRepository;

var StoreLibrary = {
		/**
		 * Indicates if store library is initialized.
		 * @property initialized
		 * @type bool
		 * @default false
		 **/
		initialized: false,
		/**
		 * Provides initialization of store library.
		 * @method init
		 * @param showApps {bool} If true shows apps in store library ordered by category ID.
		 **/
		init: function (showApps) {
			"use strict";
			$('#storeLibrary').library("setSectionTitle", "APP STORE");
			$('#storeLibrary').library("init");

			if (_categories.length > 0 ) {
				StoreLibrary.showStoreLibrary(showApps);
			} else {
				if (typeof PackageRepository !== 'undefined') {
					packageRepository = new PackageRepository();
					packageRepository.getCategories(function (jsonObject) {
						if ((typeof jsonObject).toLowerCase() === "string") {
							try {
								_categories = JSON.parse(jsonObject);
							} catch (error) {
								console.log("Unable to parse categories: " + error.message);
							}
						} else {
							_categories = jsonObject;
						}
						StoreLibrary.showStoreLibrary();
					}, function(error) {
						_categories.length = 0;
						_categories.push({"id": "system", "description": "", "name": "System", "url": "/packageRepository/category?id=system"});
						StoreLibrary.showStoreLibrary();
					});
				} else {
					console.warn("packageRepository is not available.");
				}
			}
		},

		/**
		 * Shows library of apps in Store application.
		 * @method show
		 **/
		show: function () {
			"use strict";
			$('#storeLibrary').library("showPage");
		},

		/**
		 * Builds and displays the Store library view
		 * @method showStoreLibrary
		 * @param showApps {bool} indicator
		 **/
		showStoreLibrary: function (showApps) {
			"use strict";
			var i = 0;
			for (i = 0; i < _categories.length; ++i) {
				if (i === 0) {
					_categories[i].selected = true;
					_selectedCategory = _categories[i];
					if (showApps === true || showApps === undefined) {
						StoreLibrary.showAppsByCategoryId(_selectedCategory.id);
					}
				}
				_categories[i].text = _categories[i].name;
				_categories[i].action = "StoreLibrary.showAppsByCategoryId('" + _categories[i].id + "');";
			}

			var tabMenuModel = {
					Tabs: _categories
				};

			$('#storeLibrary').library("tabMenuTemplateCompile", tabMenuModel, function() {
				setThemeImageColor();
			});

			$('#storeLibrary').bind('eventClick_GridViewBtn', function () {
				$('#storeLibrary').library('closeSubpanel');
				StoreLibrary.showAppsByCategoryId(_categories[$('#storeLibrary').library('getSelectetTopTabIndex')].id);
			});

			$('#storeLibrary').bind('eventClick_ListViewBtn', function () {
				$('#storeLibrary').library('closeSubpanel');
				StoreLibrary.showAppsByCategoryId(_categories[$('#storeLibrary').library('getSelectetTopTabIndex')].id);
			});

			$('#storeLibrary').bind('eventClick_SearchViewBtn', function () {

			});

			$('#storeLibrary').bind('eventClick_menuItemBtn', function (e, data) {
				$('#storeLibrary').library('closeSubpanel');
				StoreLibrary.showAppsByCategoryId(_categories[$('#storeLibrary').library('getSelectetTopTabIndex')].id);
			});

			$('#storeLibrary').bind('eventClick_closeSubpanel', function () {
				StoreLibrary.showAppsByCategoryId(_categories[$('#storeLibrary').library('getSelectetTopTabIndex')].id);
			});

			var heightWithoutScrollbar = $('#libraryTabsID').scrollHeight;
			$('#libraryTopPanel').height($('#libraryTopPanel').height() - heightWithoutScrollbar);
			StoreLibrary.initialized = true;
			StoreLibrary.show();
		},

		/**
		 * Sets category and detail of application.
		 * @method setAppDetailAndCategory
		 * @param categoryID {int} Contains ID of category to set.
		 * @param applicationID {int} Contains ID of app to show details.
		 **/
		setAppDetailAndCategory: function (categoryID, applicationID) {
			"use strict";
			var tabID = 0, i = 0;
			for (i = 0; i < _categories.length; i++) {
				if (_categories[i].id === categoryID) {
					tabID = i;
					break;
				}
			}
			$('#storeLibrary').library('setTopTabIndex', tabID);
			if (!StoreLibrary.initialized) {
				StoreLibrary.init(false);
			}
			StoreLibrary.openAppDetail(applicationID);
			setThemeImageColor();
			StoreLibrary.show();
		},

		/**
		 * Shows apps sorted by specific categry.
		 * @method showAppsByCategoryId
		 * @param categoryID {int} Contains ID of category.
		 **/
		showAppsByCategoryId: function (categoryID) {
			"use strict";
			packageRepository.getCategoryApplications(categoryID, function (jsonObject) {
				if ((typeof jsonObject).toLowerCase() === "string") {
					try {
						_categoryApplications = JSON.parse(jsonObject);
					} catch (error) {
						console.log("Unable to parse category applications: " + error.message);
					}
				} else {
					_categoryApplications = jsonObject;
				}

				switch ($('#storeLibrary').library('getSelectetLeftTabIndex')) {
				case GRID_TAB:
					StoreLibrary.renderAppsGridView(_categoryApplications);
					break;
				case LIST_TAB:
					StoreLibrary.renderAppsListView(_categoryApplications);
					break;
				default:
					break;
				}
			});
		},

		/**
		 * Shows apps in grid view.
		 * @method renderAppsGridView
		 * @param model {object} Contains model of applications.
		 **/
		renderAppsGridView: function (model) {
			"use strict";
			$('#storeLibrary').library("setContentDelegate", "templates/storeLibraryAppsDelegate.html");
			$('#storeLibrary').library("contentTemplateCompile", model, "storeLibraryContentGrid", function() {
				setThemeImageColor();
			});
		},

		/**
		 * Shows apps in list view.
		 * @method renderAppsGridView
		 * @param model {object} Contains model of applications.
		 **/
		renderAppsListView: function (model) {
			"use strict";
			$('#storeLibrary').library("setContentDelegate", "templates/storeLibraryAppsDelegate.html");
			$('#storeLibrary').library("contentTemplateCompile", model, "storeLibraryContentList", function() {
				setThemeImageColor();
			});
		},

		/**
		 * If model of an app dosen't contain screenshot, function set default one to model.
		 * @method enhanceModelsUrls
		 * @param appDetail {array} Contains array of objects which holds promotedapps informations.
		 * @return appDetail {array} Returns enhanced model of promoted apps.
		 **/
		enhanceModelUrls: function (appDetail) {
			"use strict";
			appDetail.imageObjects = [];
			if (!!appDetail.screenshots) {
				$.each(appDetail.screenshots, function (imageIndex, urlobject) {
					appDetail.imageObjects.push({
						url: Config.httpPrefix + urlobject
					});
				});
			}
			return appDetail;
		},

		/**
		 * Opens app detail view.
		 * @method openAppDetail
		 * @param appID {string} Contains ID of app to show detail of it.
		 **/
		openAppDetail: function (appID) {
			"use strict";
			packageRepository.getApplicationDetail(appID, function (jsonObject) {
				// _applicationDetail = jsonObject;
				_applicationDetail = StoreLibrary.enhanceModelUrls(jsonObject[0]);
				StoreLibrary.renderAppDetailView(_applicationDetail);
			});
		},

		/**
		 * Creates detail view of app.
		 * @method renderAppDetailView
		 * @param app {object} Contains object with app data.
		 **/
		renderAppDetailView: function (app) {
			"use strict";
			var subpanelModel = {
					/* jshint camelcase: false */
					textTitle: StoreLibrary.getCategoryTitleById(app.category_id),
					/* jshint camelcase: true */
					textSubtitle: app.name || "-"
				};
			$('#storeLibrary').library("subpanelContentTemplateCompile", subpanelModel, function () {
				$("#libraryTopSubPanelTitle").boxCaptionPlugin('initSmall', subpanelModel.textTitle);
			});
			$('#storeLibrary').library('showSubpanel');
			$('#storeLibrary').library("setContentDelegate", "templates/detailApplicationContainer.html");
			$('#storeLibrary').library("contentTemplateCompile", app, "", function () {
				setThemeImageColor();

				var height = $('#storeLibrary').height();
				if ($("#libraryTopPanel").is(":visible")) {
					height = height - $("#libraryTopPanel").outerHeight();
				}
				if ($("#libraryTopSubPanel").is(":visible")) {
					height = height - $("#libraryTopSubPanel").outerHeight();
				}
				height = height - $('.appDetail').outerHeight();
				$('.infoWrapper').height(height);
			});
		},

		/**
		 * Creates search view in store.
		 * @method renderSearchView
		 **/
		renderSearchView: function () {
			"use strict";
			$('#storeLibrary').library("clearContent");
		},

		/**
		 * Returns title of a category based on category ID.
		 * @method getCategoryTitleById
		 * @param categoryID {string} Contains object with app data.
		 * @return {string} Title of category.
		 **/
		getCategoryTitleById: function (categoryID) {
			"use strict";
			var i = 0;
			for (i = 0; i < _categories.length; i++) {
				if (_categories[i].id === categoryID) {
					return _categories[i].name;
				}
			}
			return "-";
		},

		/**
		 * Install a new app based on app id.
		 * @method installApp
		 * @param id {string} Contains app id.
		 **/
		installApp: function (id) {
			"use strict";
			console.log('INSTALL APP... ' + id);

			StoreLibrary.displayInstallProgress(true, 0);
			packageRepository.install(id, function (instError) {
				packageRepository.getApplicationDetail(id, function (appDetail) {
					if (instError) {
						appDetail[0].installed = false;
						StoreLibrary.installResult(instError, true, appDetail[0]);
					} else {
						appDetail[0].installed = true;
						StoreLibrary.installResult(null, true, appDetail[0]);
					}
				});
			});
		},

		/**
		 * Uninstall a new app based on app id.
		 * @method uninstallApp
		 * @param id {string} Contains app id.
		 **/
		uninstallApp: function (id) {
			"use strict";
			console.log('UNINSTALL APP... ' + id);
			StoreLibrary.displayInstallProgress(false, 0);
			packageRepository.uninstall(id, function (jsonObject) {
				var instError = jsonObject.error;
				if (!!instError) {
					packageRepository.getApplicationDetail(id, function (appDetail) {
						appDetail[0].installed = true;
						StoreLibrary.installResult(instError, false, appDetail[0]);
					});
				} else {
					packageRepository.getApplicationDetail(id, function (appDetail) {
						appDetail[0].installed = false;
						StoreLibrary.installResult(instError, false, appDetail[0]);
					});
				}
			});
		},

		/**
		 * Called as callback after installing or uninstalling application.
		 * @method installResult
		 * @param error {bool} Error indicator.
		 * @param install {bool} Indicates if app was installed (true) or uninstalled (false).
		 * @param app {object} Object of app which was installed/uninstalled.
		 **/
		installResult: function (error, install, app) {
			"use strict";
			var instLabel1 = 'INSTALLATION';
			var instLabel2 = 'INSTALLED';
			if (install === false) {
				instLabel1 = 'UNINSTALLATION';
				instLabel2 = 'UNINSTALLED';
			}
			if (!!error) {
				$('#installText').html(instLabel1 + ' FAILED');
			} else {
				$('#installText').html(instLabel2 + ' SUCCESSFULLY');
				$('#installBar').css({
					width: '100%'
				});
			}
			setTimeout(function () {
				/* jshint camelcase: false */
				if (app.category_id === "system") {
				/* jshint camelcase: true */
					var appToRemoveIndex = AppModel.indexOf(app);
					if (appToRemoveIndex >= 0) {
						AppModel.splice(appToRemoveIndex, 1);
					}
					/* jshint camelcase: false */
					StoreLibrary.showAppsByCategoryId(app.category_id);
					/* jshint camelcase: true */
					$('#storeLibrary').library('closeSubpanel');
				} else {
					StoreLibrary.renderAppDetailView(app);
					StoreLibrary.refreshPopularApps(app);
				}
			}, 3000);
		},

		/**
		 * Displays progress of installation or uninstallation.
		 * @method displayInstallProgress
		 * @param install {bool} Indicates if app was installed (true) or uninstalled (false).
		 **/
		displayInstallProgress: function (install, percent) {
			"use strict";
			if (install === false) {
				$('#installText').html('UNINSTALLING...');
			}
			$('.textPanel').css('display', 'inline-block');
			$('.installButtons').css('display', 'none');
			$('#installBar').css({
				width: percent + '%'
			});

		},

		/**
		 * Updates the model object and rerenders popular apps view
		 * @method refreshPopularApps
		 * @param app updated application object
		 **/
		refreshPopularApps: function (app) {
			"use strict";
			for (var i in popularAppsModel) {
				if (popularAppsModel[i].id === app.id) {
					popularAppsModel[i].installed = app.installed;
					popularController.fillView(popularAppsModel);
					break;
				}
			}
		}
	};