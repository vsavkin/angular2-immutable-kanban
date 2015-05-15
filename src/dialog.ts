/// <reference path="../typings/angular2/angular2.d.ts" />
/// <reference path="../typings/es6-promise/es6-promise.d.ts" />

import {DynamicComponentLoader, ElementRef, ComponentRef, onDestroy, Component, Directive, Parent, View} from 'angular2/angular2';
import {bind, Injector, Injectable} from 'angular2/di';

export class PromiseWrapper {
  static resolve(obj): Promise<any> { return Promise.resolve(obj); }

  static reject(obj): Promise<any> { return Promise.reject(obj); }

  // Note: We can't rename this method into `catch`, as this is not a valid
  // method name in Dart.
  static catchError<T>(promise: Promise<T>, onError: (error: any) => T | Thenable<T>): Promise<T> {
    return promise.catch(onError);
  }

  static all(promises: List<Promise<any>>): Promise<any> {
    if (promises.length == 0) return Promise.resolve([]);
    return Promise.all(promises);
  }

  static then<T>(promise: Promise<T>, success: (value: any) => T | Thenable<T>,
                 rejection: (error: any) => T | Thenable<T>): Promise<T> {
    return promise.then(success, rejection);
  }

  static completer() {
    var resolve;
    var reject;

    var p = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });

    return {promise: p, resolve: resolve, reject: reject};
  }

  static setTimeout(fn: Function, millis: number) { window.setTimeout(fn, millis); }

  static isPromise(maybePromise): boolean { return maybePromise instanceof Promise; }
}


const KEY_ESC = 27;
var isPresent = x => x !== null;

// TODO(jelbourn): Opener of dialog can control where it is rendered.
// TODO(jelbourn): body scrolling is disabled while dialog is open.
// TODO(jelbourn): Don't manually construct and configure a DOM element. See #1402
// TODO(jelbourn): Wrap focus from end of dialog back to the start. Blocked on #1251
// TODO(jelbourn): Focus the dialog element when it is opened.
// TODO(jelbourn): Real dialog styles.
// TODO(jelbourn): Pre-built `alert` and `confirm` dialogs.
// TODO(jelbourn): Animate dialog out of / into opening element.

var _nextDialogId = 0;

/**
 * Simple decorator used only to communicate an ElementRef to the parent MdDialogContainer as the location
 * for where the dialog content will be loaded.
 */
@Directive({selector: 'md-dialog-content'})
class MdDialogContent {
  constructor(@Parent() dialogContainer: MdDialogContainer, elementRef: ElementRef) {
    dialogContainer.contentRef = elementRef;
  }
}

/**
 * Service for opening modal dialogs.
 */
@Injectable()
export class MdDialog {
  componentLoader: DynamicComponentLoader;

  constructor(loader: DynamicComponentLoader) {
    this.componentLoader = loader;
  }

  /**
   * Opens a modal dialog.
   * @param type The component to open.
   * @param elementRef The logical location into which the component will be opened.
   * @returns Promise for a reference to the dialog.
   */
  open(
      type: Function,
      elementRef: ElementRef,
      parentInjector: Injector,
      options: MdDialogConfig = null): Promise<MdDialogRef> {
    var config = isPresent(options) ? options : new MdDialogConfig();

    // TODO(jelbourn): Don't use direct DOM access. Need abstraction to create an element
    // directly on the document body (also needed for web workers stuff).
    // Create a DOM node to serve as a physical host element for the dialog.
    var dialogElement : HTMLElement = this._createHostElement();
    document.body.appendChild(dialogElement);

    // TODO(jelbourn): Use hostProperties binding to set these once #1539 is fixed.
    // Configure properties on the host element.
    dialogElement.classList.add('md-dialog');
    dialogElement.setAttribute('tabindex', '0');

    // TODO(jelbourn): Do this with hostProperties (or another rendering abstraction) once ready.
    if (isPresent(config.width)) {
      dialogElement.style.width = config.width;
    }
    if (isPresent(config.height)) {
      dialogElement.style.height = config.height;
    }

    // Create the dialogRef here so that it can be injected into the content component.
    var dialogRef = new MdDialogRef();

    var dialogRefBinding = bind(MdDialogRef).toValue(dialogRef);
    var contentInjector = parentInjector.resolveAndCreateChild([dialogRefBinding]);

    var backdropRefPromise = this._openBackdrop(elementRef, contentInjector);

    // First, load the MdDialogContainer, into which the given component will be loaded.
    return this.componentLoader.loadIntoNewLocation(
        MdDialogContainer, elementRef, `:document#${dialogElement.id}`).then(containerRef => {
      dialogRef.containerRef = containerRef;

      // Now load the given component into the MdDialogContainer.
      return this.componentLoader.loadNextToExistingLocation(
          type, containerRef.instance.contentRef, contentInjector).then(contentRef => {

        // Wrap both component refs for the container and the content so that we can return
        // the `instance` of the content but the dispose method of the container back to the
        // opener.
        dialogRef.contentRef = contentRef;
        containerRef.instance.dialogRef = dialogRef;

        backdropRefPromise.then(backdropRef => {
          dialogRef.whenClosed.then((_) => {
            backdropRef.dispose();
          });
        });

        return dialogRef;
      });
    });
  }

