/*global Config, StoreLibrary, _applicationDetail, installedApps */

/**
 * Provides Javascript wrapper around AJAX-based requests to package server providing categories, lists of applications,
 * download (using [tizen.download API](https://developer.tizen.org/dev-guide/2.2.1/org.tizen.web.device.apireference/tizen/download.html))
 * and allows installation or uninstallation of downloaded packages through
 * [tizen.package API](https://developer.tizen.org/dev-guide/2.2.1/org.tizen.web.device.apireference/tizen/package.html).
 *
 * @class PackageRepository
 * @module StoreApplication
 **/

/**
 * object holding info about applications available on the server as well as apps installed in the system
 * @property AppModel
 * @static
 **/
var AppModel = [];

var PackageRepository = (function() {
    "use strict";
    function PackageRepository() {
        console.info("Starting up PackageRepository");
    }

    PackageRepository.prototype = function() {};

    PackageRepository.prototype._storage = "downloads";

    /**
     * Gets only promoted applications from list of available apps
     * @method getPromotedApplications
     * @param callback {Function(results)} Callback function providing array of promoted applications.
     **/
	PackageRepository.prototype.getPromotedApplications = function (callback) {
        if (AppModel.length === 0) {
            this.availableApplications(function () {
                var result = AppModel.filter(function (app) {
                    return app.isPromoted === true;
                });
                if (callback) {
                    callback(result);
                } else {
                    return result;
                }
            });
        } else {
            var result = AppModel.filter(function (app) {
                return app.isPromoted === true;
            });
            if (callback) {
                callback(result);
            } else {
                return result;
            }
        }
	};

    /**
     * Gets only popular applications from list of available apps
     * @method getPopularApplications
     * @param callback {Function(results)} Callback function providing array of popular applications.
     **/
	PackageRepository.prototype.getPopularApplications = function (callback) {
		var result = AppModel.filter(function (app) {
            return app.isPopular === true;
        });
		if (callback) {
			callback(result);
		} else {
			return result;
		}
	};

    /**
     * Gets list of available categories from package server.
     * @method getCategories
     * @param callback {Function(results)} Callback function providing array of categories.
     * @param errorCallback {Function(error)} Callback function providing error in case if any issue was detected.
     **/
	PackageRepository.prototype.getCategories = function (callback, errorCallback) {
        $.ajax({
            type: 'GET',
            url: Config.httpPrefix + '/packages/categories',
            dataType: 'json',
            async: true,
            username: Config.username,
            password: Config.pwd,
            data:'{}'
            }).done(function(resCategories) {
                console.log('categories: ' + JSON.stringify(resCategories));
                if (callback) {
                    callback(resCategories);
                } else {
                    return resCategories;
                }
        }).fail(function (jqXHR, textStatus) {
            console.log('getCategories fail: ' + textStatus);
            if (errorCallback) {
                errorCallback();
            }
        });

	};

    /**
     * Gets only applications beloging to specified category from list of available apps
     * @method getCategoryApplications
     * @param catId {String} Category identifier.
     * @param callback {Function(results)} Callback function providing array of popular applications.
     **/
	PackageRepository.prototype.getCategoryApplications = function (catId, callback) {
		var result = AppModel.filter(function (app) {
            /* jshint camelcase: false */
            var res = app.category_id === catId;
            /* jshint camelcase: true */
            return res;
        });
		if (callback) {
			callback(result);
		} else {
			return result;
		}
	};

    /**
     * Gets all application data for specified application.
     * @method getApplicationDetail
     * @param appId {String} Application identifier.
     * @param callback {Function(result)} Callback function providing array of popular applications.
     **/
	PackageRepository.prototype.getApplicationDetail = function (appId, callback) {
		var result = AppModel.filter(function (app) {
             return app.id === appId;
        });
		if (callback) {
			callback(result);
		} else {
			return result;
		}
	};

    /**
     * Gets list of available applications from package server.
     * @method availableApplications
     * @param callback {Function(results)} Callback function providing array of applications.
     * @param errorCallback {Function(error)} Callback function providing error in case if any issue was detected.
     **/
    PackageRepository.prototype.availableApplications = function (callback, errorCallback) {
        $.ajax({
            type: 'GET',
            url: Config.httpPrefix + '/packages/available',
            dataType: 'json',
            async: true,
            username: Config.username,
            password: Config.pwd,
            data:'{}'
        }).done(function(resp) {
                if (callback) {
                    callback(resp);
                }
        }).fail(function (jqXHR, textStatus) {
                console.log('availableApplications fail: ' + textStatus);
                if (errorCallback) {
                    errorCallback();
                }
        });
    };


    /**
     * Starts package download identified by applidation identifier via [tizen.download API]()
     * @method downloadApplication
     * @param appId {String} Application Id
     * @param callback {Function(error, appId, packageUri)} Callback function providing information about status about download.
     **/
    PackageRepository.prototype.downloadApplication = function (appId, callback) {
        var listener = {
            onprogress: function(id, receivedSize, totalSize) {
                console.log('Received with id: ' + id + ', ' + receivedSize + '/' + totalSize);
            },
            onpaused: function(id) {
                console.log('Paused with id: ' + id);
            },
            oncanceled: function(id) {
                console.log('Canceled with id: ' + id);
            },
            oncompleted: function(id, fullPath) {
                console.log('Completed with id: ' + id + ', full path: ' + fullPath);
                tizen.filesystem.resolve(fullPath, function (file) {
                    callback(null, id, file.toURI());
                });
            },
            onfailed: function(id, error) {
                console.log('Failed with id: ' + id + ', error name: ' + error.name);
            }
        };

        // Starts downloading of the file from the Web with the corresponding callbacks.
        var downloadRequest = new tizen.DownloadRequest("http://"+Config.username+":"+Config.pwd+"@localhost:80" + _applicationDetail.downloadUrl, "downloads", appId.split("/").pop() + ".wgt");

        var downloadId = tizen.download.start(downloadRequest, listener);
    };

    /**
     * Provides list of installed application using [tizen application API]().
     * @method getAppsInfo
     * @param callback {Function(results)} Callback function providing array of installed applications.
     **/
    PackageRepository.prototype.getAppsInfo = function (callback) {
        try {
            tizen.application.getAppsInfo(function (installedAppData) {
                callback(installedAppData);
            }, function(err) {
                console.log('Failed to get installed apps info.');
            });
        } catch (exc) {
            console.error(exc.message);
        }
    };

    /**
     * Method performs installation of specified application ID using [tizen package API]() by following process:
     *
     * * download package
     * * install package
     * * cleanup of downloaded package
     *
     * @method install
     * @param appId application Id
     * @param callback {Function(error)} Callback function invoked after installation is finished or error occurs.
     **/
    PackageRepository.prototype.install = function (appId, callback) {
        var installationFile;
        var self = this;
        callback = callback || function() {};

        var cleanup = function(err) {
            console.log("Removing installation file " + installationFile);
            tizen.filesystem.resolve(self._storage, function(directory) {
                directory.deleteFile(installationFile,
                    function() {
                        self.getAppsInfo(function (appsInfo) {
                            installedApps = appsInfo;
                            callback(err);
                        });
                    },
                    function(error) { callback(err || error); }
                );
            });
        };

        var onInstallation = {
            onprogress: function(packageId, percentage) {
                console.log("On installation(" + packageId + ") : progress(" + percentage + ")");
                StoreLibrary.displayInstallProgress(true, percentage);
            },
            oncomplete: function(packageId) {
                console.log("Installation(" + packageId + ") Complete");
                cleanup();
                this.getAppsInfo(function (appsInfo) {
                    installedApps = appsInfo;
                    callback();
                });
            }
        };

        var onError = function (err) {
            console.error("Error occurred on installation : " + err.name);
            callback(err);
        };

        this.downloadApplication(appId, function(error, fileName, fullPath) {
            if (error) {
                this.cleanup(error);
            } else {
                installationFile = fullPath;
                tizen.package.install(fullPath, onInstallation, onError);
            }
        });
    };

    /**
     * Method performs uninstallation of specified application ID using [tizen package API]()
     *
     * @method uninstall
     * @param appId application Id
     * @param callback {Function(error)} Callback function invoked after installation is finished or error occurs.
     **/
    PackageRepository.prototype.uninstall = function (appId, callback) {
        var onInstallation = {
            onprogress: function(packageId, percentage) {
                console.log("On uninstallation(" + packageId + ") : progress(" + percentage + ")");
                StoreLibrary.displayInstallProgress(false, percentage);
            },
            oncomplete: function(packageId) {
                console.log("Uninstallation(" + packageId + ") Complete");
                if (callback) {
                    callback(true);
                }
            }
        };

        var onError = function (err) {
            console.log("Error occurred on uninstallation : " + err.name);
            if (callback) {
                callback(false);
            }
        };
        var uninstPackageName = this.getPackageId(_applicationDetail.name);
        console.log("Trying to uninstall "+ _applicationDetail.name);
        if (uninstPackageName === undefined) {
            console.log("Package name not available.");
        } else {
            tizen.package.uninstall(uninstPackageName, onInstallation, onError);
        }
    };

    /**
     * Function returns package id for specified application name.
     * @method getPackageId
     * @param appName {String} Application name
     **/
    PackageRepository.prototype.getPackageId = function (appName) {
        for (var i in installedApps) {
            if (installedApps[i].name === appName) {
                return installedApps[i].packageId;
            }
        }
    };

	return PackageRepository;
}());
