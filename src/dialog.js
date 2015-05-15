/// <reference path="../typings/angular2/angular2.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />
if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
if (typeof __metadata !== "function") __metadata = function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
if (typeof __param !== "function") __param = function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var angular2_1 = require('angular2/angular2');
var di_1 = require('angular2/di');
var PromiseWrapper = (function () {
    function PromiseWrapper() {
    }
    PromiseWrapper.resolve = function (obj) { return Promise.resolve(obj); };
    PromiseWrapper.reject = function (obj) { return Promise.reject(obj); };
    PromiseWrapper.catchError = function (promise, onError) {
        return promise.catch(onError);
    };
    PromiseWrapper.all = function (promises) {
        if (promises.length == 0)
            return Promise.resolve([]);
        return Promise.all(promises);
    };
    PromiseWrapper.then = function (promise, success, rejection) {
        return promise.then(success, rejection);
    };
    PromiseWrapper.completer = function () {
        var resolve;
        var reject;
        var p = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        });
        return { promise: p, resolve: resolve, reject: reject };
    };
    PromiseWrapper.setTimeout = function (fn, millis) { window.setTimeout(fn, millis); };
    PromiseWrapper.isPromise = function (maybePromise) { return maybePromise instanceof Promise; };
    return PromiseWrapper;
})();
exports.PromiseWrapper = PromiseWrapper;
var KEY_ESC = 27;
var isPresent = function (x) { return x !== null; };
var _nextDialogId = 0;
var MdDialogContent = (function () {
    function MdDialogContent(dialogContainer, elementRef) {
        dialogContainer.contentRef = elementRef;
    }
    MdDialogContent = __decorate([
        angular2_1.Directive({ selector: 'md-dialog-content' }),
        __param(0, angular2_1.Parent()), 
        __metadata('design:paramtypes', [MdDialogContainer, angular2_1.ElementRef])
    ], MdDialogContent);
    return MdDialogContent;
})();
var MdDialog = (function () {
    function MdDialog(loader) {
        this.componentLoader = loader;
    }
    MdDialog.prototype.open = function (type, elementRef, parentInjector, options) {
        var _this = this;
        if (options === void 0) { options = null; }
        var config = isPresent(options) ? options : new MdDialogConfig();
        var dialogElement = this._createHostElement();
        document.body.appendChild(dialogElement);
        dialogElement.classList.add('md-dialog');
        dialogElement.setAttribute('tabindex', '0');
        if (isPresent(config.width)) {
            dialogElement.style.width = config.width;
        }
        if (isPresent(config.height)) {
            dialogElement.style.height = config.height;
        }
        var dialogRef = new MdDialogRef();
        var dialogRefBinding = di_1.bind(MdDialogRef).toValue(dialogRef);
        var contentInjector = parentInjector.resolveAndCreateChild([dialogRefBinding]);
        var backdropRefPromise = this._openBackdrop(elementRef, contentInjector);
        return this.componentLoader.loadIntoNewLocation(MdDialogContainer, elementRef, ":document#" + dialogElement.id).then(function (containerRef) {
            dialogRef.containerRef = containerRef;
            return _this.componentLoader.loadNextToExistingLocation(type, containerRef.instance.contentRef, contentInjector).then(function (contentRef) {
                dialogRef.contentRef = contentRef;
                containerRef.instance.dialogRef = dialogRef;
                backdropRefPromise.then(function (backdropRef) {
                    dialogRef.whenClosed.then(function (_) {
                        backdropRef.dispose();
                    });
                });
                return dialogRef;
            });
        });
    };
    MdDialog.prototype._openBackdrop = function (elementRef, injector) {
        var backdropElement = this._createHostElement();
        backdropElement.classList.add('md-backdrop');
        document.body.appendChild(backdropElement);
        return this.componentLoader.loadIntoNewLocation(MdBackdrop, elementRef, ":document#" + backdropElement.id, injector);
    };
    MdDialog.prototype._createHostElement = function () {
        var hostElement = document.createElement('div');
        hostElement.id = "mdDialog" + _nextDialogId++;
        return hostElement;
    };
    MdDialog.prototype.alert = function (message, okMessage) {
        throw "Not implemented";
    };
    MdDialog.prototype.confirm = function (message, okMessage, cancelMessage) {
        throw "Not implemented";
    };
    MdDialog = __decorate([
        di_1.Injectable(), 
        __metadata('design:paramtypes', [angular2_1.DynamicComponentLoader])
    ], MdDialog);
    return MdDialog;
})();
exports.MdDialog = MdDialog;
var MdDialogRef = (function () {
    function MdDialogRef() {
        this._contentRef = null;
        this.containerRef = null;
        this.isClosed = false;
        this.contentRefDeferred = PromiseWrapper.completer();
        this.whenClosedDeferred = PromiseWrapper.completer();
    }
    Object.defineProperty(MdDialogRef.prototype, "contentRef", {
        set: function (value) {
            this._contentRef = value;
            this.contentRefDeferred.resolve(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MdDialogRef.prototype, "instance", {
        get: function () {
            if (isPresent(this._contentRef)) {
                return this._contentRef.instance;
            }
            throw "Cannot access dialog component instance *from* that component's constructor.";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MdDialogRef.prototype, "whenClosed", {
        get: function () {
            return this.whenClosedDeferred.promise;
        },
        enumerable: true,
        configurable: true
    });
    MdDialogRef.prototype.close = function (result) {
        var _this = this;
        if (result === void 0) { result = null; }
        this.contentRefDeferred.promise.then(function (_) {
            if (!_this.isClosed) {
                _this.isClosed = true;
                _this.containerRef.dispose();
                _this.whenClosedDeferred.resolve(result);
            }
        });
    };
    return MdDialogRef;
})();
exports.MdDialogRef = MdDialogRef;
var MdDialogConfig = (function () {
    function MdDialogConfig() {
        this.width = null;
        this.height = null;
    }
    return MdDialogConfig;
})();
exports.MdDialogConfig = MdDialogConfig;
var MdDialogContainer = (function () {
    function MdDialogContainer() {
        this.contentRef = null;
        this.dialogRef = null;
    }
    MdDialogContainer.prototype.wrapFocus = function () {
    };
    MdDialogContainer.prototype.documentKeypress = function (event) {
        if (event.keyCode == KEY_ESC) {
            this.dialogRef.close();
        }
    };
    MdDialogContainer = __decorate([
        angular2_1.Component({
            selector: 'md-dialog-container',
            hostListeners: {
                'body:^keydown': 'documentKeypress($event)'
            }
        }),
        angular2_1.View({
            templateUrl: 'dialog.html',
            directives: [MdDialogContent]
        }), 
        __metadata('design:paramtypes', [])
    ], MdDialogContainer);
    return MdDialogContainer;
})();
var MdBackdrop = (function () {
    function MdBackdrop(dialogRef) {
        this.dialogRef = dialogRef;
    }
    MdBackdrop.prototype.onClick = function () {
        this.dialogRef.close();
    };
    MdBackdrop = __decorate([
        angular2_1.Component({
            selector: 'md-backdrop',
            hostListeners: {
                'click': 'onClick()'
            }
        }),
        angular2_1.View({ template: '' }), 
        __metadata('design:paramtypes', [MdDialogRef])
    ], MdBackdrop);
    return MdBackdrop;
})();