  /** Loads the dialog backdrop (transparent overlay over the rest of the page). */
  _openBackdrop(elementRef:ElementRef, injector: Injector): Promise<ComponentRef> {
    var backdropElement : HTMLElement = this._createHostElement();
    backdropElement.classList.add('md-backdrop');
    document.body.appendChild(backdropElement);

    return this.componentLoader.loadIntoNewLocation(
        MdBackdrop, elementRef, `:document#${backdropElement.id}`, injector);
  }

  _createHostElement() {
    var hostElement = document.createElement('div');
    hostElement.id = `mdDialog${_nextDialogId++}`;
    return hostElement;
  }

  alert(message: string, okMessage: string) {
    throw "Not implemented";
  }

  confirm(message: string, okMessage: string, cancelMessage: string) {
    throw "Not implemented";
  }
}


/**
 * Reference to an opened dialog.
 */
export class MdDialogRef {
  // Reference to the MdDialogContainer component.
  containerRef: ComponentRef;

  // Reference to the Component loaded as the dialog content.
  _contentRef: ComponentRef;

  // Whether the dialog is closed.
  isClosed: boolean;

  // Deferred resolved when the dialog is closed. The promise for this deferred is publicly exposed.
  whenClosedDeferred: any;

  // Deferred resolved when the content ComponentRef is set. Only used internally.
  contentRefDeferred: any;

  constructor() {
    this._contentRef = null;
    this.containerRef = null;
    this.isClosed = false;

    this.contentRefDeferred = PromiseWrapper.completer();
    this.whenClosedDeferred = PromiseWrapper.completer();
  }

  set contentRef(value: ComponentRef) {
    this._contentRef = value;
    this.contentRefDeferred.resolve(value);
  }

  /** Gets the component instance for the content of the dialog. */
  get instance() {
    if (isPresent(this._contentRef)) {
      return this._contentRef.instance;
    }

    // The only time one could attempt to access this property before the value is set is if an access occurs during
    // the constructor of the very instance they are trying to get (which is much more easily accessed as `this`).
    throw "Cannot access dialog component instance *from* that component's constructor.";
  }


  /** Gets a promise that is resolved when the dialog is closed. */
  get whenClosed(): Promise<any> {
    return this.whenClosedDeferred.promise;
  }

  /** Closes the dialog. This operation is asynchronous. */
  close(result: any = null) {
    this.contentRefDeferred.promise.then((_) => {
      if (!this.isClosed) {
        this.isClosed = true;
        this.containerRef.dispose();
        this.whenClosedDeferred.resolve(result);
      }
    });
  }
}

/** Confiuration for a dialog to be opened. */
export class MdDialogConfig {
  width: string;
  height: string;

  constructor() {
    // Default configuration.
    this.width = null;
    this.height = null;
  }
}

/**
 * Container for user-provided dialog content.
 */
@Component({
  selector: 'md-dialog-container',
  hostListeners: {
    'body:^keydown': 'documentKeypress($event)'
  }
})
@View({
  templateUrl: 'dialog.html',
  directives: [MdDialogContent]
})
class MdDialogContainer {
  // Ref to the dialog content. Used by the DynamicComponentLoader to load the dialog content.
  contentRef: ElementRef;

  // Ref to the open dialog. Used to close the dialog based on certain events.
  dialogRef: MdDialogRef;

  constructor() {
    this.contentRef = null;
    this.dialogRef = null;
  }

  wrapFocus() {
    // Return the focus to the host element. Blocked on #1251.
  }

  documentKeypress(event: KeyboardEvent) {
    if (event.keyCode == KEY_ESC) {
      this.dialogRef.close();
    }
  }
}


/** Component for the dialog "backdrop", a transparent overlay over the rest of the page. */
@Component({
  selector: 'md-backdrop',
  hostListeners: {
    'click': 'onClick()'
  }
})
@View({template: ''})
class MdBackdrop {
  dialogRef: MdDialogRef;

  constructor(dialogRef: MdDialogRef) {
    this.dialogRef = dialogRef;
  }

  onClick() {
    // TODO(jelbourn): Use MdDialogConfig to capture option for whether dialog should close on
    // clicking outside.
    this.dialogRef.close();
  }
}
