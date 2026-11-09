var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/react/cjs/react.development.js"(exports, module) {
    "use strict";
    (function() {
      function defineDeprecationWarning(methodName, info) {
        Object.defineProperty(Component.prototype, methodName, {
          get: function() {
            console.warn(
              "%s(...) is deprecated in plain JavaScript React classes. %s",
              info[0],
              info[1]
            );
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable)
          return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
          "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
          callerName,
          publicInstance
        ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function noop2() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
          case REACT_VIEW_TRANSITION_TYPE:
            return "ViewTransition";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(
          oldElement.type,
          newKey,
          oldElement.props,
          oldElement._owner,
          oldElement._debugStack,
          oldElement._debugTask
        );
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function validateChildKeys(node) {
        isValidElement2(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement2(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement2(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape2(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape2("" + element.key)) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop2, noop2) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement2(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + childKey
          ), "" !== nameSoFar && null != invokeCallback && isValidElement2(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (i === children.entries && (didWarnAboutMaps || console.warn(
            "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var resolveDebugValue = null, rejectDebugValue = null, ioInfo = payload._ioInfo;
          null != ioInfo && (ioInfo.start = ioInfo.end = performance.now(), ioInfo.value = new Promise(function(resolve, reject) {
            resolveDebugValue = resolve;
            rejectDebugValue = reject;
          }));
          ioInfo = payload._result;
          var thenable = ioInfo();
          thenable.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 1;
                payload._result = moduleObject;
                var _ioInfo = payload._ioInfo;
                if (null != _ioInfo) {
                  _ioInfo.end = performance.now();
                  var debugValue = null == moduleObject ? void 0 : moduleObject.default;
                  resolveDebugValue(debugValue);
                  _ioInfo.value.status = "fulfilled";
                  _ioInfo.value.value = debugValue;
                }
                void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
              }
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 2;
                payload._result = error;
                var _ioInfo2 = payload._ioInfo;
                null != _ioInfo2 && (_ioInfo2.end = performance.now(), _ioInfo2.value.then(noop2, noop2), rejectDebugValue(error), _ioInfo2.value.status = "rejected", _ioInfo2.value.reason = error);
                void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            }
          );
          ioInfo = payload._ioInfo;
          if (null != ioInfo) {
            var displayName = thenable.displayName;
            "string" === typeof displayName && (ioInfo.name = displayName);
          }
          -1 === payload._status && (payload._status = 0, payload._result = thenable);
        }
        if (1 === payload._status)
          return ioInfo = payload._result, void 0 === ioInfo && console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
            ioInfo
          ), "default" in ioInfo || console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
            ioInfo
          ), ioInfo.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      function releaseAsyncTransition() {
        ReactSharedInternals.asyncTransitions--;
      }
      function startTransition(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition.types = null !== prevTransition ? prevTransition.types : null;
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop2, reportGlobalError));
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
            "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
          )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
            "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
          ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      }
      function addTransitionType(type) {
        var transition = ReactSharedInternals.T;
        if (null !== transition) {
          var transitionTypes = transition.types;
          null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
        } else
          0 === ReactSharedInternals.asyncTransitions && console.error(
            "addTransitionType can only be called inside a `startTransition()` callback. It must be associated with a specific Transition."
          ), startTransition(addTransitionType.bind(null, type));
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl)
          try {
            var requireString = ("require" + Math.random()).slice(0, 7);
            enqueueTaskImpl = (module && module[requireString]).call(
              module,
              "timers"
            ).setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function(callback) {
              false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
              ));
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(void 0);
            };
          }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error(
          "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
        );
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue)
          if (0 !== queue.length)
            try {
              flushActQueue(queue);
              enqueueTask(function() {
                return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
              });
              return;
            } catch (error) {
              ReactSharedInternals.thrownErrors.push(error);
            }
          else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      };
      for (fnName in deprecatedAPIs)
        deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        actQueue: null,
        asyncTransitions: 0,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
        deprecatedAPIs,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      var fnName = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement2(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = fnName;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = deprecatedAPIs;
      exports.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
            ));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(
                function(returnValue) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  if (0 === prevActScopeDepth) {
                    try {
                      flushActQueue(queue), enqueueTask(function() {
                        return recursivelyFlushAsyncActWork(
                          returnValue,
                          resolve,
                          reject
                        );
                      });
                    } catch (error$0) {
                      ReactSharedInternals.thrownErrors.push(error$0);
                    }
                    if (0 < ReactSharedInternals.thrownErrors.length) {
                      var _thrownError = aggregateErrors(
                        ReactSharedInternals.thrownErrors
                      );
                      ReactSharedInternals.thrownErrors.length = 0;
                      reject(_thrownError);
                    }
                  } else resolve(returnValue);
                },
                function(error) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                    ReactSharedInternals.thrownErrors
                  ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                }
              );
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
            "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
          ));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(
                returnValue$jscomp$0,
                resolve,
                reject
              );
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports.addTransitionType = addTransitionType;
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
              config,
              "ref"
            ).get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
          for (propName in config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++)
            JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(
          element.type,
          key,
          props,
          owner,
          element._debugStack,
          element._debugTask
        );
        for (key = 2; key < arguments.length; key++)
          validateChildKeys(arguments[key]);
        return props;
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++)
          validateChildKeys(arguments[i]);
        var propName;
        i = {};
        var key = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
            childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        key && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        (propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++) ? (childArray = Error.stackTraceLimit, Error.stackTraceLimit = 10, childrenLength = Error("react-stack-top-frame"), Error.stackTraceLimit = childArray) : childrenLength = unknownOwnerDebugStack;
        return ReactElement(
          type,
          key,
          i,
          getOwner(),
          childrenLength,
          propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.createRef = function() {
        var refObject = { current: null };
        Object.seal(refObject);
        return refObject;
      };
      exports.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
          "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
        ) : "function" !== typeof render ? console.error(
          "forwardRef requires a render function but was given %s.",
          null === render ? "null" : typeof render
        ) : 0 !== render.length && 2 !== render.length && console.error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
        );
        null != render && null != render.defaultProps && console.error(
          "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
        );
        var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
          }
        });
        return elementType;
      };
      exports.isValidElement = isValidElement2;
      exports.lazy = function(ctor) {
        ctor = { _status: -1, _result: ctor };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: ctor,
          _init: lazyInitializer
        }, ioInfo = {
          name: "lazy",
          start: -1,
          end: -1,
          value: null,
          owner: null,
          debugStack: Error("react-stack-top-frame"),
          debugTask: console.createTask ? console.createTask("lazy()") : null
        };
        ctor._ioInfo = ioInfo;
        lazyType._debugInfo = [{ awaited: ioInfo }];
        return lazyType;
      };
      exports.memo = function(type, compare) {
        null == type && console.error(
          "memo: The first argument must be a component. Instead received: %s",
          null === type ? "null" : typeof type
        );
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
          }
        });
        return compare;
      };
      exports.startTransition = startTransition;
      exports.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(
          action,
          initialState,
          permalink
        );
      };
      exports.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
          "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
        );
        return dispatcher.useContext(Context);
      };
      exports.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return resolveDispatcher().useEffectEvent(callback);
      };
      exports.useId = function() {
        return resolveDispatcher().useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return resolveDispatcher().useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init2) {
        return resolveDispatcher().useReducer(reducer, initialArg, init2);
      };
      exports.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports.version = "19.3.1";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_development();
    }
  }
});

// node_modules/void-elements/index.js
var require_void_elements = __commonJS({
  "node_modules/void-elements/index.js"(exports, module) {
    module.exports = {
      "area": true,
      "base": true,
      "br": true,
      "col": true,
      "embed": true,
      "hr": true,
      "img": true,
      "input": true,
      "link": true,
      "meta": true,
      "param": true,
      "source": true,
      "track": true,
      "wbr": true
    };
  }
});

// node_modules/react-dom/cjs/react-dom.development.js
var require_react_dom_development = __commonJS({
  "node_modules/react-dom/cjs/react-dom.development.js"(exports) {
    "use strict";
    (function() {
      function noop2() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function createPortal$1(children, containerInfo, implementation) {
        var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        if (null == key) key = null;
        else if (key === REACT_OPTIMISTIC_KEY) key = REACT_OPTIMISTIC_KEY;
        else {
          try {
            testStringCoercion(key);
            var JSCompiler_inline_result = false;
          } catch (e) {
            JSCompiler_inline_result = true;
          }
          JSCompiler_inline_result && (console.error(
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            "function" === typeof Symbol && Symbol.toStringTag && key[Symbol.toStringTag] || key.constructor.name || "Object"
          ), testStringCoercion(key));
          key = "" + key;
        }
        return {
          $$typeof: REACT_PORTAL_TYPE,
          key,
          children,
          containerInfo,
          implementation
        };
      }
      function getCrossOriginStringAs(as, input) {
        if ("font" === as) return "";
        if ("string" === typeof input)
          return "use-credentials" === input ? input : "";
      }
      function getValueDescriptorExpectingObjectForWarning(thing) {
        return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : 'something with type "' + typeof thing + '"';
      }
      function getValueDescriptorExpectingEnumForWarning(thing) {
        return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : "string" === typeof thing ? JSON.stringify(thing) : "number" === typeof thing ? "`" + thing + "`" : 'something with type "' + typeof thing + '"';
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React42 = require_react(), Internals = {
        d: {
          f: noop2,
          r: function() {
            throw Error(
              "Invalid form element. requestFormReset must be passed a form that was rendered by React."
            );
          },
          D: noop2,
          C: noop2,
          L: noop2,
          m: noop2,
          X: noop2,
          S: noop2,
          M: noop2
        },
        p: 0,
        findDOMNode: null
      }, REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_RECOVERABLE_TYPE = /* @__PURE__ */ Symbol.for("react.recoverable"), REACT_OPTIMISTIC_KEY = /* @__PURE__ */ Symbol.for("react.optimistic_key"), ReactSharedInternals = React42.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      "function" === typeof Map && null != Map.prototype && "function" === typeof Map.prototype.forEach && "function" === typeof Set && null != Set.prototype && "function" === typeof Set.prototype.clear && "function" === typeof Set.prototype.forEach || console.error(
        "React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://reactjs.org/link/react-polyfills"
      );
      exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
      exports.browser = function(reason) {
        return { $$typeof: REACT_RECOVERABLE_TYPE, _reason: reason };
      };
      exports.createPortal = function(children, container) {
        var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType)
          throw Error("Target container is not a DOM element.");
        return createPortal$1(children, container, null, key);
      };
      exports.flushSync = function(fn) {
        var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
        try {
          if (ReactSharedInternals.T = null, Internals.p = 2, fn)
            return fn();
        } finally {
          ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f() && console.error(
            "flushSync was called from inside a lifecycle method. React cannot flush when React is already rendering. Consider moving this call to a scheduler task or micro task."
          );
        }
      };
      exports.preconnect = function(href, options) {
        "string" === typeof href && href ? null != options && "object" !== typeof options ? console.error(
          "ReactDOM.preconnect(): Expected the `options` argument (second) to be an object but encountered %s instead. The only supported option at this time is `crossOrigin` which accepts a string.",
          getValueDescriptorExpectingEnumForWarning(options)
        ) : null != options && "string" !== typeof options.crossOrigin && console.error(
          "ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered %s instead. Try removing this option or passing a string value instead.",
          getValueDescriptorExpectingObjectForWarning(options.crossOrigin)
        ) : console.error(
          "ReactDOM.preconnect(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.",
          getValueDescriptorExpectingObjectForWarning(href)
        );
        "string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
      };
      exports.prefetchDNS = function(href) {
        if ("string" !== typeof href || !href)
          console.error(
            "ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.",
            getValueDescriptorExpectingObjectForWarning(href)
          );
        else if (1 < arguments.length) {
          var options = arguments[1];
          "object" === typeof options && options.hasOwnProperty("crossOrigin") ? console.error(
            "ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.",
            getValueDescriptorExpectingEnumForWarning(options)
          ) : console.error(
            "ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.",
            getValueDescriptorExpectingEnumForWarning(options)
          );
        }
        "string" === typeof href && Internals.d.D(href);
      };
      exports.preinit = function(href, options) {
        "string" === typeof href && href ? null == options || "object" !== typeof options ? console.error(
          "ReactDOM.preinit(): Expected the `options` argument (second) to be an object with an `as` property describing the type of resource to be preinitialized but encountered %s instead.",
          getValueDescriptorExpectingEnumForWarning(options)
        ) : "style" !== options.as && "script" !== options.as && console.error(
          'ReactDOM.preinit(): Expected the `as` property in the `options` argument (second) to contain a valid value describing the type of resource to be preinitialized but encountered %s instead. Valid values for `as` are "style" and "script".',
          getValueDescriptorExpectingEnumForWarning(options.as)
        ) : console.error(
          "ReactDOM.preinit(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.",
          getValueDescriptorExpectingObjectForWarning(href)
        );
        if ("string" === typeof href && options && "string" === typeof options.as) {
          var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
          "style" === as ? Internals.d.S(
            href,
            "string" === typeof options.precedence ? options.precedence : void 0,
            {
              crossOrigin,
              integrity,
              fetchPriority
            }
          ) : "script" === as && Internals.d.X(href, {
            crossOrigin,
            integrity,
            fetchPriority,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0
          });
        }
      };
      exports.preinitModule = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "script" !== options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingEnumForWarning(options.as) + ".");
        if (encountered)
          console.error(
            "ReactDOM.preinitModule(): Expected up to two arguments, a non-empty `href` string and, optionally, an `options` object with a valid `as` property.%s",
            encountered
          );
        else
          switch (encountered = options && "string" === typeof options.as ? options.as : "script", encountered) {
            case "script":
              break;
            default:
              encountered = getValueDescriptorExpectingEnumForWarning(encountered), console.error(
                'ReactDOM.preinitModule(): Currently the only supported "as" type for this function is "script" but received "%s" instead. This warning was generated for `href` "%s". In the future other module types will be supported, aligning with the import-attributes proposal. Learn more here: (https://github.com/tc39/proposal-import-attributes)',
                encountered,
                href
              );
          }
        if ("string" === typeof href)
          if ("object" === typeof options && null !== options) {
            if (null == options.as || "script" === options.as)
              encountered = getCrossOriginStringAs(
                options.as,
                options.crossOrigin
              ), Internals.d.M(href, {
                crossOrigin: encountered,
                integrity: "string" === typeof options.integrity ? options.integrity : void 0,
                nonce: "string" === typeof options.nonce ? options.nonce : void 0,
                fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0
              });
          } else null == options && Internals.d.M(href);
      };
      exports.preload = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        null == options || "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : "string" === typeof options.as && options.as || (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
        encountered && console.error(
          'ReactDOM.preload(): Expected two arguments, a non-empty `href` string and an `options` object with an `as` property valid for a `<link rel="preload" as="..." />` tag.%s',
          encountered
        );
        if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
          encountered = options.as;
          var crossOrigin = getCrossOriginStringAs(
            encountered,
            options.crossOrigin
          );
          Internals.d.L(href, encountered, {
            crossOrigin,
            integrity: "string" === typeof options.integrity ? options.integrity : void 0,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0,
            type: "string" === typeof options.type ? options.type : void 0,
            fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
            referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
            imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
            imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
            media: "string" === typeof options.media ? options.media : void 0
          });
        }
      };
      exports.preloadModule = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "string" !== typeof options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
        encountered && console.error(
          'ReactDOM.preloadModule(): Expected two arguments, a non-empty `href` string and, optionally, an `options` object with an `as` property valid for a `<link rel="modulepreload" as="..." />` tag.%s',
          encountered
        );
        "string" === typeof href && (options ? (encountered = getCrossOriginStringAs(
          options.as,
          options.crossOrigin
        ), Internals.d.m(href, {
          as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
          crossOrigin: encountered,
          integrity: "string" === typeof options.integrity ? options.integrity : void 0,
          nonce: "string" === typeof options.nonce ? options.nonce : void 0,
          fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0
        })) : Internals.d.m(href));
      };
      exports.requestFormReset = function(form) {
        Internals.d.r(form);
      };
      exports.unstable_batchedUpdates = function(fn, a) {
        return fn(a);
      };
      exports.useFormState = function(action, initialState, permalink) {
        return resolveDispatcher().useFormState(action, initialState, permalink);
      };
      exports.useFormStatus = function() {
        return resolveDispatcher().useHostTransitionStatus();
      };
      exports.version = "19.3.1";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/react-dom/index.js
var require_react_dom = __commonJS({
  "node_modules/react-dom/index.js"(exports, module) {
    "use strict";
    if (false) {
      checkDCE();
      module.exports = null;
    } else {
      module.exports = require_react_dom_development();
    }
  }
});

// client/src/workshops/buffon-needle/StudentView.jsx
var import_react50 = __toESM(require_react(), 1);

// client/src/workshops/buffon-needle/App.jsx
var import_react49 = __toESM(require_react(), 1);

// client/node_modules/react-i18next/dist/es/Trans.js
var import_react3 = __toESM(require_react(), 1);

// client/node_modules/react-i18next/dist/es/TransWithoutContext.js
var import_react = __toESM(require_react(), 1);

// client/node_modules/html-parse-stringify/dist/html-parse-stringify.module.js
var import_void_elements = __toESM(require_void_elements());

// client/node_modules/react-i18next/dist/es/utils.js
var warn = (i18n, code, msg, rest) => {
  const args = [msg, {
    code,
    ...rest || {}
  }];
  if (i18n?.services?.logger?.forward) {
    return i18n.services.logger.forward(args, "warn", "react-i18next::", true);
  }
  if (isString(args[0])) args[0] = `react-i18next:: ${args[0]}`;
  if (i18n?.services?.logger?.warn) {
    i18n.services.logger.warn(...args);
  } else if (console?.warn) {
    console.warn(...args);
  }
};
var alreadyWarned = {};
var warnOnce = (i18n, code, msg, rest) => {
  if (isString(msg) && alreadyWarned[msg]) return;
  if (isString(msg)) alreadyWarned[msg] = /* @__PURE__ */ new Date();
  warn(i18n, code, msg, rest);
};
var loadedClb = (i18n, cb) => () => {
  if (i18n.isInitialized) {
    cb();
  } else {
    const initialized = () => {
      setTimeout(() => {
        i18n.off("initialized", initialized);
      }, 0);
      cb();
    };
    i18n.on("initialized", initialized);
  }
};
var loadNamespaces = (i18n, ns, cb) => {
  i18n.loadNamespaces(ns, loadedClb(i18n, cb));
};
var loadLanguages = (i18n, lng, ns, cb) => {
  if (isString(ns)) ns = [ns];
  if (i18n.options.preload && i18n.options.preload.indexOf(lng) > -1) return loadNamespaces(i18n, ns, cb);
  ns.forEach((n) => {
    if (i18n.options.ns.indexOf(n) < 0) i18n.options.ns.push(n);
  });
  i18n.loadLanguages(lng, loadedClb(i18n, cb));
};
var hasLoadedNamespace = (ns, i18n, options = {}) => {
  if (!i18n.languages || !i18n.languages.length) {
    warnOnce(i18n, "NO_LANGUAGES", "i18n.languages were undefined or empty", {
      languages: i18n.languages
    });
    return true;
  }
  return i18n.hasLoadedNamespace(ns, {
    lng: options.lng,
    precheck: (i18nInstance2, loadNotPending) => {
      if (options.bindI18n && options.bindI18n.indexOf("languageChanging") > -1 && i18nInstance2.services.backendConnector.backend && i18nInstance2.isLanguageChangingTo && !loadNotPending(i18nInstance2.isLanguageChangingTo, ns)) return false;
    }
  });
};
var isString = (obj) => typeof obj === "string";
var isObject = (obj) => typeof obj === "object" && obj !== null;

// client/node_modules/react-i18next/dist/es/unescape.js
var matchHtmlEntity = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g;
var htmlEntities = {
  "&amp;": "&",
  "&#38;": "&",
  "&lt;": "<",
  "&#60;": "<",
  "&gt;": ">",
  "&#62;": ">",
  "&apos;": "'",
  "&#39;": "'",
  "&quot;": '"',
  "&#34;": '"',
  "&nbsp;": " ",
  "&#160;": " ",
  "&copy;": "\xA9",
  "&#169;": "\xA9",
  "&reg;": "\xAE",
  "&#174;": "\xAE",
  "&hellip;": "\u2026",
  "&#8230;": "\u2026",
  "&#x2F;": "/",
  "&#47;": "/"
};
var unescapeHtmlEntity = (m) => htmlEntities[m];
var unescape = (text) => text.replace(matchHtmlEntity, unescapeHtmlEntity);

// client/node_modules/react-i18next/dist/es/defaults.js
var defaultOptions = {
  bindI18n: "languageChanged",
  bindI18nStore: "",
  transEmptyNodeValue: "",
  transSupportBasicHtmlNodes: true,
  transWrapTextNodes: "",
  transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p"],
  useSuspense: true,
  unescape
};
var setDefaults = (options = {}) => {
  defaultOptions = {
    ...defaultOptions,
    ...options
  };
};
var getDefaults = () => defaultOptions;

// client/node_modules/react-i18next/dist/es/i18nInstance.js
var i18nInstance;
var setI18n = (instance2) => {
  i18nInstance = instance2;
};
var getI18n = () => i18nInstance;

// client/node_modules/react-i18next/dist/es/context.js
var import_react2 = __toESM(require_react(), 1);

// client/node_modules/react-i18next/dist/es/initReactI18next.js
var initReactI18next = {
  type: "3rdParty",
  init(instance2) {
    setDefaults(instance2.options.react);
    setI18n(instance2);
  }
};

// client/node_modules/react-i18next/dist/es/context.js
var I18nContext = (0, import_react2.createContext)();
var ReportNamespaces = class {
  constructor() {
    this.usedNamespaces = {};
  }
  addUsedNamespaces(namespaces) {
    namespaces.forEach((ns) => {
      if (!this.usedNamespaces[ns]) this.usedNamespaces[ns] = true;
    });
  }
  getUsedNamespaces() {
    return Object.keys(this.usedNamespaces);
  }
};

// client/node_modules/react-i18next/dist/es/useTranslation.js
var import_react4 = __toESM(require_react(), 1);
var usePrevious = (value, ignore) => {
  const ref = (0, import_react4.useRef)();
  (0, import_react4.useEffect)(() => {
    ref.current = ignore ? ref.current : value;
  }, [value, ignore]);
  return ref.current;
};
var alwaysNewT = (i18n, language, namespace, keyPrefix) => i18n.getFixedT(language, namespace, keyPrefix);
var useMemoizedT = (i18n, language, namespace, keyPrefix) => (0, import_react4.useCallback)(alwaysNewT(i18n, language, namespace, keyPrefix), [i18n, language, namespace, keyPrefix]);
var useTranslation = (ns, props = {}) => {
  const {
    i18n: i18nFromProps
  } = props;
  const {
    i18n: i18nFromContext,
    defaultNS: defaultNSFromContext
  } = (0, import_react4.useContext)(I18nContext) || {};
  const i18n = i18nFromProps || i18nFromContext || getI18n();
  if (i18n && !i18n.reportNamespaces) i18n.reportNamespaces = new ReportNamespaces();
  if (!i18n) {
    warnOnce(i18n, "NO_I18NEXT_INSTANCE", "useTranslation: You will need to pass in an i18next instance by using initReactI18next");
    const notReadyT = (k, optsOrDefaultValue) => {
      if (isString(optsOrDefaultValue)) return optsOrDefaultValue;
      if (isObject(optsOrDefaultValue) && isString(optsOrDefaultValue.defaultValue)) return optsOrDefaultValue.defaultValue;
      return Array.isArray(k) ? k[k.length - 1] : k;
    };
    const retNotReady = [notReadyT, {}, false];
    retNotReady.t = notReadyT;
    retNotReady.i18n = {};
    retNotReady.ready = false;
    return retNotReady;
  }
  if (i18n.options.react?.wait) warnOnce(i18n, "DEPRECATED_OPTION", "useTranslation: It seems you are still using the old wait option, you may migrate to the new useSuspense behaviour.");
  const i18nOptions = {
    ...getDefaults(),
    ...i18n.options.react,
    ...props
  };
  const {
    useSuspense,
    keyPrefix
  } = i18nOptions;
  let namespaces = ns || defaultNSFromContext || i18n.options?.defaultNS;
  namespaces = isString(namespaces) ? [namespaces] : namespaces || ["translation"];
  i18n.reportNamespaces.addUsedNamespaces?.(namespaces);
  const ready = (i18n.isInitialized || i18n.initializedStoreOnce) && namespaces.every((n) => hasLoadedNamespace(n, i18n, i18nOptions));
  const memoGetT = useMemoizedT(i18n, props.lng || null, i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0], keyPrefix);
  const getT = () => memoGetT;
  const getNewT = () => alwaysNewT(i18n, props.lng || null, i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0], keyPrefix);
  const [t3, setT] = (0, import_react4.useState)(getT);
  let joinedNS = namespaces.join();
  if (props.lng) joinedNS = `${props.lng}${joinedNS}`;
  const previousJoinedNS = usePrevious(joinedNS);
  const isMounted = (0, import_react4.useRef)(true);
  (0, import_react4.useEffect)(() => {
    const {
      bindI18n,
      bindI18nStore
    } = i18nOptions;
    isMounted.current = true;
    if (!ready && !useSuspense) {
      if (props.lng) {
        loadLanguages(i18n, props.lng, namespaces, () => {
          if (isMounted.current) setT(getNewT);
        });
      } else {
        loadNamespaces(i18n, namespaces, () => {
          if (isMounted.current) setT(getNewT);
        });
      }
    }
    if (ready && previousJoinedNS && previousJoinedNS !== joinedNS && isMounted.current) {
      setT(getNewT);
    }
    const boundReset = () => {
      if (isMounted.current) setT(getNewT);
    };
    if (bindI18n) i18n?.on(bindI18n, boundReset);
    if (bindI18nStore) i18n?.store.on(bindI18nStore, boundReset);
    return () => {
      isMounted.current = false;
      if (i18n && bindI18n) bindI18n?.split(" ").forEach((e) => i18n.off(e, boundReset));
      if (bindI18nStore && i18n) bindI18nStore.split(" ").forEach((e) => i18n.store.off(e, boundReset));
    };
  }, [i18n, joinedNS]);
  (0, import_react4.useEffect)(() => {
    if (isMounted.current && ready) {
      setT(getT);
    }
  }, [i18n, keyPrefix, ready]);
  const ret = [t3, i18n, ready];
  ret.t = t3;
  ret.i18n = i18n;
  ret.ready = ready;
  if (ready) return ret;
  if (!ready && !useSuspense) return ret;
  throw new Promise((resolve) => {
    if (props.lng) {
      loadLanguages(i18n, props.lng, namespaces, () => resolve());
    } else {
      loadNamespaces(i18n, namespaces, () => resolve());
    }
  });
};

// client/node_modules/react-i18next/dist/es/withTranslation.js
var import_react5 = __toESM(require_react(), 1);

// client/node_modules/react-i18next/dist/es/I18nextProvider.js
var import_react6 = __toESM(require_react(), 1);

// client/node_modules/react-i18next/dist/es/withSSR.js
var import_react8 = __toESM(require_react(), 1);

// client/node_modules/react-i18next/dist/es/useSSR.js
var import_react7 = __toESM(require_react(), 1);

// client/src/shared/components/layouts/Accordion.jsx
var import_react9 = __toESM(require_react(), 1);
var Accordion = ({
  title,
  // Main heading displayed on the accordion button.
  subtitle = "",
  // Optional secondary heading.
  icon = null,
  // Optional icon shown before the heading.
  open = false,
  // Controls the initial open state when true.
  defaultOpen = false,
  // Opens the accordion initially when true.
  className = "",
  // Additional CSS classes for the accordion.
  onToggle,
  // Receives the new open state after a toggle.
  children
  // Content shown inside the accordion.
}) => {
  const [isOpen, setIsOpen] = (0, import_react9.useState)(open || defaultOpen);
  const prefix = icon ? `${icon} ` : "";
  return /* @__PURE__ */ import_react9.default.createElement("div", { className: ["accordion", className].filter(Boolean).join(" ") }, /* @__PURE__ */ import_react9.default.createElement(
    "button",
    {
      type: "button",
      className: "accordion-btn",
      "aria-expanded": isOpen,
      onClick: () => {
        const nextOpen = !isOpen;
        setIsOpen(nextOpen);
        onToggle?.(nextOpen);
      }
    },
    /* @__PURE__ */ import_react9.default.createElement("span", null, prefix, title, subtitle ? /* @__PURE__ */ import_react9.default.createElement("small", { className: "accordion-subtitle" }, subtitle) : null),
    /* @__PURE__ */ import_react9.default.createElement("span", { className: "accordion-icon" }, isOpen ? "-" : "+")
  ), /* @__PURE__ */ import_react9.default.createElement("div", { className: ["accordion-content", isOpen ? "open" : ""].filter(Boolean).join(" ") }, children));
};

// client/src/shared/components/services/QrAccordion.jsx
var import_react10 = __toESM(require_react(), 1);

// client/src/shared/components/services/DataAccordion.jsx
var import_react12 = __toESM(require_react(), 1);

// client/src/shared/components/activities/SessionLogContext.jsx
var import_react11 = __toESM(require_react(), 1);

// client/src/shared/components/menu/identityStorage.js
var NAME_KEY = "strobeStudentConnectName";
var IDENTITY_EVENT = "strobe:identity-change";
function safeStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}
function emitIdentityChange(detail) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }
  window.dispatchEvent(new CustomEvent(IDENTITY_EVENT, { detail }));
}
function readIdentityName(fallback = "") {
  const storage = safeStorage();
  if (!storage) {
    return fallback;
  }
  const value = String(storage.getItem(NAME_KEY) || "").trim();
  return value || fallback;
}
function writeIdentityName(value) {
  const storage = safeStorage();
  if (!storage) {
    return;
  }
  const normalized = String(value || "").trim();
  if (!normalized) {
    storage.removeItem(NAME_KEY);
    emitIdentityChange({ name: "" });
    return;
  }
  storage.setItem(NAME_KEY, normalized);
  emitIdentityChange({ name: normalized });
}

// client/src/shared/components/activities/SessionLogContext.jsx
var SessionLogContext = (0, import_react11.createContext)(null);
function useSessionInputLogger() {
  return (0, import_react11.useContext)(SessionLogContext);
}

// client/src/shared/components/layouts/SharedCommonZoneLayout.jsx
var import_react13 = __toESM(require_react(), 1);

// client/src/shared/components/layouts/Toolbar.jsx
var import_react14 = __toESM(require_react(), 1);

// client/src/shared/components/services/ActivitiesAccordion.jsx
var import_react15 = __toESM(require_react(), 1);
var import_react16 = __toESM(require_react(), 1);

// client/src/shared/components/resources/PlacementBoard.jsx
var import_react18 = __toESM(require_react(), 1);

// client/src/shared/components/primitives/GroupingItemBank.jsx
var import_react17 = __toESM(require_react(), 1);

// client/src/shared/components/resources/VennBoard.jsx
var import_react20 = __toESM(require_react(), 1);

// client/src/shared/components/primitives/MathFormula.jsx
var import_react19 = __toESM(require_react(), 1);

// client/src/shared/components/resources/OptionsGrid.jsx
var import_react21 = __toESM(require_react(), 1);

// client/src/shared/components/primitives/HeroTitle.jsx
var import_react22 = __toESM(require_react(), 1);
function HeroTitle({
  children,
  // Heading content when title is not set.
  title = "",
  // Main heading text.
  subtitle = "",
  // Optional supporting text.
  className = ""
  // Additional CSS classes for the title block.
}) {
  const resolvedTitle = title || children;
  return /* @__PURE__ */ import_react22.default.createElement("div", { className: `hero ${className}`.trim() }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "hero-title" }, resolvedTitle), subtitle ? /* @__PURE__ */ import_react22.default.createElement("p", { className: "hero-subtitle" }, subtitle) : null);
}

// client/src/shared/components/services/GroupsAccordion.jsx
var import_react23 = __toESM(require_react(), 1);
var defaultGetRowKey = (participant, index) => participant.id || participant.sessionId || participant.username || participant.name || index;
var defaultGetDisplayName = (participant, fallbackName) => participant.username || participant.name || participant.displayName || fallbackName;
var defaultGetIsConnected = (participant) => participant && typeof participant.isConnected === "boolean" ? participant.isConnected : participant && typeof participant.connected === "boolean" ? participant.connected : true;
var hasTableConfiguration = ({ title, columns, headerGroups, emptyMessage, nameFallback, participants }) => Boolean(title) || Array.isArray(columns) && columns.length > 0 || Array.isArray(headerGroups) && headerGroups.length > 0 || Boolean(emptyMessage) || Boolean(nameFallback) || participants !== void 0;
function GroupsAccordion({
  title = "",
  icon = "",
  open = false,
  nameColumnLabel = "",
  nameHeaderControl = null,
  onFeedbackChange,
  participants,
  columns,
  headerGroups,
  emptyMessage = "",
  nameFallback = "",
  getRowKey = defaultGetRowKey,
  getDisplayName: getDisplayName2 = defaultGetDisplayName,
  getIsConnected = defaultGetIsConnected,
  getRowStyle,
  role = "student",
  studentName = "",
  activity = "",
  currentScore = 0
}) {
  const { t: t3 } = useTranslation(["common", "interface"]);
  const sessionLogging = useSessionInputLogger();
  const [settingsSaving, setSettingsSaving] = (0, import_react23.useState)(false);
  const isTeacher = role === "teacher" || sessionLogging?.role === "teacher";
  const resolvedRows = Array.isArray(participants) ? participants : [];
  const resolvedColumns = Array.isArray(columns) ? columns : [];
  const resolvedHeaderGroups = Array.isArray(headerGroups) ? headerGroups : [];
  const shouldRenderTable = hasTableConfiguration({
    title,
    columns: resolvedColumns,
    headerGroups: resolvedHeaderGroups,
    emptyMessage,
    nameFallback,
    participants
  });
  (0, import_react23.useEffect)(() => {
    if (isTeacher || !studentName || !activity || !Number.isFinite(Number(currentScore))) return void 0;
    const timer = window.setTimeout(() => {
      fetch("/api/scores/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studentName,
          activity,
          currentScore: Number(currentScore),
          sessionId: sessionLogging?.activeSessionId || ""
        })
      }).catch(() => {
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activity, currentScore, isTeacher, sessionLogging?.activeSessionId, studentName]);
  if (!shouldRenderTable) return null;
  const rows = resolvedRows;
  const extraColumns = resolvedColumns;
  const safeHeaderGroups = resolvedHeaderGroups;
  const totalColumns = 1 + extraColumns.length;
  const groupedSpanTotal = safeHeaderGroups.reduce((sum, group) => sum + (group.colSpan || 1), 0);
  const resolvedTitle = title || t3("groupsTable", { ns: "interface" });
  const resolvedIcon = icon || "\u{1F465}";
  const resolvedEmptyMessage = emptyMessage || t3("notAvailable");
  const resolvedFallback = nameFallback || t3("student");
  async function updateFeedback(event) {
    const enabled = event.currentTarget.checked;
    const previous = Boolean(sessionLogging?.feedbackEnabled);
    setSettingsSaving(true);
    onFeedbackChange?.(enabled);
    try {
      await sessionLogging?.updateFeedbackEnabled?.(enabled);
    } catch {
      onFeedbackChange?.(previous);
    } finally {
      setSettingsSaving(false);
    }
  }
  async function updateScore(event) {
    setSettingsSaving(true);
    try {
      await sessionLogging?.updateScoreVisible?.(event.currentTarget.checked);
    } catch {
    } finally {
      setSettingsSaving(false);
    }
  }
  return /* @__PURE__ */ import_react23.default.createElement(Accordion, { title: resolvedTitle, icon: resolvedIcon, open }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "students-accordion__content" }, /* @__PURE__ */ import_react23.default.createElement("table", { className: "students-accordion__table" }, /* @__PURE__ */ import_react23.default.createElement("thead", null, safeHeaderGroups.length > 0 && /* @__PURE__ */ import_react23.default.createElement("tr", null, /* @__PURE__ */ import_react23.default.createElement("th", { "aria-hidden": "true", style: { border: "none", background: "transparent", padding: 0 } }), safeHeaderGroups.map((group, index) => /* @__PURE__ */ import_react23.default.createElement(
    "th",
    {
      key: group.key || group.label || index,
      colSpan: group.colSpan || 1,
      style: group.style,
      className: group.className || ""
    },
    group.label
  )), Array.from({ length: Math.max(0, extraColumns.length - groupedSpanTotal) }).map((_, index) => /* @__PURE__ */ import_react23.default.createElement(
    "th",
    {
      key: `header-group-gap-${index}`,
      "aria-hidden": "true",
      style: { border: "none", background: "transparent", padding: 0 }
    }
  ))), /* @__PURE__ */ import_react23.default.createElement("tr", null, /* @__PURE__ */ import_react23.default.createElement("th", null, /* @__PURE__ */ import_react23.default.createElement("div", { style: { display: "grid", justifyItems: "start", gap: "0.35rem" } }, /* @__PURE__ */ import_react23.default.createElement("span", null, nameColumnLabel || t3("student")), /* @__PURE__ */ import_react23.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.35rem 0.7rem" } }, isTeacher ? /* @__PURE__ */ import_react23.default.createElement(import_react23.default.Fragment, null, /* @__PURE__ */ import_react23.default.createElement("label", { style: { display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "normal" } }, /* @__PURE__ */ import_react23.default.createElement("input", { type: "checkbox", checked: sessionLogging?.scoreVisible !== false, disabled: settingsSaving, onChange: updateScore }), /* @__PURE__ */ import_react23.default.createElement("span", null, t3("showScoreToStudents", { ns: "common" }))), /* @__PURE__ */ import_react23.default.createElement("label", { style: { display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "normal" } }, /* @__PURE__ */ import_react23.default.createElement("input", { type: "checkbox", checked: Boolean(sessionLogging?.feedbackEnabled), disabled: settingsSaving, onChange: updateFeedback }), /* @__PURE__ */ import_react23.default.createElement("span", null, t3("enableFeedback", { ns: "common" })))) : null, nameHeaderControl))), extraColumns.map((column, index) => /* @__PURE__ */ import_react23.default.createElement("th", { key: column.key || column.label || index }, column.label)))), /* @__PURE__ */ import_react23.default.createElement("tbody", null, rows.length === 0 && /* @__PURE__ */ import_react23.default.createElement("tr", null, /* @__PURE__ */ import_react23.default.createElement("td", { colSpan: totalColumns, style: { textAlign: "center", opacity: 0.7 } }, resolvedEmptyMessage)), rows.map((participant, index) => {
    const isConnected = getIsConnected(participant, index);
    const displayName = getDisplayName2(participant, resolvedFallback, index);
    return /* @__PURE__ */ import_react23.default.createElement("tr", { key: getRowKey(participant, index), style: typeof getRowStyle === "function" ? getRowStyle(participant, index) : void 0 }, /* @__PURE__ */ import_react23.default.createElement("td", { style: { whiteSpace: "nowrap" } }, /* @__PURE__ */ import_react23.default.createElement(
      "span",
      {
        className: "green-dot",
        title: isConnected ? t3("connected") : t3("disconnected"),
        "aria-label": isConnected ? t3("connected") : t3("disconnected"),
        style: {
          display: "inline-block",
          backgroundColor: isConnected ? "#22c55e" : "#9ca3af",
          opacity: isConnected ? 1 : 0.85,
          marginRight: "0.5rem"
        }
      }
    ), displayName), extraColumns.map((column, columnIndex) => /* @__PURE__ */ import_react23.default.createElement(
      "td",
      {
        key: column.key || column.label || columnIndex,
        className: column.className || "",
        style: column.style
      },
      typeof column.render === "function" ? column.render(participant, index) : participant?.[column.field] ?? "-"
    )));
  })))));
}

// client/src/shared/components/primitives/BlueNumberBox.jsx
var import_react24 = __toESM(require_react(), 1);

// client/src/shared/components/primitives/GridButton.jsx
var import_react25 = __toESM(require_react(), 1);

// client/src/shared/components/resources/AlgebraTiles.jsx
var import_react27 = __toESM(require_react(), 1);
var import_react_dom = __toESM(require_react_dom(), 1);

// client/src/shared/components/primitives/MathJaxText.jsx
var import_react26 = __toESM(require_react(), 1);

// client/src/shared/components/resources/AlgebraTiles.jsx
function getResponsiveGridUnit() {
  const viewportWidth = typeof window === "undefined" ? 640 : window.innerWidth;
  return Math.max(10, Math.min(18, Math.round(viewportWidth * 0.028 * 100) / 100));
}
var GRID_UNIT = getResponsiveGridUnit();
var T_CHART_AXIS_X = GRID_UNIT * 6;
var T_CHART_AXIS_Y = GRID_UNIT * 4;
var T_CHART_HORIZONTAL_ROW_Y = GRID_UNIT * 2;
var T_CHART_VERTICAL_COLUMN_X = GRID_UNIT * 4;

// client/src/shared/components/resources/NumberLine.jsx
var import_react28 = __toESM(require_react(), 1);

// client/src/shared/components/resources/CartesianPlane.jsx
var import_react29 = __toESM(require_react(), 1);

// client/src/shared/components/resources/EntryGrid.jsx
var import_react31 = __toESM(require_react(), 1);

// client/src/shared/components/primitives/SharedInputBox.jsx
var import_react30 = __toESM(require_react(), 1);

// client/src/shared/components/activities/ActivitySettingsAccordion.jsx
var import_react40 = __toESM(require_react(), 1);

// client/src/shared/components/widgets/WidgetRenderer.jsx
var import_react36 = __toESM(require_react(), 1);

// client/src/shared/components/widgets/IconWidget.jsx
var import_react32 = __toESM(require_react(), 1);

// client/src/shared/components/widgets/EquationWidget.jsx
var import_react33 = __toESM(require_react(), 1);

// client/src/shared/components/widgets/PlotWidget.jsx
var import_react34 = __toESM(require_react(), 1);

// client/src/shared/components/widgets/MathPreviewWidget.jsx
var import_react35 = __toESM(require_react(), 1);

// client/src/shared/components/primitives/FullScreenButton.jsx
var import_react37 = __toESM(require_react(), 1);
function FullScreenButton() {
  const { t: t3 } = useTranslation("common");
  const buttonRef = (0, import_react37.useRef)(null);
  const [isFullscreen, setIsFullscreen] = (0, import_react37.useState)(false);
  (0, import_react37.useEffect)(() => {
    const syncState = () => {
      const zone = buttonRef.current?.closest(".common-zone");
      setIsFullscreen(Boolean(zone && document.fullscreenElement === zone));
    };
    document.addEventListener("fullscreenchange", syncState);
    return () => document.removeEventListener("fullscreenchange", syncState);
  }, []);
  async function toggleFullscreen() {
    const zone = buttonRef.current?.closest(".common-zone");
    if (!zone) return;
    try {
      if (document.fullscreenElement === zone) await document.exitFullscreen();
      else await zone.requestFullscreen();
    } catch (error) {
      console.error("Unable to change common-zone fullscreen state:", error);
    }
  }
  const label = isFullscreen ? t3("exitFullscreen") : t3("enterFullscreen");
  return /* @__PURE__ */ import_react37.default.createElement(
    "button",
    {
      ref: buttonRef,
      type: "button",
      className: "common-zone-fullscreen-toggle",
      "aria-label": label,
      "aria-pressed": isFullscreen,
      title: label,
      onClick: toggleFullscreen
    },
    /* @__PURE__ */ import_react37.default.createElement("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" }, isFullscreen ? /* @__PURE__ */ import_react37.default.createElement("path", { d: "M8 3v5H3M3 8l6-6m7 1v5h5m0 0-6-6M8 21v-5H3m0 0 6 6m7-1v-5h5m0 0-6 6" }) : /* @__PURE__ */ import_react37.default.createElement("path", { d: "M3 9V3h6M3 3l7 7m5-7h6v6m0-6-7 7M3 15v6h6m-6 0 7-7m11 1v6h-6m6 0-7-7" }))
  );
}

// client/src/shared/components/primitives/TheoryButton.jsx
var import_react38 = __toESM(require_react(), 1);
var import_react_dom2 = __toESM(require_react_dom(), 1);
function parseInlineMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return /* @__PURE__ */ import_react38.default.createElement("strong", { key: index }, part.slice(2, -2));
    if (part.startsWith("*") && part.endsWith("*")) return /* @__PURE__ */ import_react38.default.createElement("em", { key: index }, part.slice(1, -1));
    if (part.startsWith("`") && part.endsWith("`")) return /* @__PURE__ */ import_react38.default.createElement("code", { key: index }, part.slice(1, -1));
    return part;
  });
}
function renderMarkdown(markdown) {
  const blocks = String(markdown || "").trim().split(/\n\s*\n/).filter(Boolean);
  return blocks.map((block, index) => {
    const heading = block.match(/^(#{2,6})\s+(.+)$/);
    if (heading) return /* @__PURE__ */ import_react38.default.createElement("h3", { key: index }, parseInlineMarkdown(heading[2]));
    const lines = block.split("\n");
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      return /* @__PURE__ */ import_react38.default.createElement("ul", { key: index }, lines.map((line, itemIndex) => /* @__PURE__ */ import_react38.default.createElement("li", { key: itemIndex }, parseInlineMarkdown(line.replace(/^\s*[-*]\s+/, "")))));
    }
    return /* @__PURE__ */ import_react38.default.createElement("p", { key: index }, parseInlineMarkdown(lines.join(" ")));
  });
}
function parseMarkdownDocument(markdown) {
  const match = String(markdown || "").match(/^#\s+(.+?)\s*\r?\n/);
  return {
    title: match?.[1] || "\u0398\u03B5\u03C9\u03C1\u03AF\u03B1",
    content: match ? markdown.slice(match[0].length) : markdown
  };
}
function TheoryButton({ theory }) {
  const [isOpen, setIsOpen] = (0, import_react38.useState)(false);
  const [portalTarget, setPortalTarget] = (0, import_react38.useState)(null);
  const [loadedTheory, setLoadedTheory] = (0, import_react38.useState)(null);
  const activeTheory = typeof theory === "string" ? loadedTheory : theory;
  const content = activeTheory?.content;
  const title = activeTheory?.title || "\u0398\u03B5\u03C9\u03C1\u03AF\u03B1";
  (0, import_react38.useEffect)(() => {
    const syncPortalTarget = () => setPortalTarget(document.fullscreenElement || document.body);
    syncPortalTarget();
    document.addEventListener("fullscreenchange", syncPortalTarget);
    return () => document.removeEventListener("fullscreenchange", syncPortalTarget);
  }, []);
  (0, import_react38.useEffect)(() => {
    if (typeof theory !== "string") {
      setLoadedTheory(null);
      return void 0;
    }
    let cancelled = false;
    setLoadedTheory(null);
    fetch(theory, { cache: "no-store" }).then((response) => response.ok ? response.text() : null).then((payload) => {
      if (!cancelled) setLoadedTheory(payload ? parseMarkdownDocument(payload) : null);
    }).catch(() => {
      if (!cancelled) setLoadedTheory(null);
    });
    return () => {
      cancelled = true;
    };
  }, [theory]);
  return /* @__PURE__ */ import_react38.default.createElement(import_react38.default.Fragment, null, /* @__PURE__ */ import_react38.default.createElement(
    "button",
    {
      type: "button",
      className: "common-zone-theory-toggle",
      "aria-label": "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03B8\u03B5\u03C9\u03C1\u03AF\u03B1\u03C2",
      title: "\u0398\u03B5\u03C9\u03C1\u03AF\u03B1",
      "aria-haspopup": "dialog",
      "aria-expanded": isOpen,
      onClick: () => setIsOpen(true)
    },
    /* @__PURE__ */ import_react38.default.createElement("span", { "aria-hidden": "true" }, "i")
  ), isOpen && portalTarget ? (0, import_react_dom2.createPortal)(/* @__PURE__ */ import_react38.default.createElement("div", { className: "common-zone-theory-backdrop", onMouseDown: (event) => {
    if (event.target === event.currentTarget) setIsOpen(false);
  } }, /* @__PURE__ */ import_react38.default.createElement("section", { className: "common-zone-theory-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "common-zone-theory-title" }, /* @__PURE__ */ import_react38.default.createElement("button", { type: "button", className: "common-zone-theory-close", "aria-label": "\u039A\u03BB\u03B5\u03AF\u03C3\u03B9\u03BC\u03BF \u03B8\u03B5\u03C9\u03C1\u03AF\u03B1\u03C2", onClick: () => setIsOpen(false) }, "\xD7"), /* @__PURE__ */ import_react38.default.createElement("h2", { id: "common-zone-theory-title" }, title), /* @__PURE__ */ import_react38.default.createElement("div", { className: "common-zone-theory-content" }, content ? renderMarkdown(content) : "\u0394\u03B5\u03BD \u03AD\u03C7\u03B5\u03B9 \u03C0\u03C1\u03BF\u03C3\u03C4\u03B5\u03B8\u03B5\u03AF \u03B8\u03B5\u03C9\u03C1\u03AF\u03B1 \u03B3\u03B9\u03B1 \u03B1\u03C5\u03C4\u03AE \u03C4\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1."))), portalTarget) : null);
}

// client/src/shared/components/primitives/workshopTheory.js
function getTheoryPath(theoryId) {
  if (!theoryId) return void 0;
  return `/theory/${encodeURIComponent(theoryId)}.md`;
}

// client/src/shared/components/activities/ActivityResourcePreview.jsx
var import_react39 = __toESM(require_react(), 1);

// client/src/shared/components/primitives/SharedInputRow.jsx
var import_react41 = __toESM(require_react(), 1);

// client/src/shared/components/resources/GeoGebra.jsx
var import_react42 = __toESM(require_react(), 1);

// client/src/shared/components/resources/VisionCollaborationBoard.jsx
var import_react43 = __toESM(require_react(), 1);

// client/src/shared/components/menu/ConnectionNameControl.jsx
var import_react44 = __toESM(require_react(), 1);

// client/src/shared/components/menu/LanguageSwitcher.jsx
var import_react45 = __toESM(require_react(), 1);

// client/node_modules/i18next/dist/esm/i18next.js
var isString2 = (obj) => typeof obj === "string";
var defer = () => {
  let res;
  let rej;
  const promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });
  promise.resolve = res;
  promise.reject = rej;
  return promise;
};
var makeString = (object) => {
  if (object == null) return "";
  return "" + object;
};
var copy = (a, s, t3) => {
  a.forEach((m) => {
    if (s[m]) t3[m] = s[m];
  });
};
var lastOfPathSeparatorRegExp = /###/g;
var cleanKey = (key) => key && key.indexOf("###") > -1 ? key.replace(lastOfPathSeparatorRegExp, ".") : key;
var canNotTraverseDeeper = (object) => !object || isString2(object);
var getLastOfPath = (object, path2, Empty) => {
  const stack = !isString2(path2) ? path2 : path2.split(".");
  let stackIndex = 0;
  while (stackIndex < stack.length - 1) {
    if (canNotTraverseDeeper(object)) return {};
    const key = cleanKey(stack[stackIndex]);
    if (!object[key] && Empty) object[key] = new Empty();
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      object = object[key];
    } else {
      object = {};
    }
    ++stackIndex;
  }
  if (canNotTraverseDeeper(object)) return {};
  return {
    obj: object,
    k: cleanKey(stack[stackIndex])
  };
};
var setPath = (object, path2, newValue) => {
  const {
    obj,
    k
  } = getLastOfPath(object, path2, Object);
  if (obj !== void 0 || path2.length === 1) {
    obj[k] = newValue;
    return;
  }
  let e = path2[path2.length - 1];
  let p = path2.slice(0, path2.length - 1);
  let last = getLastOfPath(object, p, Object);
  while (last.obj === void 0 && p.length) {
    e = `${p[p.length - 1]}.${e}`;
    p = p.slice(0, p.length - 1);
    last = getLastOfPath(object, p, Object);
    if (last?.obj && typeof last.obj[`${last.k}.${e}`] !== "undefined") {
      last.obj = void 0;
    }
  }
  last.obj[`${last.k}.${e}`] = newValue;
};
var pushPath = (object, path2, newValue, concat) => {
  const {
    obj,
    k
  } = getLastOfPath(object, path2, Object);
  obj[k] = obj[k] || [];
  obj[k].push(newValue);
};
var getPath = (object, path2) => {
  const {
    obj,
    k
  } = getLastOfPath(object, path2);
  if (!obj) return void 0;
  if (!Object.prototype.hasOwnProperty.call(obj, k)) return void 0;
  return obj[k];
};
var getPathWithDefaults = (data, defaultData, key) => {
  const value = getPath(data, key);
  if (value !== void 0) {
    return value;
  }
  return getPath(defaultData, key);
};
var deepExtend = (target, source, overwrite) => {
  for (const prop in source) {
    if (prop !== "__proto__" && prop !== "constructor") {
      if (prop in target) {
        if (isString2(target[prop]) || target[prop] instanceof String || isString2(source[prop]) || source[prop] instanceof String) {
          if (overwrite) target[prop] = source[prop];
        } else {
          deepExtend(target[prop], source[prop], overwrite);
        }
      } else {
        target[prop] = source[prop];
      }
    }
  }
  return target;
};
var regexEscape = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var _entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;"
};
var escape = (data) => {
  if (isString2(data)) {
    return data.replace(/[&<>"'\/]/g, (s) => _entityMap[s]);
  }
  return data;
};
var RegExpCache = class {
  constructor(capacity) {
    this.capacity = capacity;
    this.regExpMap = /* @__PURE__ */ new Map();
    this.regExpQueue = [];
  }
  getRegExp(pattern) {
    const regExpFromCache = this.regExpMap.get(pattern);
    if (regExpFromCache !== void 0) {
      return regExpFromCache;
    }
    const regExpNew = new RegExp(pattern);
    if (this.regExpQueue.length === this.capacity) {
      this.regExpMap.delete(this.regExpQueue.shift());
    }
    this.regExpMap.set(pattern, regExpNew);
    this.regExpQueue.push(pattern);
    return regExpNew;
  }
};
var chars = [" ", ",", "?", "!", ";"];
var looksLikeObjectPathRegExpCache = new RegExpCache(20);
var looksLikeObjectPath = (key, nsSeparator, keySeparator) => {
  nsSeparator = nsSeparator || "";
  keySeparator = keySeparator || "";
  const possibleChars = chars.filter((c) => nsSeparator.indexOf(c) < 0 && keySeparator.indexOf(c) < 0);
  if (possibleChars.length === 0) return true;
  const r = looksLikeObjectPathRegExpCache.getRegExp(`(${possibleChars.map((c) => c === "?" ? "\\?" : c).join("|")})`);
  let matched = !r.test(key);
  if (!matched) {
    const ki = key.indexOf(keySeparator);
    if (ki > 0 && !r.test(key.substring(0, ki))) {
      matched = true;
    }
  }
  return matched;
};
var deepFind = function(obj, path2) {
  let keySeparator = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : ".";
  if (!obj) return void 0;
  if (obj[path2]) {
    if (!Object.prototype.hasOwnProperty.call(obj, path2)) return void 0;
    return obj[path2];
  }
  const tokens = path2.split(keySeparator);
  let current = obj;
  for (let i = 0; i < tokens.length; ) {
    if (!current || typeof current !== "object") {
      return void 0;
    }
    let next;
    let nextPath = "";
    for (let j = i; j < tokens.length; ++j) {
      if (j !== i) {
        nextPath += keySeparator;
      }
      nextPath += tokens[j];
      next = current[nextPath];
      if (next !== void 0) {
        if (["string", "number", "boolean"].indexOf(typeof next) > -1 && j < tokens.length - 1) {
          continue;
        }
        i += j - i + 1;
        break;
      }
    }
    current = next;
  }
  return current;
};
var getCleanedCode = (code) => code?.replace("_", "-");
var consoleLogger = {
  type: "logger",
  log(args) {
    this.output("log", args);
  },
  warn(args) {
    this.output("warn", args);
  },
  error(args) {
    this.output("error", args);
  },
  output(type, args) {
    console?.[type]?.apply?.(console, args);
  }
};
var Logger = class _Logger {
  constructor(concreteLogger) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    this.init(concreteLogger, options);
  }
  init(concreteLogger) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    this.prefix = options.prefix || "i18next:";
    this.logger = concreteLogger || consoleLogger;
    this.options = options;
    this.debug = options.debug;
  }
  log() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return this.forward(args, "log", "", true);
  }
  warn() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    return this.forward(args, "warn", "", true);
  }
  error() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    return this.forward(args, "error", "");
  }
  deprecate() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return this.forward(args, "warn", "WARNING DEPRECATED: ", true);
  }
  forward(args, lvl, prefix, debugOnly) {
    if (debugOnly && !this.debug) return null;
    if (isString2(args[0])) args[0] = `${prefix}${this.prefix} ${args[0]}`;
    return this.logger[lvl](args);
  }
  create(moduleName) {
    return new _Logger(this.logger, {
      ...{
        prefix: `${this.prefix}:${moduleName}:`
      },
      ...this.options
    });
  }
  clone(options) {
    options = options || this.options;
    options.prefix = options.prefix || this.prefix;
    return new _Logger(this.logger, options);
  }
};
var baseLogger = new Logger();
var EventEmitter = class {
  constructor() {
    this.observers = {};
  }
  on(events, listener) {
    events.split(" ").forEach((event) => {
      if (!this.observers[event]) this.observers[event] = /* @__PURE__ */ new Map();
      const numListeners = this.observers[event].get(listener) || 0;
      this.observers[event].set(listener, numListeners + 1);
    });
    return this;
  }
  off(event, listener) {
    if (!this.observers[event]) return;
    if (!listener) {
      delete this.observers[event];
      return;
    }
    this.observers[event].delete(listener);
  }
  emit(event) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    if (this.observers[event]) {
      const cloned = Array.from(this.observers[event].entries());
      cloned.forEach((_ref) => {
        let [observer, numTimesAdded] = _ref;
        for (let i = 0; i < numTimesAdded; i++) {
          observer(...args);
        }
      });
    }
    if (this.observers["*"]) {
      const cloned = Array.from(this.observers["*"].entries());
      cloned.forEach((_ref2) => {
        let [observer, numTimesAdded] = _ref2;
        for (let i = 0; i < numTimesAdded; i++) {
          observer.apply(observer, [event, ...args]);
        }
      });
    }
  }
};
var ResourceStore = class extends EventEmitter {
  constructor(data) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
      ns: ["translation"],
      defaultNS: "translation"
    };
    super();
    this.data = data || {};
    this.options = options;
    if (this.options.keySeparator === void 0) {
      this.options.keySeparator = ".";
    }
    if (this.options.ignoreJSONStructure === void 0) {
      this.options.ignoreJSONStructure = true;
    }
  }
  addNamespaces(ns) {
    if (this.options.ns.indexOf(ns) < 0) {
      this.options.ns.push(ns);
    }
  }
  removeNamespaces(ns) {
    const index = this.options.ns.indexOf(ns);
    if (index > -1) {
      this.options.ns.splice(index, 1);
    }
  }
  getResource(lng, ns, key) {
    let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
    const ignoreJSONStructure = options.ignoreJSONStructure !== void 0 ? options.ignoreJSONStructure : this.options.ignoreJSONStructure;
    let path2;
    if (lng.indexOf(".") > -1) {
      path2 = lng.split(".");
    } else {
      path2 = [lng, ns];
      if (key) {
        if (Array.isArray(key)) {
          path2.push(...key);
        } else if (isString2(key) && keySeparator) {
          path2.push(...key.split(keySeparator));
        } else {
          path2.push(key);
        }
      }
    }
    const result = getPath(this.data, path2);
    if (!result && !ns && !key && lng.indexOf(".") > -1) {
      lng = path2[0];
      ns = path2[1];
      key = path2.slice(2).join(".");
    }
    if (result || !ignoreJSONStructure || !isString2(key)) return result;
    return deepFind(this.data?.[lng]?.[ns], key, keySeparator);
  }
  addResource(lng, ns, key, value) {
    let options = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : {
      silent: false
    };
    const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
    let path2 = [lng, ns];
    if (key) path2 = path2.concat(keySeparator ? key.split(keySeparator) : key);
    if (lng.indexOf(".") > -1) {
      path2 = lng.split(".");
      value = ns;
      ns = path2[1];
    }
    this.addNamespaces(ns);
    setPath(this.data, path2, value);
    if (!options.silent) this.emit("added", lng, ns, key, value);
  }
  addResources(lng, ns, resources2) {
    let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {
      silent: false
    };
    for (const m in resources2) {
      if (isString2(resources2[m]) || Array.isArray(resources2[m])) this.addResource(lng, ns, m, resources2[m], {
        silent: true
      });
    }
    if (!options.silent) this.emit("added", lng, ns, resources2);
  }
  addResourceBundle(lng, ns, resources2, deep, overwrite) {
    let options = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {
      silent: false,
      skipCopy: false
    };
    let path2 = [lng, ns];
    if (lng.indexOf(".") > -1) {
      path2 = lng.split(".");
      deep = resources2;
      resources2 = ns;
      ns = path2[1];
    }
    this.addNamespaces(ns);
    let pack = getPath(this.data, path2) || {};
    if (!options.skipCopy) resources2 = JSON.parse(JSON.stringify(resources2));
    if (deep) {
      deepExtend(pack, resources2, overwrite);
    } else {
      pack = {
        ...pack,
        ...resources2
      };
    }
    setPath(this.data, path2, pack);
    if (!options.silent) this.emit("added", lng, ns, resources2);
  }
  removeResourceBundle(lng, ns) {
    if (this.hasResourceBundle(lng, ns)) {
      delete this.data[lng][ns];
    }
    this.removeNamespaces(ns);
    this.emit("removed", lng, ns);
  }
  hasResourceBundle(lng, ns) {
    return this.getResource(lng, ns) !== void 0;
  }
  getResourceBundle(lng, ns) {
    if (!ns) ns = this.options.defaultNS;
    return this.getResource(lng, ns);
  }
  getDataByLanguage(lng) {
    return this.data[lng];
  }
  hasLanguageSomeTranslations(lng) {
    const data = this.getDataByLanguage(lng);
    const n = data && Object.keys(data) || [];
    return !!n.find((v) => data[v] && Object.keys(data[v]).length > 0);
  }
  toJSON() {
    return this.data;
  }
};
var postProcessor = {
  processors: {},
  addPostProcessor(module) {
    this.processors[module.name] = module;
  },
  handle(processors, value, key, options, translator) {
    processors.forEach((processor) => {
      value = this.processors[processor]?.process(value, key, options, translator) ?? value;
    });
    return value;
  }
};
var checkedLoadedFor = {};
var shouldHandleAsObject = (res) => !isString2(res) && typeof res !== "boolean" && typeof res !== "number";
var Translator = class _Translator extends EventEmitter {
  constructor(services) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    super();
    copy(["resourceStore", "languageUtils", "pluralResolver", "interpolator", "backendConnector", "i18nFormat", "utils"], services, this);
    this.options = options;
    if (this.options.keySeparator === void 0) {
      this.options.keySeparator = ".";
    }
    this.logger = baseLogger.create("translator");
  }
  changeLanguage(lng) {
    if (lng) this.language = lng;
  }
  exists(key) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
      interpolation: {}
    };
    if (key == null) {
      return false;
    }
    const resolved = this.resolve(key, options);
    return resolved?.res !== void 0;
  }
  extractFromKey(key, options) {
    let nsSeparator = options.nsSeparator !== void 0 ? options.nsSeparator : this.options.nsSeparator;
    if (nsSeparator === void 0) nsSeparator = ":";
    const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
    let namespaces = options.ns || this.options.defaultNS || [];
    const wouldCheckForNsInKey = nsSeparator && key.indexOf(nsSeparator) > -1;
    const seemsNaturalLanguage = !this.options.userDefinedKeySeparator && !options.keySeparator && !this.options.userDefinedNsSeparator && !options.nsSeparator && !looksLikeObjectPath(key, nsSeparator, keySeparator);
    if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
      const m = key.match(this.interpolator.nestingRegexp);
      if (m && m.length > 0) {
        return {
          key,
          namespaces: isString2(namespaces) ? [namespaces] : namespaces
        };
      }
      const parts = key.split(nsSeparator);
      if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1) namespaces = parts.shift();
      key = parts.join(keySeparator);
    }
    return {
      key,
      namespaces: isString2(namespaces) ? [namespaces] : namespaces
    };
  }
  translate(keys, options, lastKey) {
    if (typeof options !== "object" && this.options.overloadTranslationOptionHandler) {
      options = this.options.overloadTranslationOptionHandler(arguments);
    }
    if (typeof options === "object") options = {
      ...options
    };
    if (!options) options = {};
    if (keys == null) return "";
    if (!Array.isArray(keys)) keys = [String(keys)];
    const returnDetails = options.returnDetails !== void 0 ? options.returnDetails : this.options.returnDetails;
    const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
    const {
      key,
      namespaces
    } = this.extractFromKey(keys[keys.length - 1], options);
    const namespace = namespaces[namespaces.length - 1];
    const lng = options.lng || this.language;
    const appendNamespaceToCIMode = options.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
    if (lng?.toLowerCase() === "cimode") {
      if (appendNamespaceToCIMode) {
        const nsSeparator = options.nsSeparator || this.options.nsSeparator;
        if (returnDetails) {
          return {
            res: `${namespace}${nsSeparator}${key}`,
            usedKey: key,
            exactUsedKey: key,
            usedLng: lng,
            usedNS: namespace,
            usedParams: this.getUsedParamsDetails(options)
          };
        }
        return `${namespace}${nsSeparator}${key}`;
      }
      if (returnDetails) {
        return {
          res: key,
          usedKey: key,
          exactUsedKey: key,
          usedLng: lng,
          usedNS: namespace,
          usedParams: this.getUsedParamsDetails(options)
        };
      }
      return key;
    }
    const resolved = this.resolve(keys, options);
    let res = resolved?.res;
    const resUsedKey = resolved?.usedKey || key;
    const resExactUsedKey = resolved?.exactUsedKey || key;
    const noObject = ["[object Number]", "[object Function]", "[object RegExp]"];
    const joinArrays = options.joinArrays !== void 0 ? options.joinArrays : this.options.joinArrays;
    const handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
    const needsPluralHandling = options.count !== void 0 && !isString2(options.count);
    const hasDefaultValue = _Translator.hasDefaultValue(options);
    const defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, options) : "";
    const defaultValueSuffixOrdinalFallback = options.ordinal && needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, {
      ordinal: false
    }) : "";
    const needsZeroSuffixLookup = needsPluralHandling && !options.ordinal && options.count === 0;
    const defaultValue = needsZeroSuffixLookup && options[`defaultValue${this.options.pluralSeparator}zero`] || options[`defaultValue${defaultValueSuffix}`] || options[`defaultValue${defaultValueSuffixOrdinalFallback}`] || options.defaultValue;
    let resForObjHndl = res;
    if (handleAsObjectInI18nFormat && !res && hasDefaultValue) {
      resForObjHndl = defaultValue;
    }
    const handleAsObject = shouldHandleAsObject(resForObjHndl);
    const resType = Object.prototype.toString.apply(resForObjHndl);
    if (handleAsObjectInI18nFormat && resForObjHndl && handleAsObject && noObject.indexOf(resType) < 0 && !(isString2(joinArrays) && Array.isArray(resForObjHndl))) {
      if (!options.returnObjects && !this.options.returnObjects) {
        if (!this.options.returnedObjectHandler) {
          this.logger.warn("accessing an object - but returnObjects options is not enabled!");
        }
        const r = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, resForObjHndl, {
          ...options,
          ns: namespaces
        }) : `key '${key} (${this.language})' returned an object instead of string.`;
        if (returnDetails) {
          resolved.res = r;
          resolved.usedParams = this.getUsedParamsDetails(options);
          return resolved;
        }
        return r;
      }
      if (keySeparator) {
        const resTypeIsArray = Array.isArray(resForObjHndl);
        const copy2 = resTypeIsArray ? [] : {};
        const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;
        for (const m in resForObjHndl) {
          if (Object.prototype.hasOwnProperty.call(resForObjHndl, m)) {
            const deepKey = `${newKeyToUse}${keySeparator}${m}`;
            if (hasDefaultValue && !res) {
              copy2[m] = this.translate(deepKey, {
                ...options,
                defaultValue: shouldHandleAsObject(defaultValue) ? defaultValue[m] : void 0,
                ...{
                  joinArrays: false,
                  ns: namespaces
                }
              });
            } else {
              copy2[m] = this.translate(deepKey, {
                ...options,
                ...{
                  joinArrays: false,
                  ns: namespaces
                }
              });
            }
            if (copy2[m] === deepKey) copy2[m] = resForObjHndl[m];
          }
        }
        res = copy2;
      }
    } else if (handleAsObjectInI18nFormat && isString2(joinArrays) && Array.isArray(res)) {
      res = res.join(joinArrays);
      if (res) res = this.extendTranslation(res, keys, options, lastKey);
    } else {
      let usedDefault = false;
      let usedKey = false;
      if (!this.isValidLookup(res) && hasDefaultValue) {
        usedDefault = true;
        res = defaultValue;
      }
      if (!this.isValidLookup(res)) {
        usedKey = true;
        res = key;
      }
      const missingKeyNoValueFallbackToKey = options.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey;
      const resForMissing = missingKeyNoValueFallbackToKey && usedKey ? void 0 : res;
      const updateMissing = hasDefaultValue && defaultValue !== res && this.options.updateMissing;
      if (usedKey || usedDefault || updateMissing) {
        this.logger.log(updateMissing ? "updateKey" : "missingKey", lng, namespace, key, updateMissing ? defaultValue : res);
        if (keySeparator) {
          const fk = this.resolve(key, {
            ...options,
            keySeparator: false
          });
          if (fk && fk.res) this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.");
        }
        let lngs = [];
        const fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, options.lng || this.language);
        if (this.options.saveMissingTo === "fallback" && fallbackLngs && fallbackLngs[0]) {
          for (let i = 0; i < fallbackLngs.length; i++) {
            lngs.push(fallbackLngs[i]);
          }
        } else if (this.options.saveMissingTo === "all") {
          lngs = this.languageUtils.toResolveHierarchy(options.lng || this.language);
        } else {
          lngs.push(options.lng || this.language);
        }
        const send = (l, k, specificDefaultValue) => {
          const defaultForMissing = hasDefaultValue && specificDefaultValue !== res ? specificDefaultValue : resForMissing;
          if (this.options.missingKeyHandler) {
            this.options.missingKeyHandler(l, namespace, k, defaultForMissing, updateMissing, options);
          } else if (this.backendConnector?.saveMissing) {
            this.backendConnector.saveMissing(l, namespace, k, defaultForMissing, updateMissing, options);
          }
          this.emit("missingKey", l, namespace, k, res);
        };
        if (this.options.saveMissing) {
          if (this.options.saveMissingPlurals && needsPluralHandling) {
            lngs.forEach((language) => {
              const suffixes = this.pluralResolver.getSuffixes(language, options);
              if (needsZeroSuffixLookup && options[`defaultValue${this.options.pluralSeparator}zero`] && suffixes.indexOf(`${this.options.pluralSeparator}zero`) < 0) {
                suffixes.push(`${this.options.pluralSeparator}zero`);
              }
              suffixes.forEach((suffix) => {
                send([language], key + suffix, options[`defaultValue${suffix}`] || defaultValue);
              });
            });
          } else {
            send(lngs, key, defaultValue);
          }
        }
      }
      res = this.extendTranslation(res, keys, options, resolved, lastKey);
      if (usedKey && res === key && this.options.appendNamespaceToMissingKey) res = `${namespace}:${key}`;
      if ((usedKey || usedDefault) && this.options.parseMissingKeyHandler) {
        res = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${namespace}:${key}` : key, usedDefault ? res : void 0);
      }
    }
    if (returnDetails) {
      resolved.res = res;
      resolved.usedParams = this.getUsedParamsDetails(options);
      return resolved;
    }
    return res;
  }
  extendTranslation(res, key, options, resolved, lastKey) {
    var _this = this;
    if (this.i18nFormat?.parse) {
      res = this.i18nFormat.parse(res, {
        ...this.options.interpolation.defaultVariables,
        ...options
      }, options.lng || this.language || resolved.usedLng, resolved.usedNS, resolved.usedKey, {
        resolved
      });
    } else if (!options.skipInterpolation) {
      if (options.interpolation) this.interpolator.init({
        ...options,
        ...{
          interpolation: {
            ...this.options.interpolation,
            ...options.interpolation
          }
        }
      });
      const skipOnVariables = isString2(res) && (options?.interpolation?.skipOnVariables !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
      let nestBef;
      if (skipOnVariables) {
        const nb = res.match(this.interpolator.nestingRegexp);
        nestBef = nb && nb.length;
      }
      let data = options.replace && !isString2(options.replace) ? options.replace : options;
      if (this.options.interpolation.defaultVariables) data = {
        ...this.options.interpolation.defaultVariables,
        ...data
      };
      res = this.interpolator.interpolate(res, data, options.lng || this.language || resolved.usedLng, options);
      if (skipOnVariables) {
        const na = res.match(this.interpolator.nestingRegexp);
        const nestAft = na && na.length;
        if (nestBef < nestAft) options.nest = false;
      }
      if (!options.lng && resolved && resolved.res) options.lng = this.language || resolved.usedLng;
      if (options.nest !== false) res = this.interpolator.nest(res, function() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        if (lastKey?.[0] === args[0] && !options.context) {
          _this.logger.warn(`It seems you are nesting recursively key: ${args[0]} in key: ${key[0]}`);
          return null;
        }
        return _this.translate(...args, key);
      }, options);
      if (options.interpolation) this.interpolator.reset();
    }
    const postProcess = options.postProcess || this.options.postProcess;
    const postProcessorNames = isString2(postProcess) ? [postProcess] : postProcess;
    if (res != null && postProcessorNames?.length && options.applyPostProcessor !== false) {
      res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? {
        i18nResolved: {
          ...resolved,
          usedParams: this.getUsedParamsDetails(options)
        },
        ...options
      } : options, this);
    }
    return res;
  }
  resolve(keys) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let found;
    let usedKey;
    let exactUsedKey;
    let usedLng;
    let usedNS;
    if (isString2(keys)) keys = [keys];
    keys.forEach((k) => {
      if (this.isValidLookup(found)) return;
      const extracted = this.extractFromKey(k, options);
      const key = extracted.key;
      usedKey = key;
      let namespaces = extracted.namespaces;
      if (this.options.fallbackNS) namespaces = namespaces.concat(this.options.fallbackNS);
      const needsPluralHandling = options.count !== void 0 && !isString2(options.count);
      const needsZeroSuffixLookup = needsPluralHandling && !options.ordinal && options.count === 0;
      const needsContextHandling = options.context !== void 0 && (isString2(options.context) || typeof options.context === "number") && options.context !== "";
      const codes = options.lngs ? options.lngs : this.languageUtils.toResolveHierarchy(options.lng || this.language, options.fallbackLng);
      namespaces.forEach((ns) => {
        if (this.isValidLookup(found)) return;
        usedNS = ns;
        if (!checkedLoadedFor[`${codes[0]}-${ns}`] && this.utils?.hasLoadedNamespace && !this.utils?.hasLoadedNamespace(usedNS)) {
          checkedLoadedFor[`${codes[0]}-${ns}`] = true;
          this.logger.warn(`key "${usedKey}" for languages "${codes.join(", ")}" won't get resolved as namespace "${usedNS}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
        }
        codes.forEach((code) => {
          if (this.isValidLookup(found)) return;
          usedLng = code;
          const finalKeys = [key];
          if (this.i18nFormat?.addLookupKeys) {
            this.i18nFormat.addLookupKeys(finalKeys, key, code, ns, options);
          } else {
            let pluralSuffix;
            if (needsPluralHandling) pluralSuffix = this.pluralResolver.getSuffix(code, options.count, options);
            const zeroSuffix = `${this.options.pluralSeparator}zero`;
            const ordinalPrefix = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
            if (needsPluralHandling) {
              finalKeys.push(key + pluralSuffix);
              if (options.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                finalKeys.push(key + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
              }
              if (needsZeroSuffixLookup) {
                finalKeys.push(key + zeroSuffix);
              }
            }
            if (needsContextHandling) {
              const contextKey = `${key}${this.options.contextSeparator}${options.context}`;
              finalKeys.push(contextKey);
              if (needsPluralHandling) {
                finalKeys.push(contextKey + pluralSuffix);
                if (options.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                  finalKeys.push(contextKey + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
                }
                if (needsZeroSuffixLookup) {
                  finalKeys.push(contextKey + zeroSuffix);
                }
              }
            }
          }
          let possibleKey;
          while (possibleKey = finalKeys.pop()) {
            if (!this.isValidLookup(found)) {
              exactUsedKey = possibleKey;
              found = this.getResource(code, ns, possibleKey, options);
            }
          }
        });
      });
    });
    return {
      res: found,
      usedKey,
      exactUsedKey,
      usedLng,
      usedNS
    };
  }
  isValidLookup(res) {
    return res !== void 0 && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === "");
  }
  getResource(code, ns, key) {
    let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    if (this.i18nFormat?.getResource) return this.i18nFormat.getResource(code, ns, key, options);
    return this.resourceStore.getResource(code, ns, key, options);
  }
  getUsedParamsDetails() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const optionsKeys = ["defaultValue", "ordinal", "context", "replace", "lng", "lngs", "fallbackLng", "ns", "keySeparator", "nsSeparator", "returnObjects", "returnDetails", "joinArrays", "postProcess", "interpolation"];
    const useOptionsReplaceForData = options.replace && !isString2(options.replace);
    let data = useOptionsReplaceForData ? options.replace : options;
    if (useOptionsReplaceForData && typeof options.count !== "undefined") {
      data.count = options.count;
    }
    if (this.options.interpolation.defaultVariables) {
      data = {
        ...this.options.interpolation.defaultVariables,
        ...data
      };
    }
    if (!useOptionsReplaceForData) {
      data = {
        ...data
      };
      for (const key of optionsKeys) {
        delete data[key];
      }
    }
    return data;
  }
  static hasDefaultValue(options) {
    const prefix = "defaultValue";
    for (const option in options) {
      if (Object.prototype.hasOwnProperty.call(options, option) && prefix === option.substring(0, prefix.length) && void 0 !== options[option]) {
        return true;
      }
    }
    return false;
  }
};
var LanguageUtil = class {
  constructor(options) {
    this.options = options;
    this.supportedLngs = this.options.supportedLngs || false;
    this.logger = baseLogger.create("languageUtils");
  }
  getScriptPartFromCode(code) {
    code = getCleanedCode(code);
    if (!code || code.indexOf("-") < 0) return null;
    const p = code.split("-");
    if (p.length === 2) return null;
    p.pop();
    if (p[p.length - 1].toLowerCase() === "x") return null;
    return this.formatLanguageCode(p.join("-"));
  }
  getLanguagePartFromCode(code) {
    code = getCleanedCode(code);
    if (!code || code.indexOf("-") < 0) return code;
    const p = code.split("-");
    return this.formatLanguageCode(p[0]);
  }
  formatLanguageCode(code) {
    if (isString2(code) && code.indexOf("-") > -1) {
      let formattedCode;
      try {
        formattedCode = Intl.getCanonicalLocales(code)[0];
      } catch (e) {
      }
      if (formattedCode && this.options.lowerCaseLng) {
        formattedCode = formattedCode.toLowerCase();
      }
      if (formattedCode) return formattedCode;
      if (this.options.lowerCaseLng) {
        return code.toLowerCase();
      }
      return code;
    }
    return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
  }
  isSupportedCode(code) {
    if (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) {
      code = this.getLanguagePartFromCode(code);
    }
    return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(code) > -1;
  }
  getBestMatchFromCodes(codes) {
    if (!codes) return null;
    let found;
    codes.forEach((code) => {
      if (found) return;
      const cleanedLng = this.formatLanguageCode(code);
      if (!this.options.supportedLngs || this.isSupportedCode(cleanedLng)) found = cleanedLng;
    });
    if (!found && this.options.supportedLngs) {
      codes.forEach((code) => {
        if (found) return;
        const lngOnly = this.getLanguagePartFromCode(code);
        if (this.isSupportedCode(lngOnly)) return found = lngOnly;
        found = this.options.supportedLngs.find((supportedLng) => {
          if (supportedLng === lngOnly) return supportedLng;
          if (supportedLng.indexOf("-") < 0 && lngOnly.indexOf("-") < 0) return;
          if (supportedLng.indexOf("-") > 0 && lngOnly.indexOf("-") < 0 && supportedLng.substring(0, supportedLng.indexOf("-")) === lngOnly) return supportedLng;
          if (supportedLng.indexOf(lngOnly) === 0 && lngOnly.length > 1) return supportedLng;
        });
      });
    }
    if (!found) found = this.getFallbackCodes(this.options.fallbackLng)[0];
    return found;
  }
  getFallbackCodes(fallbacks, code) {
    if (!fallbacks) return [];
    if (typeof fallbacks === "function") fallbacks = fallbacks(code);
    if (isString2(fallbacks)) fallbacks = [fallbacks];
    if (Array.isArray(fallbacks)) return fallbacks;
    if (!code) return fallbacks.default || [];
    let found = fallbacks[code];
    if (!found) found = fallbacks[this.getScriptPartFromCode(code)];
    if (!found) found = fallbacks[this.formatLanguageCode(code)];
    if (!found) found = fallbacks[this.getLanguagePartFromCode(code)];
    if (!found) found = fallbacks.default;
    return found || [];
  }
  toResolveHierarchy(code, fallbackCode) {
    const fallbackCodes = this.getFallbackCodes(fallbackCode || this.options.fallbackLng || [], code);
    const codes = [];
    const addCode = (c) => {
      if (!c) return;
      if (this.isSupportedCode(c)) {
        codes.push(c);
      } else {
        this.logger.warn(`rejecting language code not found in supportedLngs: ${c}`);
      }
    };
    if (isString2(code) && (code.indexOf("-") > -1 || code.indexOf("_") > -1)) {
      if (this.options.load !== "languageOnly") addCode(this.formatLanguageCode(code));
      if (this.options.load !== "languageOnly" && this.options.load !== "currentOnly") addCode(this.getScriptPartFromCode(code));
      if (this.options.load !== "currentOnly") addCode(this.getLanguagePartFromCode(code));
    } else if (isString2(code)) {
      addCode(this.formatLanguageCode(code));
    }
    fallbackCodes.forEach((fc) => {
      if (codes.indexOf(fc) < 0) addCode(this.formatLanguageCode(fc));
    });
    return codes;
  }
};
var suffixesOrder = {
  zero: 0,
  one: 1,
  two: 2,
  few: 3,
  many: 4,
  other: 5
};
var dummyRule = {
  select: (count) => count === 1 ? "one" : "other",
  resolvedOptions: () => ({
    pluralCategories: ["one", "other"]
  })
};
var PluralResolver = class {
  constructor(languageUtils) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    this.languageUtils = languageUtils;
    this.options = options;
    this.logger = baseLogger.create("pluralResolver");
    this.pluralRulesCache = {};
  }
  addRule(lng, obj) {
    this.rules[lng] = obj;
  }
  clearCache() {
    this.pluralRulesCache = {};
  }
  getRule(code) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const cleanedCode = getCleanedCode(code === "dev" ? "en" : code);
    const type = options.ordinal ? "ordinal" : "cardinal";
    const cacheKey = JSON.stringify({
      cleanedCode,
      type
    });
    if (cacheKey in this.pluralRulesCache) {
      return this.pluralRulesCache[cacheKey];
    }
    let rule;
    try {
      rule = new Intl.PluralRules(cleanedCode, {
        type
      });
    } catch (err) {
      if (!Intl) {
        this.logger.error("No Intl support, please use an Intl polyfill!");
        return dummyRule;
      }
      if (!code.match(/-|_/)) return dummyRule;
      const lngPart = this.languageUtils.getLanguagePartFromCode(code);
      rule = this.getRule(lngPart, options);
    }
    this.pluralRulesCache[cacheKey] = rule;
    return rule;
  }
  needsPlural(code) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let rule = this.getRule(code, options);
    if (!rule) rule = this.getRule("dev", options);
    return rule?.resolvedOptions().pluralCategories.length > 1;
  }
  getPluralFormsOfKey(code, key) {
    let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    return this.getSuffixes(code, options).map((suffix) => `${key}${suffix}`);
  }
  getSuffixes(code) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    let rule = this.getRule(code, options);
    if (!rule) rule = this.getRule("dev", options);
    if (!rule) return [];
    return rule.resolvedOptions().pluralCategories.sort((pluralCategory1, pluralCategory2) => suffixesOrder[pluralCategory1] - suffixesOrder[pluralCategory2]).map((pluralCategory) => `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${pluralCategory}`);
  }
  getSuffix(code, count) {
    let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    const rule = this.getRule(code, options);
    if (rule) {
      return `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${rule.select(count)}`;
    }
    this.logger.warn(`no plural rule found for: ${code}`);
    return this.getSuffix("dev", count, options);
  }
};
var deepFindWithDefaults = function(data, defaultData, key) {
  let keySeparator = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : ".";
  let ignoreJSONStructure = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : true;
  let path2 = getPathWithDefaults(data, defaultData, key);
  if (!path2 && ignoreJSONStructure && isString2(key)) {
    path2 = deepFind(data, key, keySeparator);
    if (path2 === void 0) path2 = deepFind(defaultData, key, keySeparator);
  }
  return path2;
};
var regexSafe = (val) => val.replace(/\$/g, "$$$$");
var Interpolator = class {
  constructor() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    this.logger = baseLogger.create("interpolator");
    this.options = options;
    this.format = options?.interpolation?.format || ((value) => value);
    this.init(options);
  }
  init() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (!options.interpolation) options.interpolation = {
      escapeValue: true
    };
    const {
      escape: escape$1,
      escapeValue,
      useRawValueToEscape,
      prefix,
      prefixEscaped,
      suffix,
      suffixEscaped,
      formatSeparator,
      unescapeSuffix,
      unescapePrefix,
      nestingPrefix,
      nestingPrefixEscaped,
      nestingSuffix,
      nestingSuffixEscaped,
      nestingOptionsSeparator,
      maxReplaces,
      alwaysFormat
    } = options.interpolation;
    this.escape = escape$1 !== void 0 ? escape$1 : escape;
    this.escapeValue = escapeValue !== void 0 ? escapeValue : true;
    this.useRawValueToEscape = useRawValueToEscape !== void 0 ? useRawValueToEscape : false;
    this.prefix = prefix ? regexEscape(prefix) : prefixEscaped || "{{";
    this.suffix = suffix ? regexEscape(suffix) : suffixEscaped || "}}";
    this.formatSeparator = formatSeparator || ",";
    this.unescapePrefix = unescapeSuffix ? "" : unescapePrefix || "-";
    this.unescapeSuffix = this.unescapePrefix ? "" : unescapeSuffix || "";
    this.nestingPrefix = nestingPrefix ? regexEscape(nestingPrefix) : nestingPrefixEscaped || regexEscape("$t(");
    this.nestingSuffix = nestingSuffix ? regexEscape(nestingSuffix) : nestingSuffixEscaped || regexEscape(")");
    this.nestingOptionsSeparator = nestingOptionsSeparator || ",";
    this.maxReplaces = maxReplaces || 1e3;
    this.alwaysFormat = alwaysFormat !== void 0 ? alwaysFormat : false;
    this.resetRegExp();
  }
  reset() {
    if (this.options) this.init(this.options);
  }
  resetRegExp() {
    const getOrResetRegExp = (existingRegExp, pattern) => {
      if (existingRegExp?.source === pattern) {
        existingRegExp.lastIndex = 0;
        return existingRegExp;
      }
      return new RegExp(pattern, "g");
    };
    this.regexp = getOrResetRegExp(this.regexp, `${this.prefix}(.+?)${this.suffix}`);
    this.regexpUnescape = getOrResetRegExp(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`);
    this.nestingRegexp = getOrResetRegExp(this.nestingRegexp, `${this.nestingPrefix}(.+?)${this.nestingSuffix}`);
  }
  interpolate(str, data, lng, options) {
    let match;
    let value;
    let replaces;
    const defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};
    const handleFormat = (key) => {
      if (key.indexOf(this.formatSeparator) < 0) {
        const path2 = deepFindWithDefaults(data, defaultData, key, this.options.keySeparator, this.options.ignoreJSONStructure);
        return this.alwaysFormat ? this.format(path2, void 0, lng, {
          ...options,
          ...data,
          interpolationkey: key
        }) : path2;
      }
      const p = key.split(this.formatSeparator);
      const k = p.shift().trim();
      const f = p.join(this.formatSeparator).trim();
      return this.format(deepFindWithDefaults(data, defaultData, k, this.options.keySeparator, this.options.ignoreJSONStructure), f, lng, {
        ...options,
        ...data,
        interpolationkey: k
      });
    };
    this.resetRegExp();
    const missingInterpolationHandler = options?.missingInterpolationHandler || this.options.missingInterpolationHandler;
    const skipOnVariables = options?.interpolation?.skipOnVariables !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
    const todos = [{
      regex: this.regexpUnescape,
      safeValue: (val) => regexSafe(val)
    }, {
      regex: this.regexp,
      safeValue: (val) => this.escapeValue ? regexSafe(this.escape(val)) : regexSafe(val)
    }];
    todos.forEach((todo) => {
      replaces = 0;
      while (match = todo.regex.exec(str)) {
        const matchedVar = match[1].trim();
        value = handleFormat(matchedVar);
        if (value === void 0) {
          if (typeof missingInterpolationHandler === "function") {
            const temp = missingInterpolationHandler(str, match, options);
            value = isString2(temp) ? temp : "";
          } else if (options && Object.prototype.hasOwnProperty.call(options, matchedVar)) {
            value = "";
          } else if (skipOnVariables) {
            value = match[0];
            continue;
          } else {
            this.logger.warn(`missed to pass in variable ${matchedVar} for interpolating ${str}`);
            value = "";
          }
        } else if (!isString2(value) && !this.useRawValueToEscape) {
          value = makeString(value);
        }
        const safeValue = todo.safeValue(value);
        str = str.replace(match[0], safeValue);
        if (skipOnVariables) {
          todo.regex.lastIndex += value.length;
          todo.regex.lastIndex -= match[0].length;
        } else {
          todo.regex.lastIndex = 0;
        }
        replaces++;
        if (replaces >= this.maxReplaces) {
          break;
        }
      }
    });
    return str;
  }
  nest(str, fc) {
    let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    let match;
    let value;
    let clonedOptions;
    const handleHasOptions = (key, inheritedOptions) => {
      const sep = this.nestingOptionsSeparator;
      if (key.indexOf(sep) < 0) return key;
      const c = key.split(new RegExp(`${sep}[ ]*{`));
      let optionsString = `{${c[1]}`;
      key = c[0];
      optionsString = this.interpolate(optionsString, clonedOptions);
      const matchedSingleQuotes = optionsString.match(/'/g);
      const matchedDoubleQuotes = optionsString.match(/"/g);
      if ((matchedSingleQuotes?.length ?? 0) % 2 === 0 && !matchedDoubleQuotes || matchedDoubleQuotes.length % 2 !== 0) {
        optionsString = optionsString.replace(/'/g, '"');
      }
      try {
        clonedOptions = JSON.parse(optionsString);
        if (inheritedOptions) clonedOptions = {
          ...inheritedOptions,
          ...clonedOptions
        };
      } catch (e) {
        this.logger.warn(`failed parsing options string in nesting for key ${key}`, e);
        return `${key}${sep}${optionsString}`;
      }
      if (clonedOptions.defaultValue && clonedOptions.defaultValue.indexOf(this.prefix) > -1) delete clonedOptions.defaultValue;
      return key;
    };
    while (match = this.nestingRegexp.exec(str)) {
      let formatters = [];
      clonedOptions = {
        ...options
      };
      clonedOptions = clonedOptions.replace && !isString2(clonedOptions.replace) ? clonedOptions.replace : clonedOptions;
      clonedOptions.applyPostProcessor = false;
      delete clonedOptions.defaultValue;
      let doReduce = false;
      if (match[0].indexOf(this.formatSeparator) !== -1 && !/{.*}/.test(match[1])) {
        const r = match[1].split(this.formatSeparator).map((elem) => elem.trim());
        match[1] = r.shift();
        formatters = r;
        doReduce = true;
      }
      value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
      if (value && match[0] === str && !isString2(value)) return value;
      if (!isString2(value)) value = makeString(value);
      if (!value) {
        this.logger.warn(`missed to resolve ${match[1]} for nesting ${str}`);
        value = "";
      }
      if (doReduce) {
        value = formatters.reduce((v, f) => this.format(v, f, options.lng, {
          ...options,
          interpolationkey: match[1].trim()
        }), value.trim());
      }
      str = str.replace(match[0], value);
      this.regexp.lastIndex = 0;
    }
    return str;
  }
};
var parseFormatStr = (formatStr) => {
  let formatName = formatStr.toLowerCase().trim();
  const formatOptions = {};
  if (formatStr.indexOf("(") > -1) {
    const p = formatStr.split("(");
    formatName = p[0].toLowerCase().trim();
    const optStr = p[1].substring(0, p[1].length - 1);
    if (formatName === "currency" && optStr.indexOf(":") < 0) {
      if (!formatOptions.currency) formatOptions.currency = optStr.trim();
    } else if (formatName === "relativetime" && optStr.indexOf(":") < 0) {
      if (!formatOptions.range) formatOptions.range = optStr.trim();
    } else {
      const opts = optStr.split(";");
      opts.forEach((opt) => {
        if (opt) {
          const [key, ...rest] = opt.split(":");
          const val = rest.join(":").trim().replace(/^'+|'+$/g, "");
          const trimmedKey = key.trim();
          if (!formatOptions[trimmedKey]) formatOptions[trimmedKey] = val;
          if (val === "false") formatOptions[trimmedKey] = false;
          if (val === "true") formatOptions[trimmedKey] = true;
          if (!isNaN(val)) formatOptions[trimmedKey] = parseInt(val, 10);
        }
      });
    }
  }
  return {
    formatName,
    formatOptions
  };
};
var createCachedFormatter = (fn) => {
  const cache = {};
  return (val, lng, options) => {
    let optForCache = options;
    if (options && options.interpolationkey && options.formatParams && options.formatParams[options.interpolationkey] && options[options.interpolationkey]) {
      optForCache = {
        ...optForCache,
        [options.interpolationkey]: void 0
      };
    }
    const key = lng + JSON.stringify(optForCache);
    let formatter = cache[key];
    if (!formatter) {
      formatter = fn(getCleanedCode(lng), options);
      cache[key] = formatter;
    }
    return formatter(val);
  };
};
var Formatter = class {
  constructor() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    this.logger = baseLogger.create("formatter");
    this.options = options;
    this.formats = {
      number: createCachedFormatter((lng, opt) => {
        const formatter = new Intl.NumberFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val);
      }),
      currency: createCachedFormatter((lng, opt) => {
        const formatter = new Intl.NumberFormat(lng, {
          ...opt,
          style: "currency"
        });
        return (val) => formatter.format(val);
      }),
      datetime: createCachedFormatter((lng, opt) => {
        const formatter = new Intl.DateTimeFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val);
      }),
      relativetime: createCachedFormatter((lng, opt) => {
        const formatter = new Intl.RelativeTimeFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val, opt.range || "day");
      }),
      list: createCachedFormatter((lng, opt) => {
        const formatter = new Intl.ListFormat(lng, {
          ...opt
        });
        return (val) => formatter.format(val);
      })
    };
    this.init(options);
  }
  init(services) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
      interpolation: {}
    };
    this.formatSeparator = options.interpolation.formatSeparator || ",";
  }
  add(name, fc) {
    this.formats[name.toLowerCase().trim()] = fc;
  }
  addCached(name, fc) {
    this.formats[name.toLowerCase().trim()] = createCachedFormatter(fc);
  }
  format(value, format, lng) {
    let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    const formats = format.split(this.formatSeparator);
    if (formats.length > 1 && formats[0].indexOf("(") > 1 && formats[0].indexOf(")") < 0 && formats.find((f) => f.indexOf(")") > -1)) {
      const lastIndex = formats.findIndex((f) => f.indexOf(")") > -1);
      formats[0] = [formats[0], ...formats.splice(1, lastIndex)].join(this.formatSeparator);
    }
    const result = formats.reduce((mem, f) => {
      const {
        formatName,
        formatOptions
      } = parseFormatStr(f);
      if (this.formats[formatName]) {
        let formatted = mem;
        try {
          const valOptions = options?.formatParams?.[options.interpolationkey] || {};
          const l = valOptions.locale || valOptions.lng || options.locale || options.lng || lng;
          formatted = this.formats[formatName](mem, l, {
            ...formatOptions,
            ...options,
            ...valOptions
          });
        } catch (error) {
          this.logger.warn(error);
        }
        return formatted;
      } else {
        this.logger.warn(`there was no format function for ${formatName}`);
      }
      return mem;
    }, value);
    return result;
  }
};
var removePending = (q, name) => {
  if (q.pending[name] !== void 0) {
    delete q.pending[name];
    q.pendingCount--;
  }
};
var Connector = class extends EventEmitter {
  constructor(backend, store, services) {
    let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    super();
    this.backend = backend;
    this.store = store;
    this.services = services;
    this.languageUtils = services.languageUtils;
    this.options = options;
    this.logger = baseLogger.create("backendConnector");
    this.waitingReads = [];
    this.maxParallelReads = options.maxParallelReads || 10;
    this.readingCalls = 0;
    this.maxRetries = options.maxRetries >= 0 ? options.maxRetries : 5;
    this.retryTimeout = options.retryTimeout >= 1 ? options.retryTimeout : 350;
    this.state = {};
    this.queue = [];
    this.backend?.init?.(services, options.backend, options);
  }
  queueLoad(languages, namespaces, options, callback) {
    const toLoad = {};
    const pending = {};
    const toLoadLanguages = {};
    const toLoadNamespaces = {};
    languages.forEach((lng) => {
      let hasAllNamespaces = true;
      namespaces.forEach((ns) => {
        const name = `${lng}|${ns}`;
        if (!options.reload && this.store.hasResourceBundle(lng, ns)) {
          this.state[name] = 2;
        } else if (this.state[name] < 0) ;
        else if (this.state[name] === 1) {
          if (pending[name] === void 0) pending[name] = true;
        } else {
          this.state[name] = 1;
          hasAllNamespaces = false;
          if (pending[name] === void 0) pending[name] = true;
          if (toLoad[name] === void 0) toLoad[name] = true;
          if (toLoadNamespaces[ns] === void 0) toLoadNamespaces[ns] = true;
        }
      });
      if (!hasAllNamespaces) toLoadLanguages[lng] = true;
    });
    if (Object.keys(toLoad).length || Object.keys(pending).length) {
      this.queue.push({
        pending,
        pendingCount: Object.keys(pending).length,
        loaded: {},
        errors: [],
        callback
      });
    }
    return {
      toLoad: Object.keys(toLoad),
      pending: Object.keys(pending),
      toLoadLanguages: Object.keys(toLoadLanguages),
      toLoadNamespaces: Object.keys(toLoadNamespaces)
    };
  }
  loaded(name, err, data) {
    const s = name.split("|");
    const lng = s[0];
    const ns = s[1];
    if (err) this.emit("failedLoading", lng, ns, err);
    if (!err && data) {
      this.store.addResourceBundle(lng, ns, data, void 0, void 0, {
        skipCopy: true
      });
    }
    this.state[name] = err ? -1 : 2;
    if (err && data) this.state[name] = 0;
    const loaded = {};
    this.queue.forEach((q) => {
      pushPath(q.loaded, [lng], ns);
      removePending(q, name);
      if (err) q.errors.push(err);
      if (q.pendingCount === 0 && !q.done) {
        Object.keys(q.loaded).forEach((l) => {
          if (!loaded[l]) loaded[l] = {};
          const loadedKeys = q.loaded[l];
          if (loadedKeys.length) {
            loadedKeys.forEach((n) => {
              if (loaded[l][n] === void 0) loaded[l][n] = true;
            });
          }
        });
        q.done = true;
        if (q.errors.length) {
          q.callback(q.errors);
        } else {
          q.callback();
        }
      }
    });
    this.emit("loaded", loaded);
    this.queue = this.queue.filter((q) => !q.done);
  }
  read(lng, ns, fcName) {
    let tried = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
    let wait = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : this.retryTimeout;
    let callback = arguments.length > 5 ? arguments[5] : void 0;
    if (!lng.length) return callback(null, {});
    if (this.readingCalls >= this.maxParallelReads) {
      this.waitingReads.push({
        lng,
        ns,
        fcName,
        tried,
        wait,
        callback
      });
      return;
    }
    this.readingCalls++;
    const resolver = (err, data) => {
      this.readingCalls--;
      if (this.waitingReads.length > 0) {
        const next = this.waitingReads.shift();
        this.read(next.lng, next.ns, next.fcName, next.tried, next.wait, next.callback);
      }
      if (err && data && tried < this.maxRetries) {
        setTimeout(() => {
          this.read.call(this, lng, ns, fcName, tried + 1, wait * 2, callback);
        }, wait);
        return;
      }
      callback(err, data);
    };
    const fc = this.backend[fcName].bind(this.backend);
    if (fc.length === 2) {
      try {
        const r = fc(lng, ns);
        if (r && typeof r.then === "function") {
          r.then((data) => resolver(null, data)).catch(resolver);
        } else {
          resolver(null, r);
        }
      } catch (err) {
        resolver(err);
      }
      return;
    }
    return fc(lng, ns, resolver);
  }
  prepareLoading(languages, namespaces) {
    let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    let callback = arguments.length > 3 ? arguments[3] : void 0;
    if (!this.backend) {
      this.logger.warn("No backend was added via i18next.use. Will not load resources.");
      return callback && callback();
    }
    if (isString2(languages)) languages = this.languageUtils.toResolveHierarchy(languages);
    if (isString2(namespaces)) namespaces = [namespaces];
    const toLoad = this.queueLoad(languages, namespaces, options, callback);
    if (!toLoad.toLoad.length) {
      if (!toLoad.pending.length) callback();
      return null;
    }
    toLoad.toLoad.forEach((name) => {
      this.loadOne(name);
    });
  }
  load(languages, namespaces, callback) {
    this.prepareLoading(languages, namespaces, {}, callback);
  }
  reload(languages, namespaces, callback) {
    this.prepareLoading(languages, namespaces, {
      reload: true
    }, callback);
  }
  loadOne(name) {
    let prefix = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    const s = name.split("|");
    const lng = s[0];
    const ns = s[1];
    this.read(lng, ns, "read", void 0, void 0, (err, data) => {
      if (err) this.logger.warn(`${prefix}loading namespace ${ns} for language ${lng} failed`, err);
      if (!err && data) this.logger.log(`${prefix}loaded namespace ${ns} for language ${lng}`, data);
      this.loaded(name, err, data);
    });
  }
  saveMissing(languages, namespace, key, fallbackValue, isUpdate) {
    let options = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {};
    let clb = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : () => {
    };
    if (this.services?.utils?.hasLoadedNamespace && !this.services?.utils?.hasLoadedNamespace(namespace)) {
      this.logger.warn(`did not save key "${key}" as the namespace "${namespace}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
      return;
    }
    if (key === void 0 || key === null || key === "") return;
    if (this.backend?.create) {
      const opts = {
        ...options,
        isUpdate
      };
      const fc = this.backend.create.bind(this.backend);
      if (fc.length < 6) {
        try {
          let r;
          if (fc.length === 5) {
            r = fc(languages, namespace, key, fallbackValue, opts);
          } else {
            r = fc(languages, namespace, key, fallbackValue);
          }
          if (r && typeof r.then === "function") {
            r.then((data) => clb(null, data)).catch(clb);
          } else {
            clb(null, r);
          }
        } catch (err) {
          clb(err);
        }
      } else {
        fc(languages, namespace, key, fallbackValue, clb, opts);
      }
    }
    if (!languages || !languages[0]) return;
    this.store.addResource(languages[0], namespace, key, fallbackValue);
  }
};
var get = () => ({
  debug: false,
  initAsync: true,
  ns: ["translation"],
  defaultNS: ["translation"],
  fallbackLng: ["dev"],
  fallbackNS: false,
  supportedLngs: false,
  nonExplicitSupportedLngs: false,
  load: "all",
  preload: false,
  simplifyPluralSuffix: true,
  keySeparator: ".",
  nsSeparator: ":",
  pluralSeparator: "_",
  contextSeparator: "_",
  partialBundledLanguages: false,
  saveMissing: false,
  updateMissing: false,
  saveMissingTo: "fallback",
  saveMissingPlurals: true,
  missingKeyHandler: false,
  missingInterpolationHandler: false,
  postProcess: false,
  postProcessPassResolved: false,
  returnNull: false,
  returnEmptyString: true,
  returnObjects: false,
  joinArrays: false,
  returnedObjectHandler: false,
  parseMissingKeyHandler: false,
  appendNamespaceToMissingKey: false,
  appendNamespaceToCIMode: false,
  overloadTranslationOptionHandler: (args) => {
    let ret = {};
    if (typeof args[1] === "object") ret = args[1];
    if (isString2(args[1])) ret.defaultValue = args[1];
    if (isString2(args[2])) ret.tDescription = args[2];
    if (typeof args[2] === "object" || typeof args[3] === "object") {
      const options = args[3] || args[2];
      Object.keys(options).forEach((key) => {
        ret[key] = options[key];
      });
    }
    return ret;
  },
  interpolation: {
    escapeValue: true,
    format: (value) => value,
    prefix: "{{",
    suffix: "}}",
    formatSeparator: ",",
    unescapePrefix: "-",
    nestingPrefix: "$t(",
    nestingSuffix: ")",
    nestingOptionsSeparator: ",",
    maxReplaces: 1e3,
    skipOnVariables: true
  }
});
var transformOptions = (options) => {
  if (isString2(options.ns)) options.ns = [options.ns];
  if (isString2(options.fallbackLng)) options.fallbackLng = [options.fallbackLng];
  if (isString2(options.fallbackNS)) options.fallbackNS = [options.fallbackNS];
  if (options.supportedLngs?.indexOf?.("cimode") < 0) {
    options.supportedLngs = options.supportedLngs.concat(["cimode"]);
  }
  if (typeof options.initImmediate === "boolean") options.initAsync = options.initImmediate;
  return options;
};
var noop = () => {
};
var bindMemberFunctions = (inst) => {
  const mems = Object.getOwnPropertyNames(Object.getPrototypeOf(inst));
  mems.forEach((mem) => {
    if (typeof inst[mem] === "function") {
      inst[mem] = inst[mem].bind(inst);
    }
  });
};
var I18n = class _I18n extends EventEmitter {
  constructor() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    let callback = arguments.length > 1 ? arguments[1] : void 0;
    super();
    this.options = transformOptions(options);
    this.services = {};
    this.logger = baseLogger;
    this.modules = {
      external: []
    };
    bindMemberFunctions(this);
    if (callback && !this.isInitialized && !options.isClone) {
      if (!this.options.initAsync) {
        this.init(options, callback);
        return this;
      }
      setTimeout(() => {
        this.init(options, callback);
      }, 0);
    }
  }
  init() {
    var _this = this;
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    let callback = arguments.length > 1 ? arguments[1] : void 0;
    this.isInitializing = true;
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    if (options.defaultNS == null && options.ns) {
      if (isString2(options.ns)) {
        options.defaultNS = options.ns;
      } else if (options.ns.indexOf("translation") < 0) {
        options.defaultNS = options.ns[0];
      }
    }
    const defOpts = get();
    this.options = {
      ...defOpts,
      ...this.options,
      ...transformOptions(options)
    };
    this.options.interpolation = {
      ...defOpts.interpolation,
      ...this.options.interpolation
    };
    if (options.keySeparator !== void 0) {
      this.options.userDefinedKeySeparator = options.keySeparator;
    }
    if (options.nsSeparator !== void 0) {
      this.options.userDefinedNsSeparator = options.nsSeparator;
    }
    const createClassOnDemand = (ClassOrObject) => {
      if (!ClassOrObject) return null;
      if (typeof ClassOrObject === "function") return new ClassOrObject();
      return ClassOrObject;
    };
    if (!this.options.isClone) {
      if (this.modules.logger) {
        baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
      } else {
        baseLogger.init(null, this.options);
      }
      let formatter;
      if (this.modules.formatter) {
        formatter = this.modules.formatter;
      } else {
        formatter = Formatter;
      }
      const lu = new LanguageUtil(this.options);
      this.store = new ResourceStore(this.options.resources, this.options);
      const s = this.services;
      s.logger = baseLogger;
      s.resourceStore = this.store;
      s.languageUtils = lu;
      s.pluralResolver = new PluralResolver(lu, {
        prepend: this.options.pluralSeparator,
        simplifyPluralSuffix: this.options.simplifyPluralSuffix
      });
      if (formatter && (!this.options.interpolation.format || this.options.interpolation.format === defOpts.interpolation.format)) {
        s.formatter = createClassOnDemand(formatter);
        s.formatter.init(s, this.options);
        this.options.interpolation.format = s.formatter.format.bind(s.formatter);
      }
      s.interpolator = new Interpolator(this.options);
      s.utils = {
        hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
      };
      s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
      s.backendConnector.on("*", function(event) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        _this.emit(event, ...args);
      });
      if (this.modules.languageDetector) {
        s.languageDetector = createClassOnDemand(this.modules.languageDetector);
        if (s.languageDetector.init) s.languageDetector.init(s, this.options.detection, this.options);
      }
      if (this.modules.i18nFormat) {
        s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
        if (s.i18nFormat.init) s.i18nFormat.init(this);
      }
      this.translator = new Translator(this.services, this.options);
      this.translator.on("*", function(event) {
        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }
        _this.emit(event, ...args);
      });
      this.modules.external.forEach((m) => {
        if (m.init) m.init(this);
      });
    }
    this.format = this.options.interpolation.format;
    if (!callback) callback = noop;
    if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
      const codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
      if (codes.length > 0 && codes[0] !== "dev") this.options.lng = codes[0];
    }
    if (!this.services.languageDetector && !this.options.lng) {
      this.logger.warn("init: no languageDetector is used and no lng is defined");
    }
    const storeApi = ["getResource", "hasResourceBundle", "getResourceBundle", "getDataByLanguage"];
    storeApi.forEach((fcName) => {
      this[fcName] = function() {
        return _this.store[fcName](...arguments);
      };
    });
    const storeApiChained = ["addResource", "addResources", "addResourceBundle", "removeResourceBundle"];
    storeApiChained.forEach((fcName) => {
      this[fcName] = function() {
        _this.store[fcName](...arguments);
        return _this;
      };
    });
    const deferred = defer();
    const load = () => {
      const finish = (err, t3) => {
        this.isInitializing = false;
        if (this.isInitialized && !this.initializedStoreOnce) this.logger.warn("init: i18next is already initialized. You should call init just once!");
        this.isInitialized = true;
        if (!this.options.isClone) this.logger.log("initialized", this.options);
        this.emit("initialized", this.options);
        deferred.resolve(t3);
        callback(err, t3);
      };
      if (this.languages && !this.isInitialized) return finish(null, this.t.bind(this));
      this.changeLanguage(this.options.lng, finish);
    };
    if (this.options.resources || !this.options.initAsync) {
      load();
    } else {
      setTimeout(load, 0);
    }
    return deferred;
  }
  loadResources(language) {
    let callback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : noop;
    let usedCallback = callback;
    const usedLng = isString2(language) ? language : this.language;
    if (typeof language === "function") usedCallback = language;
    if (!this.options.resources || this.options.partialBundledLanguages) {
      if (usedLng?.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0)) return usedCallback();
      const toLoad = [];
      const append = (lng) => {
        if (!lng) return;
        if (lng === "cimode") return;
        const lngs = this.services.languageUtils.toResolveHierarchy(lng);
        lngs.forEach((l) => {
          if (l === "cimode") return;
          if (toLoad.indexOf(l) < 0) toLoad.push(l);
        });
      };
      if (!usedLng) {
        const fallbacks = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
        fallbacks.forEach((l) => append(l));
      } else {
        append(usedLng);
      }
      this.options.preload?.forEach?.((l) => append(l));
      this.services.backendConnector.load(toLoad, this.options.ns, (e) => {
        if (!e && !this.resolvedLanguage && this.language) this.setResolvedLanguage(this.language);
        usedCallback(e);
      });
    } else {
      usedCallback(null);
    }
  }
  reloadResources(lngs, ns, callback) {
    const deferred = defer();
    if (typeof lngs === "function") {
      callback = lngs;
      lngs = void 0;
    }
    if (typeof ns === "function") {
      callback = ns;
      ns = void 0;
    }
    if (!lngs) lngs = this.languages;
    if (!ns) ns = this.options.ns;
    if (!callback) callback = noop;
    this.services.backendConnector.reload(lngs, ns, (err) => {
      deferred.resolve();
      callback(err);
    });
    return deferred;
  }
  use(module) {
    if (!module) throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
    if (!module.type) throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
    if (module.type === "backend") {
      this.modules.backend = module;
    }
    if (module.type === "logger" || module.log && module.warn && module.error) {
      this.modules.logger = module;
    }
    if (module.type === "languageDetector") {
      this.modules.languageDetector = module;
    }
    if (module.type === "i18nFormat") {
      this.modules.i18nFormat = module;
    }
    if (module.type === "postProcessor") {
      postProcessor.addPostProcessor(module);
    }
    if (module.type === "formatter") {
      this.modules.formatter = module;
    }
    if (module.type === "3rdParty") {
      this.modules.external.push(module);
    }
    return this;
  }
  setResolvedLanguage(l) {
    if (!l || !this.languages) return;
    if (["cimode", "dev"].indexOf(l) > -1) return;
    for (let li = 0; li < this.languages.length; li++) {
      const lngInLngs = this.languages[li];
      if (["cimode", "dev"].indexOf(lngInLngs) > -1) continue;
      if (this.store.hasLanguageSomeTranslations(lngInLngs)) {
        this.resolvedLanguage = lngInLngs;
        break;
      }
    }
  }
  changeLanguage(lng, callback) {
    var _this2 = this;
    this.isLanguageChangingTo = lng;
    const deferred = defer();
    this.emit("languageChanging", lng);
    const setLngProps = (l) => {
      this.language = l;
      this.languages = this.services.languageUtils.toResolveHierarchy(l);
      this.resolvedLanguage = void 0;
      this.setResolvedLanguage(l);
    };
    const done = (err, l) => {
      if (l) {
        setLngProps(l);
        this.translator.changeLanguage(l);
        this.isLanguageChangingTo = void 0;
        this.emit("languageChanged", l);
        this.logger.log("languageChanged", l);
      } else {
        this.isLanguageChangingTo = void 0;
      }
      deferred.resolve(function() {
        return _this2.t(...arguments);
      });
      if (callback) callback(err, function() {
        return _this2.t(...arguments);
      });
    };
    const setLng = (lngs) => {
      if (!lng && !lngs && this.services.languageDetector) lngs = [];
      const l = isString2(lngs) ? lngs : this.services.languageUtils.getBestMatchFromCodes(lngs);
      if (l) {
        if (!this.language) {
          setLngProps(l);
        }
        if (!this.translator.language) this.translator.changeLanguage(l);
        this.services.languageDetector?.cacheUserLanguage?.(l);
      }
      this.loadResources(l, (err) => {
        done(err, l);
      });
    };
    if (!lng && this.services.languageDetector && !this.services.languageDetector.async) {
      setLng(this.services.languageDetector.detect());
    } else if (!lng && this.services.languageDetector && this.services.languageDetector.async) {
      if (this.services.languageDetector.detect.length === 0) {
        this.services.languageDetector.detect().then(setLng);
      } else {
        this.services.languageDetector.detect(setLng);
      }
    } else {
      setLng(lng);
    }
    return deferred;
  }
  getFixedT(lng, ns, keyPrefix) {
    var _this3 = this;
    const fixedT = function(key, opts) {
      let options;
      if (typeof opts !== "object") {
        for (var _len3 = arguments.length, rest = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
          rest[_key3 - 2] = arguments[_key3];
        }
        options = _this3.options.overloadTranslationOptionHandler([key, opts].concat(rest));
      } else {
        options = {
          ...opts
        };
      }
      options.lng = options.lng || fixedT.lng;
      options.lngs = options.lngs || fixedT.lngs;
      options.ns = options.ns || fixedT.ns;
      if (options.keyPrefix !== "") options.keyPrefix = options.keyPrefix || keyPrefix || fixedT.keyPrefix;
      const keySeparator = _this3.options.keySeparator || ".";
      let resultKey;
      if (options.keyPrefix && Array.isArray(key)) {
        resultKey = key.map((k) => `${options.keyPrefix}${keySeparator}${k}`);
      } else {
        resultKey = options.keyPrefix ? `${options.keyPrefix}${keySeparator}${key}` : key;
      }
      return _this3.t(resultKey, options);
    };
    if (isString2(lng)) {
      fixedT.lng = lng;
    } else {
      fixedT.lngs = lng;
    }
    fixedT.ns = ns;
    fixedT.keyPrefix = keyPrefix;
    return fixedT;
  }
  t() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return this.translator?.translate(...args);
  }
  exists() {
    for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }
    return this.translator?.exists(...args);
  }
  setDefaultNamespace(ns) {
    this.options.defaultNS = ns;
  }
  hasLoadedNamespace(ns) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (!this.isInitialized) {
      this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages);
      return false;
    }
    if (!this.languages || !this.languages.length) {
      this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages);
      return false;
    }
    const lng = options.lng || this.resolvedLanguage || this.languages[0];
    const fallbackLng = this.options ? this.options.fallbackLng : false;
    const lastLng = this.languages[this.languages.length - 1];
    if (lng.toLowerCase() === "cimode") return true;
    const loadNotPending = (l, n) => {
      const loadState = this.services.backendConnector.state[`${l}|${n}`];
      return loadState === -1 || loadState === 0 || loadState === 2;
    };
    if (options.precheck) {
      const preResult = options.precheck(this, loadNotPending);
      if (preResult !== void 0) return preResult;
    }
    if (this.hasResourceBundle(lng, ns)) return true;
    if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages) return true;
    if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns))) return true;
    return false;
  }
  loadNamespaces(ns, callback) {
    const deferred = defer();
    if (!this.options.ns) {
      if (callback) callback();
      return Promise.resolve();
    }
    if (isString2(ns)) ns = [ns];
    ns.forEach((n) => {
      if (this.options.ns.indexOf(n) < 0) this.options.ns.push(n);
    });
    this.loadResources((err) => {
      deferred.resolve();
      if (callback) callback(err);
    });
    return deferred;
  }
  loadLanguages(lngs, callback) {
    const deferred = defer();
    if (isString2(lngs)) lngs = [lngs];
    const preloaded = this.options.preload || [];
    const newLngs = lngs.filter((lng) => preloaded.indexOf(lng) < 0 && this.services.languageUtils.isSupportedCode(lng));
    if (!newLngs.length) {
      if (callback) callback();
      return Promise.resolve();
    }
    this.options.preload = preloaded.concat(newLngs);
    this.loadResources((err) => {
      deferred.resolve();
      if (callback) callback(err);
    });
    return deferred;
  }
  dir(lng) {
    if (!lng) lng = this.resolvedLanguage || (this.languages?.length > 0 ? this.languages[0] : this.language);
    if (!lng) return "rtl";
    const rtlLngs = ["ar", "shu", "sqr", "ssh", "xaa", "yhd", "yud", "aao", "abh", "abv", "acm", "acq", "acw", "acx", "acy", "adf", "ads", "aeb", "aec", "afb", "ajp", "apc", "apd", "arb", "arq", "ars", "ary", "arz", "auz", "avl", "ayh", "ayl", "ayn", "ayp", "bbz", "pga", "he", "iw", "ps", "pbt", "pbu", "pst", "prp", "prd", "ug", "ur", "ydd", "yds", "yih", "ji", "yi", "hbo", "men", "xmn", "fa", "jpr", "peo", "pes", "prs", "dv", "sam", "ckb"];
    const languageUtils = this.services?.languageUtils || new LanguageUtil(get());
    return rtlLngs.indexOf(languageUtils.getLanguagePartFromCode(lng)) > -1 || lng.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr";
  }
  static createInstance() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    let callback = arguments.length > 1 ? arguments[1] : void 0;
    return new _I18n(options, callback);
  }
  cloneInstance() {
    let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    let callback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : noop;
    const forkResourceStore = options.forkResourceStore;
    if (forkResourceStore) delete options.forkResourceStore;
    const mergedOptions = {
      ...this.options,
      ...options,
      ...{
        isClone: true
      }
    };
    const clone = new _I18n(mergedOptions);
    if (options.debug !== void 0 || options.prefix !== void 0) {
      clone.logger = clone.logger.clone(options);
    }
    const membersToCopy = ["store", "services", "language"];
    membersToCopy.forEach((m) => {
      clone[m] = this[m];
    });
    clone.services = {
      ...this.services
    };
    clone.services.utils = {
      hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
    };
    if (forkResourceStore) {
      const clonedData = Object.keys(this.store.data).reduce((prev, l) => {
        prev[l] = {
          ...this.store.data[l]
        };
        return Object.keys(prev[l]).reduce((acc, n) => {
          acc[n] = {
            ...prev[l][n]
          };
          return acc;
        }, {});
      }, {});
      clone.store = new ResourceStore(clonedData, mergedOptions);
      clone.services.resourceStore = clone.store;
    }
    clone.translator = new Translator(clone.services, mergedOptions);
    clone.translator.on("*", function(event) {
      for (var _len6 = arguments.length, args = new Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
        args[_key6 - 1] = arguments[_key6];
      }
      clone.emit(event, ...args);
    });
    clone.init(mergedOptions, callback);
    clone.translator.options = mergedOptions;
    clone.translator.backendConnector.services.utils = {
      hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
    };
    return clone;
  }
  toJSON() {
    return {
      options: this.options,
      store: this.store,
      language: this.language,
      languages: this.languages,
      resolvedLanguage: this.resolvedLanguage
    };
  }
};
var instance = I18n.createInstance();
instance.createInstance = I18n.createInstance;
var createInstance = instance.createInstance;
var dir = instance.dir;
var init = instance.init;
var loadResources = instance.loadResources;
var reloadResources = instance.reloadResources;
var use = instance.use;
var changeLanguage = instance.changeLanguage;
var getFixedT = instance.getFixedT;
var t2 = instance.t;
var exists = instance.exists;
var setDefaultNamespace = instance.setDefaultNamespace;
var hasLoadedNamespace2 = instance.hasLoadedNamespace;
var loadNamespaces2 = instance.loadNamespaces;
var loadLanguages2 = instance.loadLanguages;

// node_modules/i18next-browser-languagedetector/dist/esm/i18nextBrowserLanguageDetector.js
var {
  slice,
  forEach
} = [];
function defaults(obj) {
  forEach.call(slice.call(arguments, 1), (source) => {
    if (source) {
      for (const prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
  });
  return obj;
}
function isSafeLanguageCode(code) {
  return typeof code === "string" && /^[A-Za-z0-9_@.-]{1,128}$/.test(code) && code.indexOf("..") < 0 && ["__proto__", "constructor", "prototype"].indexOf(code) < 0;
}
var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
var serializeCookie = (name, val, options = {
  path: "/"
}) => {
  const opt = options;
  const value = encodeURIComponent(val);
  let str = `${name}=${value}`;
  if (opt.maxAge > 0) {
    const maxAge = opt.maxAge - 0;
    if (Number.isNaN(maxAge)) throw new Error("maxAge should be a Number");
    str += `; Max-Age=${Math.floor(maxAge)}`;
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }
    str += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }
    str += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== "function") {
      throw new TypeError("option expires is invalid");
    }
    str += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) str += "; HttpOnly";
  if (opt.secure) str += "; Secure";
  if (opt.sameSite) {
    const sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true:
        str += "; SameSite=Strict";
        break;
      case "lax":
        str += "; SameSite=Lax";
        break;
      case "strict":
        str += "; SameSite=Strict";
        break;
      case "none":
        str += "; SameSite=None";
        break;
      default:
        throw new TypeError("option sameSite is invalid");
    }
  }
  if (opt.partitioned) str += "; Partitioned";
  return str;
};
var cookie = {
  create(name, value, minutes, domain, cookieOptions = {
    path: "/",
    sameSite: "strict"
  }) {
    if (minutes) {
      cookieOptions.expires = /* @__PURE__ */ new Date();
      cookieOptions.expires.setTime(cookieOptions.expires.getTime() + minutes * 60 * 1e3);
    }
    if (domain) cookieOptions.domain = domain;
    document.cookie = serializeCookie(name, value, cookieOptions);
  },
  read(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },
  remove(name, domain) {
    this.create(name, "", -1, domain);
  }
};
var cookie$1 = {
  name: "cookie",
  // Deconstruct the options object and extract the lookupCookie property
  lookup({
    lookupCookie
  }) {
    if (lookupCookie && typeof document !== "undefined") {
      return cookie.read(lookupCookie) || void 0;
    }
    return void 0;
  },
  // Deconstruct the options object and extract the lookupCookie, cookieMinutes, cookieDomain, and cookieOptions properties
  cacheUserLanguage(lng, {
    lookupCookie,
    cookieMinutes,
    cookieDomain,
    cookieOptions
  }) {
    if (lookupCookie && typeof document !== "undefined") {
      cookie.create(lookupCookie, lng, cookieMinutes, cookieDomain, cookieOptions);
    }
  }
};
var querystring = {
  name: "querystring",
  // Deconstruct the options object and extract the lookupQuerystring property
  lookup({
    lookupQuerystring
  }) {
    let found;
    if (typeof window !== "undefined") {
      let {
        search
      } = window.location;
      if (!window.location.search && window.location.hash?.indexOf("?") > -1) {
        search = window.location.hash.substring(window.location.hash.indexOf("?"));
      }
      const query = search.substring(1);
      const params = query.split("&");
      for (let i = 0; i < params.length; i++) {
        const pos = params[i].indexOf("=");
        if (pos > 0) {
          const key = params[i].substring(0, pos);
          if (key === lookupQuerystring) {
            found = params[i].substring(pos + 1);
          }
        }
      }
    }
    return found;
  }
};
var hash = {
  name: "hash",
  // Deconstruct the options object and extract the lookupHash property and the lookupFromHashIndex property
  lookup({
    lookupHash,
    lookupFromHashIndex
  }) {
    let found;
    if (typeof window !== "undefined") {
      const {
        hash: hash2
      } = window.location;
      if (hash2 && hash2.length > 2) {
        const query = hash2.substring(1);
        if (lookupHash) {
          const params = query.split("&");
          for (let i = 0; i < params.length; i++) {
            const pos = params[i].indexOf("=");
            if (pos > 0) {
              const key = params[i].substring(0, pos);
              if (key === lookupHash) {
                found = params[i].substring(pos + 1);
              }
            }
          }
        }
        if (found) return found;
        if (!found && lookupFromHashIndex > -1) {
          const language = hash2.match(/\/([a-zA-Z][a-zA-Z0-9-]*)?/g);
          if (!Array.isArray(language)) return void 0;
          const index = typeof lookupFromHashIndex === "number" ? lookupFromHashIndex : 0;
          return language[index]?.replace("/", "");
        }
      }
    }
    return found;
  }
};
var hasLocalStorageSupport = null;
var localStorageAvailable = () => {
  if (hasLocalStorageSupport !== null) return hasLocalStorageSupport;
  try {
    hasLocalStorageSupport = typeof window !== "undefined" && window.localStorage !== null;
    if (!hasLocalStorageSupport) {
      return false;
    }
    const testKey = "i18next.translate.boo";
    window.localStorage.setItem(testKey, "foo");
    window.localStorage.removeItem(testKey);
  } catch (e) {
    hasLocalStorageSupport = false;
  }
  return hasLocalStorageSupport;
};
var localStorage2 = {
  name: "localStorage",
  // Deconstruct the options object and extract the lookupLocalStorage property
  lookup({
    lookupLocalStorage
  }) {
    if (lookupLocalStorage && localStorageAvailable()) {
      return window.localStorage.getItem(lookupLocalStorage) || void 0;
    }
    return void 0;
  },
  // Deconstruct the options object and extract the lookupLocalStorage property
  cacheUserLanguage(lng, {
    lookupLocalStorage
  }) {
    if (lookupLocalStorage && localStorageAvailable()) {
      window.localStorage.setItem(lookupLocalStorage, lng);
    }
  }
};
var hasSessionStorageSupport = null;
var sessionStorageAvailable = () => {
  if (hasSessionStorageSupport !== null) return hasSessionStorageSupport;
  try {
    hasSessionStorageSupport = typeof window !== "undefined" && window.sessionStorage !== null;
    if (!hasSessionStorageSupport) {
      return false;
    }
    const testKey = "i18next.translate.boo";
    window.sessionStorage.setItem(testKey, "foo");
    window.sessionStorage.removeItem(testKey);
  } catch (e) {
    hasSessionStorageSupport = false;
  }
  return hasSessionStorageSupport;
};
var sessionStorage = {
  name: "sessionStorage",
  lookup({
    lookupSessionStorage
  }) {
    if (lookupSessionStorage && sessionStorageAvailable()) {
      return window.sessionStorage.getItem(lookupSessionStorage) || void 0;
    }
    return void 0;
  },
  cacheUserLanguage(lng, {
    lookupSessionStorage
  }) {
    if (lookupSessionStorage && sessionStorageAvailable()) {
      window.sessionStorage.setItem(lookupSessionStorage, lng);
    }
  }
};
var navigator$1 = {
  name: "navigator",
  lookup(options) {
    const found = [];
    if (typeof navigator !== "undefined") {
      const {
        languages,
        userLanguage,
        language
      } = navigator;
      if (languages) {
        for (let i = 0; i < languages.length; i++) {
          found.push(languages[i]);
        }
      }
      if (userLanguage) {
        found.push(userLanguage);
      }
      if (language) {
        found.push(language);
      }
    }
    return found.length > 0 ? found : void 0;
  }
};
var htmlTag = {
  name: "htmlTag",
  // Deconstruct the options object and extract the htmlTag property
  lookup({
    htmlTag: htmlTag2
  }) {
    let found;
    const internalHtmlTag = htmlTag2 || (typeof document !== "undefined" ? document.documentElement : null);
    if (internalHtmlTag && typeof internalHtmlTag.getAttribute === "function") {
      found = internalHtmlTag.getAttribute("lang");
    }
    return found;
  }
};
var path = {
  name: "path",
  // Deconstruct the options object and extract the lookupFromPathIndex property
  lookup({
    lookupFromPathIndex
  }) {
    if (typeof window === "undefined") return void 0;
    const language = window.location.pathname.match(/\/([a-zA-Z][a-zA-Z0-9-]*)?/g);
    if (!Array.isArray(language)) return void 0;
    const index = typeof lookupFromPathIndex === "number" ? lookupFromPathIndex : 0;
    return language[index]?.replace("/", "");
  }
};
var subdomain = {
  name: "subdomain",
  lookup({
    lookupFromSubdomainIndex
  }) {
    const index = typeof lookupFromSubdomainIndex === "number" ? lookupFromSubdomainIndex : 0;
    const hostname = typeof window !== "undefined" && window.location?.hostname?.split(".").slice(index).join(".");
    const language = hostname && hostname.match(/^(\w{2,5}(?:-(?:[a-z]{4}|[a-z]{2}|\d{3}))*)\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i);
    if (!language) return void 0;
    return language[1];
  }
};
var canCookies = false;
try {
  document.cookie;
  canCookies = true;
} catch (e) {
}
var order = ["querystring", "cookie", "localStorage", "sessionStorage", "navigator", "htmlTag"];
if (!canCookies) order.splice(1, 1);
var getDefaults2 = () => ({
  order,
  lookupQuerystring: "lng",
  lookupCookie: "i18next",
  lookupLocalStorage: "i18nextLng",
  lookupSessionStorage: "i18nextLng",
  // cache user language
  caches: ["localStorage"],
  excludeCacheFor: ["cimode"],
  // cookieMinutes: 10,
  // cookieDomain: 'myDomain'
  convertDetectedLanguage: (l) => l
});
var Browser = class {
  constructor(services, options = {}) {
    this.type = "languageDetector";
    this.detectors = {};
    this.init(services, options);
  }
  init(services = {
    languageUtils: {}
  }, options = {}, i18nOptions = {}) {
    this.services = services;
    this.options = defaults(options, this.options || {}, getDefaults2());
    if (typeof this.options.convertDetectedLanguage === "string" && this.options.convertDetectedLanguage.indexOf("15897") > -1) {
      this.options.convertDetectedLanguage = (l) => l.replace("-", "_");
    }
    if (this.options.lookupFromUrlIndex) this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex;
    this.i18nOptions = i18nOptions;
    this.addDetector(cookie$1);
    this.addDetector(querystring);
    this.addDetector(localStorage2);
    this.addDetector(sessionStorage);
    this.addDetector(navigator$1);
    this.addDetector(htmlTag);
    this.addDetector(path);
    this.addDetector(subdomain);
    this.addDetector(hash);
  }
  addDetector(detector) {
    this.detectors[detector.name] = detector;
    return this;
  }
  detect(detectionOrder = this.options.order) {
    let detected = [];
    detectionOrder.forEach((detectorName) => {
      if (this.detectors[detectorName]) {
        let lookup = this.detectors[detectorName].lookup(this.options);
        if (lookup && typeof lookup === "string") lookup = [lookup];
        if (lookup) detected = detected.concat(lookup);
      }
    });
    detected = detected.filter((d) => isSafeLanguageCode(d)).map((d) => this.options.convertDetectedLanguage(d));
    if (this.services && this.services.languageUtils && this.services.languageUtils.getBestMatchFromCodes) return detected;
    return detected.length > 0 ? detected[0] : null;
  }
  cacheUserLanguage(lng, caches = this.options.caches) {
    if (!caches) return;
    if (this.options.excludeCacheFor && this.options.excludeCacheFor.indexOf(lng) > -1) return;
    caches.forEach((cacheName) => {
      if (this.detectors[cacheName]) this.detectors[cacheName].cacheUserLanguage(lng, this.options);
    });
  }
};
Browser.type = "languageDetector";

// client/src/locales/el/common.json
var common_default = {
  ok: "OK",
  cancel: "\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7",
  save: "\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7",
  close: "\u039A\u03BB\u03B5\u03AF\u03C3\u03B9\u03BC\u03BF",
  loading: "\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7...",
  home: "\u0391\u03C1\u03C7\u03B9\u03BA\u03AE",
  teacher: "\u039A\u03B1\u03B8\u03B7\u03B3\u03B7\u03C4\u03AE\u03C2",
  admin: "\u0394\u03B9\u03B1\u03C7\u03B5\u03B9\u03C1\u03B9\u03C3\u03C4\u03AE\u03C2",
  student: "\u039C\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
  group: "\u039F\u03BC\u03AC\u03B4\u03B1",
  settings: "\u03A1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2",
  activityGeneralSettings: "\u0393\u03B5\u03BD\u03B9\u03BA\u03AD\u03C2 \u03C1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
  activityResourceSettings: "\u03A1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2 \u03C0\u03CC\u03C1\u03BF\u03C5",
  language: "\u0393\u03BB\u03CE\u03C3\u03C3\u03B1",
  greek: "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC",
  enableChat: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03C3\u03C5\u03BD\u03BF\u03BC\u03B9\u03BB\u03AF\u03B1\u03C2 \u03C3\u03C4\u03BF\u03C5\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2",
  enableFeedback: "\u0395\u03BD\u03B5\u03C1\u03B3\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7 \u03B1\u03BD\u03B1\u03C4\u03C1\u03BF\u03C6\u03BF\u03B4\u03CC\u03C4\u03B7\u03C3\u03B7\u03C2",
  showScoreToStudents: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03C3\u03BA\u03BF\u03C1 \u03C3\u03C4\u03BF\u03C5\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2",
  chat: "\u03A3\u03C5\u03BD\u03BF\u03BC\u03B9\u03BB\u03AF\u03B1",
  chatDisabled: "\u0397 \u03C3\u03C5\u03BD\u03BF\u03BC\u03B9\u03BB\u03AF\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B1\u03C0\u03B5\u03BD\u03B5\u03C1\u03B3\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7.",
  chatNeedsSession: "\u0397 \u03C3\u03C5\u03BD\u03BF\u03BC\u03B9\u03BB\u03AF\u03B1 \u03B8\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B4\u03B9\u03B1\u03B8\u03AD\u03C3\u03B9\u03BC\u03B7 \u03CC\u03C4\u03B1\u03BD \u03BE\u03B5\u03BA\u03B9\u03BD\u03AE\u03C3\u03B5\u03B9 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1.",
  chatMessage: "\u0393\u03C1\u03AC\u03C8\u03C4\u03B5 \u03BC\u03AE\u03BD\u03C5\u03BC\u03B1",
  chatSend: "\u0391\u03C0\u03BF\u03C3\u03C4\u03BF\u03BB\u03AE",
  english: "English",
  startSession: "\u0388\u03BD\u03B1\u03C1\u03BE\u03B7 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1\u03C2",
  clearActivityOnStart: "\u039A\u03B1\u03B8\u03B1\u03C1\u03B9\u03C3\u03BC\u03CC\u03C2 \u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1\u03C2 \u03BA\u03B1\u03C4\u03AC \u03C4\u03B7\u03BD \u03AD\u03BD\u03B1\u03C1\u03BE\u03B7 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1\u03C2",
  endSession: "\u039F\u03BB\u03BF\u03BA\u03BB\u03AE\u03C1\u03C9\u03C3\u03B7 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1\u03C2",
  input: "\u0395\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2",
  notAvailable: "\u0394\u03B5\u03BD \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B4\u03B9\u03B1\u03B8\u03AD\u03C3\u03B9\u03BC\u03BF",
  status: "\u039A\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7",
  username: "\u038C\u03BD\u03BF\u03BC\u03B1 \u03C7\u03C1\u03AE\u03C3\u03C4\u03B7",
  connected: "\u03A3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF\u03C2",
  disconnected: "\u0391\u03C0\u03BF\u03C3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF\u03C2",
  enterFullscreen: "\u039C\u03B5\u03C4\u03AC\u03B2\u03B1\u03C3\u03B7 \u03C3\u03B5 \u03C0\u03BB\u03AE\u03C1\u03B7 \u03BF\u03B8\u03CC\u03BD\u03B7",
  exitFullscreen: "\u0388\u03BE\u03BF\u03B4\u03BF\u03C2 \u03B1\u03C0\u03CC \u03C0\u03BB\u03AE\u03C1\u03B7 \u03BF\u03B8\u03CC\u03BD\u03B7"
};

// client/src/locales/el/menu.json
var menu_default = {
  home: "\u0391\u03C1\u03C7\u03B9\u03BA\u03AE",
  activities: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
  settings: "\u03A1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2",
  mainNavigation: "\u039A\u03CD\u03C1\u03B9\u03B1 \u03C0\u03BB\u03BF\u03AE\u03B3\u03B7\u03C3\u03B7",
  tools: "\u0395\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03B1",
  activityBuilder: "\u0394\u03B9\u03B1\u03C7\u03B5\u03AF\u03C1\u03B9\u03C3\u03B7 \u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD / Activity Settings",
  cameraSpeedTest: "\u0388\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 \u03C4\u03B1\u03C7\u03CD\u03C4\u03B7\u03C4\u03B1\u03C2 \u03BA\u03AC\u03BC\u03B5\u03C1\u03B1\u03C2",
  geoGebraCollab: "\u03A3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1 GeoGebra",
  geoGebraMonitor: "\u03A0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7 GeoGebra",
  console: "\u039A\u03BF\u03BD\u03C3\u03CC\u03BB\u03B1",
  linearSeparation: "\u0393\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03CC\u03C2 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03CC\u03C2",
  quickLabLinks: "\u0393\u03C1\u03AE\u03B3\u03BF\u03C1\u03B7 \u03C0\u03C1\u03CC\u03C3\u03B2\u03B1\u03C3\u03B7 \u03C3\u03C4\u03B1 \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03B1",
  teacherDashboard: "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD",
  teacherDescription: "\u0386\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1 \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03CE\u03BD \u03B4\u03B9\u03B4\u03B1\u03C3\u03BA\u03B1\u03BB\u03AF\u03B1\u03C2, \u03B4\u03B9\u03B1\u03C7\u03B5\u03AF\u03C1\u03B9\u03C3\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD \u03BA\u03B1\u03B9 \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03C4\u03AC\u03BE\u03B7\u03C2.",
  teacherFeatureApps: "\u0392\u03B9\u03B2\u03BB\u03B9\u03BF\u03B8\u03AE\u03BA\u03B7 \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03CE\u03BD",
  teacherFeatureActivities: "\u0394\u03B9\u03B1\u03C7\u03B5\u03AF\u03C1\u03B9\u03C3\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD",
  teacherFeatureClass: "\u03A0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7 \u03C4\u03AC\u03BE\u03B7\u03C2",
  studentLauncher: "\u0395\u03BA\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE",
  studentDescription: "\u0395\u03C0\u03AF\u03BB\u03B5\u03BE\u03B5 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 \u03BA\u03B1\u03B9 \u03AC\u03BD\u03BF\u03B9\u03BE\u03B5 \u03B1\u03C0\u03B5\u03C5\u03B8\u03B5\u03AF\u03B1\u03C2 \u03C4\u03B7\u03BD \u03C0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE.",
  studentFeatureApps: "\u0394\u03B9\u03B1\u03B8\u03AD\u03C3\u03B9\u03BC\u03B5\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
  studentFeatureRoutes: "\u03A7\u03CE\u03C1\u03BF\u03B9 \u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD",
  studentFeatureAccess: "\u0393\u03C1\u03AE\u03B3\u03BF\u03C1\u03B7 \u03C0\u03C1\u03CC\u03C3\u03B2\u03B1\u03C3\u03B7",
  toolsCard: "\u0395\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03B1 \u03BC\u03AC\u03B8\u03B7\u03C3\u03B7\u03C2",
  toolsDescription: "\u0386\u03BD\u03BF\u03B9\u03BE\u03B5 \u03B5\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03B1 \u03BC\u03AC\u03B8\u03B7\u03C3\u03B7\u03C2, \u03B4\u03B7\u03BC\u03B9\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD \u03BA\u03B1\u03B9 \u03C3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1\u03C2.",
  toolsFeatureBuilder: "\u0394\u03B9\u03B1\u03C7\u03B5\u03AF\u03C1\u03B9\u03C3\u03B7 \u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD / Activity Settings",
  toolsFeatureCamera: "\u0388\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 \u03C4\u03B1\u03C7\u03CD\u03C4\u03B7\u03C4\u03B1\u03C2 \u03BA\u03AC\u03BC\u03B5\u03C1\u03B1\u03C2",
  toolsFeatureGeoGebra: "\u03A3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1 GeoGebra",
  toolsFeatureSeparation: "\u0393\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03CC\u03C2 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03CC\u03C2"
};

// client/src/locales/el/geometry.json
var geometry_default = {
  title: "\u0393\u03B5\u03C9\u03BC\u03B5\u03C4\u03C1\u03AF\u03B1",
  addPoint: "\u03A0\u03C1\u03BF\u03C3\u03B8\u03AE\u03BA\u03B7 \u03C3\u03B7\u03BC\u03B5\u03AF\u03BF\u03C5",
  deletePoint: "\u0394\u03B9\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE \u03C3\u03B7\u03BC\u03B5\u03AF\u03BF\u03C5",
  rotate: "\u03A0\u03B5\u03C1\u03B9\u03C3\u03C4\u03C1\u03BF\u03C6\u03AE"
};

// client/src/locales/el/interface.json
var interface_default = {
  activityWorkspace: {
    settings: "\u03A1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    title: "\u03A4\u03AF\u03C4\u03BB\u03BF\u03C2",
    subtitle: "\u03A5\u03C0\u03CC\u03C4\u03B9\u03C4\u03BB\u03BF\u03C2",
    notes: "\u03A3\u03B7\u03BC\u03B5\u03B9\u03CE\u03C3\u03B5\u03B9\u03C2",
    widgets: "Widgets (JSON, \u03AD\u03C9\u03C2 2)",
    save: "\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    saved: "\u0397 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 \u03B1\u03C0\u03BF\u03B8\u03B7\u03BA\u03B5\u03CD\u03C4\u03B7\u03BA\u03B5.",
    saveError: "\u0397 \u03B1\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7 \u03B1\u03C0\u03AD\u03C4\u03C5\u03C7\u03B5.",
    json: "JSON \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2"
  },
  appsLauncher: "\u0395\u03BA\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7 \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03CE\u03BD",
  studentLauncher: "\u0395\u03BA\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE",
  studentWaitingTitle: "\u039A\u03B1\u03BB\u03CE\u03C2 \u03AE\u03C1\u03B8\u03B5\u03C2",
  studentWaitingMessage: "\u03A0\u03B5\u03C1\u03AF\u03BC\u03B5\u03BD\u03B5 \u03BD\u03B1 \u03B5\u03C0\u03B9\u03BB\u03AD\u03BE\u03B5\u03B9 \u03BF \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2 \u03BC\u03B9\u03B1 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1. \u0398\u03B1 \u03BC\u03B5\u03C4\u03B1\u03C6\u03B5\u03C1\u03B8\u03B5\u03AF\u03C2 \u03B1\u03C5\u03C4\u03CC\u03BC\u03B1\u03C4\u03B1 \u03C3\u03C4\u03BF \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF.",
  teacherDashboard: "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD",
  tools: {
    "activity-builder": {
      title: "\u0394\u03B9\u03B1\u03C7\u03B5\u03AF\u03C1\u03B9\u03C3\u03B7 \u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD / Activity Settings",
      description: "\u03A1\u03CD\u03B8\u03BC\u03B9\u03C3\u03B7 \u03BA\u03BF\u03B9\u03BD\u03CC\u03C7\u03C1\u03B7\u03C3\u03C4\u03C9\u03BD \u03C0\u03CC\u03C1\u03C9\u03BD \u03BA\u03B1\u03B9 \u03B1\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD \u03C9\u03C2 \u03B1\u03C1\u03C7\u03B5\u03AF\u03B1 JSON."
    },
    "camera-speed-test": {
      title: "\u0388\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 \u03A4\u03B1\u03C7\u03CD\u03C4\u03B7\u03C4\u03B1\u03C2 \u039A\u03AC\u03BC\u03B5\u03C1\u03B1\u03C2",
      description: "\u039C\u03AD\u03C4\u03C1\u03B7\u03C3\u03B7 \u03C7\u03C1\u03CC\u03BD\u03BF\u03C5 \u03BC\u03B5\u03C4\u03AC\u03B4\u03BF\u03C3\u03B7\u03C2 \u03BA\u03B1\u03C1\u03AD \u03C3\u03C4\u03B7\u03BD \u03B1\u03BB\u03C5\u03C3\u03AF\u03B4\u03B1 \u03B1\u03BD\u03AF\u03C7\u03BD\u03B5\u03C5\u03C3\u03B7\u03C2."
    },
    "linear-seperation": {
      title: "\u0395\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03BF \u0393\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03BF\u03CD \u0394\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03BF\u03CD",
      description: "\u0394\u03B9\u03B1\u03B4\u03C1\u03B1\u03C3\u03C4\u03B9\u03BA\u03CC \u03B5\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03BF \u03B3\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03BF\u03CD \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03BF\u03CD \u03BC\u03B5 \u03C3\u03CD\u03BD\u03BF\u03BB\u03B1 \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD."
    },
    "geogebra-collab": {
      title: "\u03A3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C4\u03B9\u03BA\u03CC GeoGebra",
      description: "\u039A\u03BF\u03B9\u03BD\u03CC\u03C7\u03C1\u03B7\u03C3\u03C4\u03BF\u03C2 \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 GeoGebra \u03BC\u03B5 \u03B4\u03B9\u03BA\u03B1\u03B9\u03CE\u03BC\u03B1\u03C4\u03B1 \u03B1\u03BD\u03AC \u03C1\u03CC\u03BB\u03BF."
    },
    "vision-collab": {
      title: "\u039A\u03AC\u03BC\u03B5\u03C1\u03B1",
      description: "\u0396\u03C9\u03BD\u03C4\u03B1\u03BD\u03AE \u03BA\u03AC\u03BC\u03B5\u03C1\u03B1 \u03BC\u03B5 \u03BA\u03BF\u03B9\u03BD\u03AD\u03C2 \u03B5\u03C0\u03B9\u03BA\u03B1\u03BB\u03CD\u03C8\u03B5\u03B9\u03C2 \u03B9\u03C7\u03BD\u03B7\u03BB\u03AC\u03C4\u03B7\u03C3\u03B7\u03C2 \u03B3\u03B9\u03B1 \u03C4\u03B7\u03BD \u03C4\u03AC\u03BE\u03B7."
    },
    "workshop-json-validator": {
      title: "\u0388\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 JSON Workshop",
      description: "\u0388\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 \u03B1\u03C1\u03C7\u03B5\u03AF\u03C9\u03BD workshop JSON \u03BC\u03B5 \u03B2\u03AC\u03C3\u03B7 \u03C4\u03B7\u03BD \u03BA\u03BF\u03B9\u03BD\u03AE \u03B3\u03BB\u03CE\u03C3\u03C3\u03B1 \u03B1\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7\u03C2."
    },
    console: {
      title: "\u039A\u03BF\u03BD\u03C3\u03CC\u03BB\u03B1",
      description: "\u0396\u03C9\u03BD\u03C4\u03B1\u03BD\u03AE \u03C0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE \u03BC\u03B7\u03BD\u03C5\u03BC\u03AC\u03C4\u03C9\u03BD \u03BC\u03B5\u03C4\u03B1\u03BE\u03CD \u03C7\u03C1\u03B7\u03C3\u03C4\u03CE\u03BD \u03BA\u03B1\u03B9 \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE."
    }
  },
  strobeLogo: "\u039B\u03BF\u03B3\u03CC\u03C4\u03C5\u03C0\u03BF Strobe",
  loadingApps: "\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03CE\u03BD...",
  loadingTools: "\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03B5\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03C9\u03BD...",
  loadingLab: "\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03B7\u03C1\u03AF\u03BF\u03C5...",
  launcher: "\u0395\u03BA\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7",
  student: "\u039C\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
  teacher: "\u0395\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2",
  tool: "\u0395\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03BF",
  expression: "\u0388\u03BA\u03C6\u03C1\u03B1\u03C3\u03B7",
  expressions: "\u0395\u03BA\u03C6\u03C1\u03AC\u03C3\u03B5\u03B9\u03C2",
  expressionType: "\u039C\u03BF\u03BD\u03CE\u03BD\u03C5\u03BC\u03BF \u03AE \u03C0\u03BF\u03BB\u03C5\u03CE\u03BD\u03C5\u03BC\u03BF",
  operatorBetweenTerms: "\u03A0\u03C1\u03AC\u03BE\u03B7 \u03BC\u03B5\u03C4\u03B1\u03BE\u03CD \u03CC\u03C1\u03C9\u03BD \u03C0\u03BF\u03BB\u03C5\u03C9\u03BD\u03CD\u03BC\u03BF\u03C5",
  coefficient: "\u03A3\u03C5\u03BD\u03C4\u03B5\u03BB\u03B5\u03C3\u03C4\u03AE\u03C2",
  answer: "\u0391\u03C0\u03AC\u03BD\u03C4\u03B7\u03C3\u03B7",
  wrongPlacement: "\u03A5\u03C0\u03AC\u03C1\u03C7\u03B5\u03B9 \u03BB\u03AC\u03B8\u03BF\u03C2 \u03C4\u03BF\u03C0\u03BF\u03B8\u03AD\u03C4\u03B7\u03C3\u03B7. \u0391\u03C6\u03B1\u03AF\u03C1\u03B5\u03C3\u03B5 \u03C0\u03C1\u03CE\u03C4\u03B1 \u03C4\u03BF\u03BD \u03BA\u03CC\u03BA\u03BA\u03B9\u03BD\u03BF \u03CC\u03C1\u03BF.",
  automaticResult: "\u0391\u03C5\u03C4\u03CC\u03BC\u03B1\u03C4\u03BF \u03B1\u03C0\u03BF\u03C4\u03AD\u03BB\u03B5\u03C3\u03BC\u03B1",
  activities: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1",
  chooseActivity: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
  noAvailableActivities: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B4\u03B9\u03B1\u03B8\u03AD\u03C3\u03B9\u03BC\u03B5\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
  feedbackToggle: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 feedback \u03B3\u03B9\u03B1 \u03BB\u03AC\u03B8\u03BF\u03C2 \u03B1\u03C0\u03B1\u03BD\u03C4\u03AE\u03C3\u03B5\u03B9\u03C2",
  studentTable: "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD",
  groupsTable: "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03BF\u03BC\u03AC\u03B4\u03C9\u03BD",
  score: "\u03A3\u03BA\u03BF\u03C1",
  noStudents: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2 \u03B3\u03B9\u03B1 \u03B1\u03C5\u03C4\u03CC \u03C4\u03BF \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF.",
  openStudentView: "\u0386\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1 \u03C0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE",
  openTeacherView: "\u0386\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1 \u03C0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE\u03C2 \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD",
  openTool: "\u0386\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1 \u03B5\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03BF\u03C5",
  available: "\u0394\u03B9\u03B1\u03B8\u03AD\u03C3\u03B9\u03BC\u03BF",
  unavailable: "\u039C\u03B7 \u03B4\u03B9\u03B1\u03B8\u03AD\u03C3\u03B9\u03BC\u03BF",
  readyToOpen: "\u0388\u03C4\u03BF\u03B9\u03BC\u03BF \u03B3\u03B9\u03B1 \u03AC\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1",
  enableFeature: "\u0391\u03C0\u03B1\u03B9\u03C4\u03B5\u03AF\u03C4\u03B1\u03B9 \u03C0\u03C1\u03CE\u03C4\u03B1 \u03BC\u03B5\u03C4\u03B1\u03B3\u03BB\u03CE\u03C4\u03C4\u03B9\u03C3\u03B7 \u03AE \u03B5\u03BD\u03B5\u03C1\u03B3\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03BB\u03B5\u03B9\u03C4\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1\u03C2",
  studentAccessible: "\u03A0\u03C1\u03BF\u03C3\u03B2\u03AC\u03C3\u03B9\u03BC\u03BF \u03B1\u03C0\u03CC \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2",
  teacherAccessible: "\u03A0\u03C1\u03BF\u03C3\u03B2\u03AC\u03C3\u03B9\u03BC\u03BF \u03B1\u03C0\u03CC \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD\u03C2",
  toolsLead: "\u0395\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03B1 \u03B3\u03B9\u03B1 \u03BC\u03AC\u03B8\u03B7\u03BC\u03B1 \u03BA\u03B1\u03B9 \u03B4\u03BF\u03BA\u03B9\u03BC\u03AD\u03C2, \u03BC\u03B5 \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03B1 \u03B1\u03C0\u03CC \u03C4\u03BF API endpoint /api/tools.",
  reactPage: "\u03A3\u03B5\u03BB\u03AF\u03B4\u03B1 React",
  spaNavigation: "\u03A0\u03BB\u03BF\u03AE\u03B3\u03B7\u03C3\u03B7 SPA",
  studentLead: "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AE \u03BA\u03B1\u03B9 \u03BC\u03B5\u03C4\u03B1\u03B2\u03B5\u03AF\u03C4\u03B5 \u03C3\u03C4\u03B7\u03BD \u03B1\u03BD\u03C4\u03AF\u03C3\u03C4\u03BF\u03B9\u03C7\u03B7 \u03C0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE.",
  teacherLead: "\u0395\u03BA\u03BA\u03B9\u03BD\u03AE\u03C3\u03C4\u03B5 \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03AD\u03C2 \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AD\u03C2, \u03B4\u03B9\u03B1\u03C7\u03B5\u03B9\u03C1\u03B9\u03C3\u03C4\u03B5\u03AF\u03C4\u03B5 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03BA\u03B1\u03B9 \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03C5\u03B8\u03AE\u03C3\u03C4\u03B5 \u03C4\u03B7\u03BD \u03C4\u03AC\u03BE\u03B7.",
  identitiesTitle: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03C4\u03B1\u03C5\u03C4\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD",
  identitiesDescription: "\u0391\u03BB\u03B3\u03B5\u03B2\u03C1\u03B9\u03BA\u03AE \u03BA\u03B1\u03B9 \u03B3\u03B5\u03C9\u03BC\u03B5\u03C4\u03C1\u03B9\u03BA\u03AE \u03BA\u03B1\u03C4\u03B1\u03BD\u03CC\u03B7\u03C3\u03B7 \u03B2\u03B1\u03C3\u03B9\u03BA\u03CE\u03BD \u03B1\u03BB\u03B3\u03B5\u03B2\u03C1\u03B9\u03BA\u03CE\u03BD \u03C4\u03B1\u03C5\u03C4\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD.",
  geoGebraCollaborativeTitle: "\u03A3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C4\u03B9\u03BA\u03CC \u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03BF GeoGebra",
  geoGebraCollaborativeDescription: "\u039A\u03BF\u03B9\u03BD\u03CC\u03C2 \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 GeoGebra \u03B3\u03B9\u03B1 \u03C3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD \u03BC\u03B5 \u03B4\u03B9\u03BA\u03B1\u03B9\u03CE\u03BC\u03B1\u03C4\u03B1 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE.",
  failedApps: "\u0397 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03C4\u03C9\u03BD \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03CE\u03BD \u03B1\u03C0\u03AD\u03C4\u03C5\u03C7\u03B5.",
  failedTools: "\u0397 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03C4\u03C9\u03BD \u03B5\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03C9\u03BD \u03B1\u03C0\u03AD\u03C4\u03C5\u03C7\u03B5.",
  labNotFound: "\u03A4\u03BF \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03B4\u03B5\u03BD \u03B2\u03C1\u03AD\u03B8\u03B7\u03BA\u03B5.",
  mainNavigation: "\u039A\u03CD\u03C1\u03B9\u03B1 \u03C0\u03BB\u03BF\u03AE\u03B3\u03B7\u03C3\u03B7",
  roomId: "\u039A\u03C9\u03B4\u03B9\u03BA\u03CC\u03C2 \u03B1\u03AF\u03B8\u03BF\u03C5\u03C3\u03B1\u03C2",
  joinRoom: "\u03A3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 \u03C3\u03C4\u03B7\u03BD \u03B1\u03AF\u03B8\u03BF\u03C5\u03C3\u03B1",
  geoGebraCollaborative: "GeoGebra",
  algebraTilesCollaborative: "\u03A0\u03BB\u03B1\u03BA\u03AF\u03B4\u03B9\u03B1 \u0386\u03BB\u03B3\u03B5\u03B2\u03C1\u03B1\u03C2",
  numberLine: {
    title: "\u0391\u03C1\u03B9\u03B8\u03BC\u03BF\u03B3\u03C1\u03B1\u03BC\u03BC\u03AE",
    ariaLabel: "\u039A\u03BF\u03B9\u03BD\u03AE \u03B1\u03C1\u03B9\u03B8\u03BC\u03BF\u03B3\u03C1\u03B1\u03BC\u03BC\u03AE",
    leftEnd: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC \u03AC\u03BA\u03C1\u03BF",
    rightEnd: "\u0394\u03B5\u03BE\u03AF \u03AC\u03BA\u03C1\u03BF",
    partitions: "\u0394\u03B9\u03B1\u03BC\u03B5\u03C1\u03AF\u03C3\u03B5\u03B9\u03C2"
  },
  cartesianPlane: {
    title: "\u039A\u03B1\u03C1\u03C4\u03B5\u03C3\u03B9\u03B1\u03BD\u03CC \u03B5\u03C0\u03AF\u03C0\u03B5\u03B4\u03BF",
    ariaLabel: "\u0394\u03B9\u03B1\u03B4\u03C1\u03B1\u03C3\u03C4\u03B9\u03BA\u03CC \u03BA\u03B1\u03C1\u03C4\u03B5\u03C3\u03B9\u03B1\u03BD\u03CC \u03B5\u03C0\u03AF\u03C0\u03B5\u03B4\u03BF",
    minX: "\u0395\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03BF x",
    maxX: "\u039C\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF x",
    minY: "\u0395\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03BF y",
    maxY: "\u039C\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF y",
    maxPoints: "\u039C\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF\u03C2 \u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 \u03C3\u03B7\u03BC\u03B5\u03AF\u03C9\u03BD",
    targets: "\u03A3\u03B7\u03BC\u03B5\u03AF\u03B1 \u03C3\u03C4\u03CC\u03C7\u03BF\u03B9",
    targetsHelp: "\u0393\u03C1\u03AC\u03C8\u03B5 \u03B6\u03B5\u03CD\u03B3\u03B7 x,y \u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03AD\u03BD\u03B1 \u03BC\u03B5 \u03B5\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03CC \u03B5\u03C1\u03C9\u03C4\u03B7\u03BC\u03B1\u03C4\u03B9\u03BA\u03CC (;).",
    pointCount: "\u03A4\u03B1 \u03C3\u03B7\u03BC\u03B5\u03AF\u03B1 \u03C3\u03BF\u03C5: {{count}}",
    pointCountLimit: "\u03A4\u03B1 \u03C3\u03B7\u03BC\u03B5\u03AF\u03B1 \u03C3\u03BF\u03C5: {{count}} / {{max}}",
    meanDistance: "\u039C\u03AD\u03C3\u03B7 \u03B1\u03C0\u03CC\u03C3\u03C4\u03B1\u03C3\u03B7 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD \u03BA\u03BF\u03BD\u03C4\u03B9\u03BD\u03CC\u03C4\u03B5\u03C1\u03BF \u03C3\u03C4\u03CC\u03C7\u03BF: {{distance}}"
  },
  optionsGrid: {
    ariaLabel: "\u039A\u03BF\u03B9\u03BD\u03CC \u03C0\u03BB\u03AD\u03B3\u03BC\u03B1 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03CE\u03BD",
    apply: "\u0395\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AE \u03C1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03C9\u03BD"
  },
  vennCollab: {
    setCount: "\u0391\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 \u03C3\u03C5\u03BD\u03CC\u03BB\u03C9\u03BD",
    setName: "\u038C\u03BD\u03BF\u03BC\u03B1 \u03C3\u03C5\u03BD\u03CC\u03BB\u03BF\u03C5 {{number}}",
    relationBetween: "\u03A3\u03C7\u03AD\u03C3\u03B7 \u03BC\u03B5\u03C4\u03B1\u03BE\u03CD {{first}} \u03BA\u03B1\u03B9 {{second}}",
    elements: "\u03A3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1",
    relations: {
      disjoint: "\u0391\u03BD\u03B5\u03BE\u03AC\u03C1\u03C4\u03B7\u03C4\u03B1",
      intersecting: "\u03A4\u03B5\u03BC\u03BD\u03CC\u03BC\u03B5\u03BD\u03B1",
      subset: "\u03A5\u03C0\u03BF\u03C3\u03CD\u03BD\u03BF\u03BB\u03BF (\u03C4\u03BF \u03C0\u03C1\u03CE\u03C4\u03BF \u03C3\u03CD\u03BD\u03BF\u03BB\u03BF \u03BC\u03AD\u03C3\u03B1 \u03C3\u03C4\u03BF \u03B4\u03B5\u03CD\u03C4\u03B5\u03C1\u03BF)"
    }
  },
  placementBoard: {
    items: "\u0391\u03BD\u03C4\u03B9\u03BA\u03B5\u03AF\u03BC\u03B5\u03BD\u03B1 \u03C0\u03C1\u03BF\u03C2 \u03C4\u03BF\u03C0\u03BF\u03B8\u03AD\u03C4\u03B7\u03C3\u03B7",
    elements: "\u03A3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1",
    groups: "\u03A0\u03B5\u03C1\u03B9\u03BF\u03C7\u03AD\u03C2",
    groupsHelp: "\u0393\u03C1\u03AC\u03C8\u03B5 \u03C4\u03B1 \u03BF\u03BD\u03CC\u03BC\u03B1\u03C4\u03B1 \u03C4\u03C9\u03BD \u03C0\u03B5\u03C1\u03B9\u03BF\u03C7\u03CE\u03BD \u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03AD\u03BD\u03B1 \u03BC\u03B5 \u03BA\u03CC\u03BC\u03BC\u03B1."
  },
  inputGrid: {
    cells: "\u039A\u03B5\u03BB\u03B9\u03AC \u03B5\u03B9\u03C3\u03CC\u03B4\u03BF\u03C5",
    correctAnswer: "\u03A3\u03C9\u03C3\u03C4\u03AE \u03B1\u03C0\u03AC\u03BD\u03C4\u03B7\u03C3\u03B7",
    answerExact: "\u0391\u03BA\u03C1\u03B9\u03B2\u03AE\u03C2 \u03C4\u03B9\u03BC\u03AE (=)",
    answerMinimum: "\u0395\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03B7 \u03C4\u03B9\u03BC\u03AE (\u2265)",
    answerSet: "\u0391\u03C0\u03BF\u03B4\u03B5\u03BA\u03C4\u03AD\u03C2 \u03C4\u03B9\u03BC\u03AD\u03C2",
    answerInterval: "\u0394\u03B9\u03AC\u03C3\u03C4\u03B7\u03BC\u03B1 \u03C4\u03B9\u03BC\u03CE\u03BD",
    correctAnswers: "\u0391\u03C0\u03BF\u03B4\u03B5\u03BA\u03C4\u03AD\u03C2 \u03C4\u03B9\u03BC\u03AD\u03C2 (\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03AD\u03BD\u03B5\u03C2 \u03BC\u03B5 \u03BA\u03CC\u03BC\u03BC\u03B1)",
    lowerBound: "\u039A\u03AC\u03C4\u03C9 \u03CC\u03C1\u03B9\u03BF (\u03B3\u03C1\u03AC\u03C8\u03B5 -inf \u03B3\u03B9\u03B1 \u03B1\u03C0\u03B5\u03C1\u03B9\u03CC\u03C1\u03B9\u03C3\u03C4\u03BF \u03BA\u03AC\u03C4\u03C9 \u03CC\u03C1\u03B9\u03BF)",
    upperBound: "\u0386\u03BD\u03C9 \u03CC\u03C1\u03B9\u03BF (\u03B3\u03C1\u03AC\u03C8\u03B5 inf \u03B3\u03B9\u03B1 \u03B1\u03C0\u03B5\u03C1\u03B9\u03CC\u03C1\u03B9\u03C3\u03C4\u03BF \u03AC\u03BD\u03C9 \u03CC\u03C1\u03B9\u03BF)",
    includeLowerBound: "\u039D\u03B1 \u03C0\u03B5\u03C1\u03B9\u03BB\u03B1\u03BC\u03B2\u03AC\u03BD\u03B5\u03C4\u03B1\u03B9 \u03C4\u03BF \u03BA\u03AC\u03C4\u03C9 \u03CC\u03C1\u03B9\u03BF",
    includeUpperBound: "\u039D\u03B1 \u03C0\u03B5\u03C1\u03B9\u03BB\u03B1\u03BC\u03B2\u03AC\u03BD\u03B5\u03C4\u03B1\u03B9 \u03C4\u03BF \u03AC\u03BD\u03C9 \u03CC\u03C1\u03B9\u03BF",
    cellPosition: "\u0393\u03C1\u03B1\u03BC\u03BC\u03AE {{row}}, \u03C3\u03C4\u03AE\u03BB\u03B7 {{column}}",
    applyPropertiesLegend: "\u0399\u03B4\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03C0\u03BF\u03C5 \u03B8\u03B1 \u03B1\u03BD\u03C4\u03B9\u03B3\u03C1\u03B1\u03C6\u03BF\u03CD\u03BD \u03B1\u03C0\u03CC \u03B1\u03C5\u03C4\u03CC \u03C4\u03BF \u03BA\u03B5\u03BB\u03AF \u03C3\u03B5 \u03CC\u03BB\u03B1",
    apply: {
      min: "\u0395\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03BF",
      max: "\u039C\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF",
      step: "\u0392\u03AE\u03BC\u03B1",
      correctAnswerType: "\u039A\u03B1\u03BD\u03CC\u03BD\u03B1\u03C2 \u03B1\u03C0\u03AC\u03BD\u03C4\u03B7\u03C3\u03B7\u03C2",
      correctAnswer: "\u03A4\u03B9\u03BC\u03AE \u03B1\u03C0\u03AC\u03BD\u03C4\u03B7\u03C3\u03B7\u03C2",
      correctAnswers: "\u0391\u03C0\u03BF\u03B4\u03B5\u03BA\u03C4\u03AD\u03C2 \u03C4\u03B9\u03BC\u03AD\u03C2",
      correctAnswerMin: "\u039A\u03AC\u03C4\u03C9 \u03CC\u03C1\u03B9\u03BF \u03C3\u03C9\u03C3\u03C4\u03CE\u03BD \u03C4\u03B9\u03BC\u03CE\u03BD",
      correctAnswerMax: "\u0386\u03BD\u03C9 \u03CC\u03C1\u03B9\u03BF \u03C3\u03C9\u03C3\u03C4\u03CE\u03BD \u03C4\u03B9\u03BC\u03CE\u03BD",
      minInclusive: "\u039D\u03B1 \u03C0\u03B5\u03C1\u03B9\u03BB\u03B1\u03BC\u03B2\u03AC\u03BD\u03B5\u03C4\u03B1\u03B9 \u03C4\u03BF \u03BA\u03AC\u03C4\u03C9 \u03CC\u03C1\u03B9\u03BF",
      maxInclusive: "\u039D\u03B1 \u03C0\u03B5\u03C1\u03B9\u03BB\u03B1\u03BC\u03B2\u03AC\u03BD\u03B5\u03C4\u03B1\u03B9 \u03C4\u03BF \u03AC\u03BD\u03C9 \u03CC\u03C1\u03B9\u03BF"
    },
    fieldLabel: "\u0395\u03C4\u03B9\u03BA\u03AD\u03C4\u03B1 \u03BA\u03B5\u03BB\u03B9\u03BF\u03CD {{number}}",
    minimum: "\u0395\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03BF",
    maximum: "\u039C\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF",
    step: "\u0392\u03AE\u03BC\u03B1",
    applyToAll: "\u039C\u03B5\u03C4\u03B1\u03C6\u03BF\u03C1\u03AC \u03B5\u03C0\u03B9\u03BB\u03B5\u03B3\u03BC\u03AD\u03BD\u03C9\u03BD \u03B9\u03B4\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD \u03C3\u03B5 \u03CC\u03BB\u03B1 \u03C4\u03B1 \u03BA\u03B5\u03BB\u03B9\u03AC",
    responses: "\u0391\u03C0\u03B1\u03BD\u03C4\u03AE\u03C3\u03B5\u03B9\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD",
    noResponses: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B1\u03BA\u03CC\u03BC\u03B7 \u03B1\u03C0\u03B1\u03BD\u03C4\u03AE\u03C3\u03B5\u03B9\u03C2."
  },
  algebraTiles: {
    settings: "\u03A1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2 \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1",
    activityType: "\u03A4\u03CD\u03C0\u03BF\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    equations: "\u0395\u03BE\u03B9\u03C3\u03CE\u03C3\u03B5\u03B9\u03C2",
    factorization: "\u03A0\u03B1\u03C1\u03B1\u03B3\u03BF\u03BD\u03C4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7",
    equation: "\u0395\u03BE\u03AF\u03C3\u03C9\u03C3\u03B7",
    factorizationTask: "\u03A0\u03C1\u03AC\u03BE\u03B7 \u03C0\u03B1\u03C1\u03B1\u03B3\u03BF\u03BD\u03C4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7\u03C2",
    factorize: "\u039D\u03B1 \u03C0\u03B1\u03C1\u03B1\u03B3\u03BF\u03BD\u03C4\u03BF\u03C0\u03BF\u03B9\u03AE\u03C3\u03B5\u03B9\u03C2",
    boardMode: "\u0394\u03B9\u03AC\u03C4\u03B1\u03BE\u03B7 \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1",
    prompt: "\u0395\u03BA\u03C6\u03CE\u03BD\u03B7\u03C3\u03B7",
    modes: {
      equation: "\u0395\u03BE\u03AF\u03C3\u03C9\u03C3\u03B7",
      systems: "\u03A3\u03C5\u03C3\u03C4\u03AE\u03BC\u03B1\u03C4\u03B1",
      area: "\u0395\u03BC\u03B2\u03B1\u03B4\u03CC\u03BD",
      simplified: "\u0391\u03C0\u03BB\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7"
    },
    promptExpression: "\u0388\u03BA\u03C6\u03C1\u03B1\u03C3\u03B7 / LaTeX",
    sendToAll: "\u0391\u03C0\u03BF\u03C3\u03C4\u03BF\u03BB\u03AE \u03C3\u03B5 \u03CC\u03BB\u03BF\u03C5\u03C2",
    sendStatus: {
      sending: "\u0391\u03C0\u03BF\u03C3\u03C4\u03BF\u03BB\u03AE\u2026",
      sent: "\u03A3\u03C4\u03AC\u03BB\u03B8\u03B7\u03BA\u03B5 \u03C3\u03B5 \u03CC\u03BB\u03BF\u03C5\u03C2",
      disconnected: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03B5\u03B9 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 \u03BC\u03B5 \u03C4\u03BF\u03BD server \u03C4\u03B7\u03C2 \u03C4\u03AC\u03BE\u03B7\u03C2",
      failed: "\u039F server \u03B4\u03B5\u03BD \u03B5\u03C0\u03B9\u03B2\u03B5\u03B2\u03B1\u03AF\u03C9\u03C3\u03B5 \u03C4\u03B7\u03BD \u03AD\u03BA\u03C6\u03C1\u03B1\u03C3\u03B7"
    }
  },
  geoGebraCollaborativeDescriptionShort: "\u039A\u03BF\u03B9\u03BD\u03CC\u03C7\u03C1\u03B7\u03C3\u03C4\u03BF\u03C2 \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 GeoGebra \u03B3\u03B9\u03B1 \u03C3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C4\u03B9\u03BA\u03AE \u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1.",
  geoGebraMonitor: "\u03A3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1 \u03B5\u03BB\u03AD\u03B3\u03C7\u03BF\u03C5 GeoGebra",
  console: "\u039A\u03BF\u03BD\u03C3\u03CC\u03BB\u03B1",
  consoleIntro: "\u0396\u03C9\u03BD\u03C4\u03B1\u03BD\u03AE \u03BA\u03B1\u03C4\u03B1\u03B3\u03C1\u03B1\u03C6\u03AE \u03BC\u03B7\u03BD\u03C5\u03BC\u03AC\u03C4\u03C9\u03BD \u03BC\u03B5\u03C4\u03B1\u03BE\u03CD \u03C7\u03C1\u03B7\u03C3\u03C4\u03CE\u03BD \u03BA\u03B1\u03B9 \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE. \u0391\u03BD\u03B1\u03BD\u03AD\u03C9\u03C3\u03B7 \u03BA\u03AC\u03B8\u03B5 \u03B4\u03CD\u03BF \u03B4\u03B5\u03C5\u03C4\u03B5\u03C1\u03CC\u03BB\u03B5\u03C0\u03C4\u03B1.",
  consoleFetchFailed: "\u0391\u03C0\u03BF\u03C4\u03C5\u03C7\u03AF\u03B1 \u03B1\u03BD\u03AC\u03BA\u03C4\u03B7\u03C3\u03B7\u03C2 \u03BC\u03B7\u03BD\u03C5\u03BC\u03AC\u03C4\u03C9\u03BD ({{status}}).",
  consoleUnavailable: "\u0394\u03B5\u03BD \u03AE\u03C4\u03B1\u03BD \u03B4\u03C5\u03BD\u03B1\u03C4\u03AE \u03B7 \u03B1\u03BD\u03AC\u03BA\u03C4\u03B7\u03C3\u03B7 \u03C4\u03C9\u03BD \u03BC\u03B7\u03BD\u03C5\u03BC\u03AC\u03C4\u03C9\u03BD.",
  realtimeServer: "\u0396\u03A9\u039D\u03A4\u0391\u039D\u0391 \u2022 \u0394\u0399\u0391\u039A\u039F\u039C\u0399\u03A3\u03A4\u0397\u03A3",
  refresh: "\u0391\u03BD\u03B1\u03BD\u03AD\u03C9\u03C3\u03B7",
  clearFilters: "\u039A\u03B1\u03B8\u03B1\u03C1\u03B9\u03C3\u03BC\u03CC\u03C2 \u03C6\u03AF\u03BB\u03C4\u03C1\u03C9\u03BD",
  time: "\u038F\u03C1\u03B1",
  direction: "\u039A\u03B1\u03C4\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7",
  from: "\u0391\u03C0\u03CC",
  to: "\u03A0\u03C1\u03BF\u03C2",
  message: "\u039C\u03AE\u03BD\u03C5\u03BC\u03B1",
  noMessages: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03BC\u03B7\u03BD\u03CD\u03BC\u03B1\u03C4\u03B1 \u03B3\u03B9\u03B1 \u03C4\u03B1 \u03B5\u03C0\u03B9\u03BB\u03B5\u03B3\u03BC\u03AD\u03BD\u03B1 \u03C6\u03AF\u03BB\u03C4\u03C1\u03B1.",
  cameraSpeedTest: "\u0388\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 \u03C4\u03B1\u03C7\u03CD\u03C4\u03B7\u03C4\u03B1\u03C2 \u03BA\u03AC\u03BC\u03B5\u03C1\u03B1\u03C2",
  cameraSpeedDescription: "\u03A3\u03CD\u03B3\u03BA\u03C1\u03B9\u03C3\u03B7 \u03B1\u03BA\u03B1\u03C4\u03AD\u03C1\u03B3\u03B1\u03C3\u03C4\u03BF\u03C5 \u03BA\u03B1\u03C1\u03AD \u03BA\u03AC\u03BC\u03B5\u03C1\u03B1\u03C2 \u03BC\u03B5 \u03C4\u03BF \u03BA\u03B1\u03C1\u03AD \u03C0\u03BF\u03C5 \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03C5\u03B8\u03B5\u03AF \u03BF \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE\u03C2 (DeepSORT).",
  startTest: "\u0388\u03BD\u03B1\u03C1\u03BE\u03B7 \u03B4\u03BF\u03BA\u03B9\u03BC\u03AE\u03C2",
  stopTest: "\u0394\u03B9\u03B1\u03BA\u03BF\u03C0\u03AE \u03B4\u03BF\u03BA\u03B9\u03BC\u03AE\u03C2",
  trackingBackend: "\u03A3\u03CD\u03C3\u03C4\u03B7\u03BC\u03B1 \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7\u03C2",
  roundTripAverage: "\u03A7\u03C1\u03CC\u03BD\u03BF\u03C2 \u03BC\u03B5\u03C4\u03AC\u03B2\u03B1\u03C3\u03B7\u03C2 \u03BA\u03B1\u03B9 \u03B5\u03C0\u03B9\u03C3\u03C4\u03C1\u03BF\u03C6\u03AE\u03C2 (\u03BC\u03AD\u03C3\u03BF\u03C2)",
  serverProcessAverage: "\u0395\u03C0\u03B5\u03BE\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1 \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE (\u03BC\u03AD\u03C3\u03BF\u03C2)",
  sendFps: "FPS \u03B1\u03C0\u03BF\u03C3\u03C4\u03BF\u03BB\u03AE\u03C2",
  responseFps: "FPS \u03B1\u03C0\u03CC\u03BA\u03C1\u03B9\u03C3\u03B7\u03C2",
  trackedBoxes: "\u03A0\u03BB\u03B1\u03AF\u03C3\u03B9\u03B1 \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7\u03C2",
  cameraCaptureClient: "\u039B\u03AE\u03C8\u03B7 \u03BA\u03AC\u03BC\u03B5\u03C1\u03B1\u03C2 (\u03C0\u03B5\u03BB\u03AC\u03C4\u03B7\u03C2)",
  trackedFrameServer: "\u039A\u03B1\u03C1\u03AD \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7\u03C2 (\u03B1\u03C0\u03CC\u03BA\u03C1\u03B9\u03C3\u03B7 \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE)",
  jpegQuality: "\u03A0\u03BF\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 JPEG",
  cameraStatus: {
    idle: "\u0391\u03BD\u03B5\u03BD\u03B5\u03C1\u03B3\u03CC",
    stopped: "\u0394\u03B9\u03B1\u03BA\u03CC\u03C0\u03B7\u03BA\u03B5",
    realtimeConnected: "\u03A3\u03C5\u03BD\u03B4\u03AD\u03B8\u03B7\u03BA\u03B5 \u03C3\u03C4\u03BF\u03BD \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE \u03C0\u03C1\u03B1\u03B3\u03BC\u03B1\u03C4\u03B9\u03BA\u03BF\u03CD \u03C7\u03C1\u03CC\u03BD\u03BF\u03C5",
    realtimeDisconnected: "\u0391\u03C0\u03BF\u03C3\u03C5\u03BD\u03B4\u03AD\u03B8\u03B7\u03BA\u03B5 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE \u03C0\u03C1\u03B1\u03B3\u03BC\u03B1\u03C4\u03B9\u03BA\u03BF\u03CD \u03C7\u03C1\u03CC\u03BD\u03BF\u03C5",
    streamingStarted: "\u0397 \u03B4\u03BF\u03BA\u03B9\u03BC\u03AE \u03BC\u03B5\u03C4\u03AC\u03B4\u03BF\u03C3\u03B7\u03C2 \u03BE\u03B5\u03BA\u03AF\u03BD\u03B7\u03C3\u03B5",
    cannotStart: "\u0394\u03B5\u03BD \u03AE\u03C4\u03B1\u03BD \u03B4\u03C5\u03BD\u03B1\u03C4\u03AE \u03B7 \u03AD\u03BD\u03B1\u03C1\u03BE\u03B7 \u03C4\u03B7\u03C2 \u03B4\u03BF\u03BA\u03B9\u03BC\u03AE\u03C2"
  },
  visionCollabTitle: "\u039A\u03AC\u03BC\u03B5\u03C1\u03B1",
  visionCollabDisplay: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7",
  visionCollabTrackingMode: "\u039B\u03B5\u03C0\u03C4\u03BF\u03BC\u03AD\u03C1\u03B5\u03B9\u03B1 \u03B9\u03C7\u03BD\u03B7\u03BB\u03AC\u03C4\u03B7\u03C3\u03B7\u03C2",
  visionCollabSinglePoint: "\u0388\u03BD\u03B1 \u03C3\u03B7\u03BC\u03B5\u03AF\u03BF",
  visionCollabPoseLandmarks: "\u03A3\u03B7\u03BC\u03B5\u03AF\u03B1 Pose",
  visionCollabCameraView: "\u039A\u03AC\u03BC\u03B5\u03C1\u03B1 \u03BA\u03B1\u03B9 \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2",
  visionCollabBoardView: "\u039C\u03CC\u03BD\u03BF \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2",
  visionCollabActiveUsers: "\u0395\u03BD\u03B5\u03C1\u03B3\u03BF\u03AF \u03C7\u03C1\u03AE\u03C3\u03C4\u03B5\u03C2",
  visionCollabNoActiveUsers: "\u0394\u03B5\u03BD \u03C0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03C5\u03B8\u03BF\u03CD\u03BD\u03C4\u03B1\u03B9 \u03B5\u03BD\u03B5\u03C1\u03B3\u03BF\u03AF \u03C7\u03C1\u03AE\u03C3\u03C4\u03B5\u03C2.",
  visionCollabSource: "\u03A4\u03C1\u03CC\u03C0\u03BF\u03C2 \u03B5\u03BD\u03C4\u03BF\u03C0\u03B9\u03C3\u03BC\u03BF\u03CD",
  visionCollabCameraSource: "\u039A\u03AC\u03BC\u03B5\u03C1\u03B1",
  visionCollabPoseSource: "Pose",
  visionCollabTrackingStatus: "\u0399\u03C7\u03BD\u03B7\u03BB\u03AC\u03C4\u03B7\u03C3\u03B7: {{mode}} \xB7 {{backend}} \xB7 {{points}} \u03C3\u03B7\u03BC\u03B5\u03AF\u03B1",
  visionCollabPoseLandmarkNames: {
    nose: "\u039C\u03CD\u03C4\u03B7",
    left_eye_inner: "\u0395\u03C3\u03C9\u03C4\u03B5\u03C1\u03B9\u03BA\u03AE \u03B3\u03C9\u03BD\u03AF\u03B1 \u03B1\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03BF\u03CD \u03BC\u03B1\u03C4\u03B9\u03BF\u03CD",
    left_eye: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC \u03BC\u03AC\u03C4\u03B9",
    left_eye_outer: "\u0395\u03BE\u03C9\u03C4\u03B5\u03C1\u03B9\u03BA\u03AE \u03B3\u03C9\u03BD\u03AF\u03B1 \u03B1\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03BF\u03CD \u03BC\u03B1\u03C4\u03B9\u03BF\u03CD",
    right_eye_inner: "\u0395\u03C3\u03C9\u03C4\u03B5\u03C1\u03B9\u03BA\u03AE \u03B3\u03C9\u03BD\u03AF\u03B1 \u03B4\u03B5\u03BE\u03B9\u03BF\u03CD \u03BC\u03B1\u03C4\u03B9\u03BF\u03CD",
    right_eye: "\u0394\u03B5\u03BE\u03AF \u03BC\u03AC\u03C4\u03B9",
    right_eye_outer: "\u0395\u03BE\u03C9\u03C4\u03B5\u03C1\u03B9\u03BA\u03AE \u03B3\u03C9\u03BD\u03AF\u03B1 \u03B4\u03B5\u03BE\u03B9\u03BF\u03CD \u03BC\u03B1\u03C4\u03B9\u03BF\u03CD",
    left_ear: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC \u03B1\u03C5\u03C4\u03AF",
    right_ear: "\u0394\u03B5\u03BE\u03AF \u03B1\u03C5\u03C4\u03AF",
    mouth_left: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03AE \u03B3\u03C9\u03BD\u03AF\u03B1 \u03C3\u03C4\u03CC\u03BC\u03B1\u03C4\u03BF\u03C2",
    mouth_right: "\u0394\u03B5\u03BE\u03B9\u03AC \u03B3\u03C9\u03BD\u03AF\u03B1 \u03C3\u03C4\u03CC\u03BC\u03B1\u03C4\u03BF\u03C2",
    left_shoulder: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC\u03C2 \u03CE\u03BC\u03BF\u03C2",
    right_shoulder: "\u0394\u03B5\u03BE\u03B9\u03CC\u03C2 \u03CE\u03BC\u03BF\u03C2",
    left_elbow: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC\u03C2 \u03B1\u03B3\u03BA\u03CE\u03BD\u03B1\u03C2",
    right_elbow: "\u0394\u03B5\u03BE\u03B9\u03CC\u03C2 \u03B1\u03B3\u03BA\u03CE\u03BD\u03B1\u03C2",
    left_wrist: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC\u03C2 \u03BA\u03B1\u03C1\u03C0\u03CC\u03C2",
    right_wrist: "\u0394\u03B5\u03BE\u03B9\u03CC\u03C2 \u03BA\u03B1\u03C1\u03C0\u03CC\u03C2",
    left_pinky: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC \u03BC\u03B9\u03BA\u03C1\u03CC \u03B4\u03AC\u03C7\u03C4\u03C5\u03BB\u03BF",
    right_pinky: "\u0394\u03B5\u03BE\u03AF \u03BC\u03B9\u03BA\u03C1\u03CC \u03B4\u03AC\u03C7\u03C4\u03C5\u03BB\u03BF",
    left_index: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC\u03C2 \u03B4\u03B5\u03AF\u03BA\u03C4\u03B7\u03C2",
    right_index: "\u0394\u03B5\u03BE\u03B9\u03CC\u03C2 \u03B4\u03B5\u03AF\u03BA\u03C4\u03B7\u03C2",
    left_thumb: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC\u03C2 \u03B1\u03BD\u03C4\u03AF\u03C7\u03B5\u03B9\u03C1\u03B1\u03C2",
    right_thumb: "\u0394\u03B5\u03BE\u03B9\u03CC\u03C2 \u03B1\u03BD\u03C4\u03AF\u03C7\u03B5\u03B9\u03C1\u03B1\u03C2",
    left_hip: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC \u03B9\u03C3\u03C7\u03AF\u03BF",
    right_hip: "\u0394\u03B5\u03BE\u03AF \u03B9\u03C3\u03C7\u03AF\u03BF",
    left_knee: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC \u03B3\u03CC\u03BD\u03B1\u03C4\u03BF",
    right_knee: "\u0394\u03B5\u03BE\u03AF \u03B3\u03CC\u03BD\u03B1\u03C4\u03BF",
    left_ankle: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03CC\u03C2 \u03B1\u03C3\u03C4\u03C1\u03AC\u03B3\u03B1\u03BB\u03BF\u03C2",
    right_ankle: "\u0394\u03B5\u03BE\u03B9\u03CC\u03C2 \u03B1\u03C3\u03C4\u03C1\u03AC\u03B3\u03B1\u03BB\u03BF\u03C2",
    left_heel: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03AE \u03C6\u03C4\u03AD\u03C1\u03BD\u03B1",
    right_heel: "\u0394\u03B5\u03BE\u03B9\u03AC \u03C6\u03C4\u03AD\u03C1\u03BD\u03B1",
    left_foot_index: "\u0386\u03BA\u03C1\u03B7 \u03B1\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03BF\u03CD \u03C0\u03AD\u03BB\u03BC\u03B1\u03C4\u03BF\u03C2",
    right_foot_index: "\u0386\u03BA\u03C1\u03B7 \u03B4\u03B5\u03BE\u03B9\u03BF\u03CD \u03C0\u03AD\u03BB\u03BC\u03B1\u03C4\u03BF\u03C2"
  },
  visionCollabMouseSource: "\u03A0\u03BF\u03BD\u03C4\u03AF\u03BA\u03B9",
  visionCollabCoordinateX: "X",
  visionCollabCoordinateY: "Y",
  visionCollabStudent: "\u039C\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
  visionCollabRenameTrackedPoint: "\u038C\u03BD\u03BF\u03BC\u03B1 \u03B3\u03B9\u03B1 \u03C4\u03BF \u03AC\u03C4\u03BF\u03BC\u03BF \u03C0\u03BF\u03C5 \u03B5\u03BD\u03C4\u03BF\u03C0\u03AF\u03C3\u03C4\u03B7\u03BA\u03B5 ({{name}}):",
  visionCollabSaveName: "\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7 \u03BF\u03BD\u03CC\u03BC\u03B1\u03C4\u03BF\u03C2",
  visionCollabCancelName: "\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7",
  visionCollabServerUrl: "URL \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE Vision",
  visionCollabActivity: "\u03A0\u03C1\u03CC\u03C4\u03C5\u03C0\u03BF \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
  visionCollabStart: "\u0388\u03BD\u03B1\u03C1\u03BE\u03B7 \u03C1\u03BF\u03AE\u03C2 \u03C3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1\u03C2",
  visionCollabStop: "\u0394\u03B9\u03B1\u03BA\u03BF\u03C0\u03AE \u03C1\u03BF\u03AE\u03C2 \u03C3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1\u03C2",
  visionCollabStatus: "\u039A\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7",
  visionCollabTrackedPoints: "\u03A3\u03B7\u03BC\u03B5\u03AF\u03B1 \u03B9\u03C7\u03BD\u03B7\u03BB\u03AC\u03C4\u03B7\u03C3\u03B7\u03C2",
  visionCollabWebSocketError: "\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1 \u03B5\u03C0\u03B9\u03BA\u03BF\u03B9\u03BD\u03C9\u03BD\u03AF\u03B1\u03C2 Vision WebSocket.",
  visionCollabCannotStart: "\u0394\u03B5\u03BD \u03AE\u03C4\u03B1\u03BD \u03B4\u03C5\u03BD\u03B1\u03C4\u03AE \u03B7 \u03AD\u03BD\u03B1\u03C1\u03BE\u03B7 \u03C4\u03B7\u03C2 \u03C3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C4\u03B9\u03BA\u03AE\u03C2 \u03B9\u03C7\u03BD\u03B7\u03BB\u03AC\u03C4\u03B7\u03C3\u03B7\u03C2 \u03BA\u03AC\u03BC\u03B5\u03C1\u03B1\u03C2.",
  visionCollabStatuses: {
    idle: "\u0391\u03BD\u03B5\u03BD\u03B5\u03C1\u03B3\u03CC",
    stopped: "\u0394\u03B9\u03B1\u03BA\u03BF\u03C0\u03AE",
    connected: "\u03A3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF",
    disconnected: "\u0391\u03C0\u03BF\u03C3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF",
    error: "\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1",
    cannotStart: "\u0391\u03B4\u03C5\u03BD\u03B1\u03BC\u03AF\u03B1 \u03AD\u03BD\u03B1\u03C1\u03BE\u03B7\u03C2"
  },
  linearSeparation: "\u0395\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03BF \u03B3\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03BF\u03CD \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03BF\u03CD",
  linearSeparationLead: "\u0394\u03CE\u03C3\u03C4\u03B5 JSON \u03C3\u03C4\u03B7 \u03BC\u03BF\u03C1\u03C6\u03AE \u03C4\u03BF\u03C5 datasets.js \u03BA\u03B1\u03B9 \u03B2\u03C1\u03B5\u03AF\u03C4\u03B5 \u03C5\u03C0\u03B5\u03C1\u03B5\u03C0\u03AF\u03C0\u03B5\u03B4\u03BF \u03B3\u03B9\u03B1 \u03C4\u03B1\u03BE\u03B9\u03BD\u03CC\u03BC\u03B7\u03C3\u03B7 \u03C3\u03C4\u03CC\u03C7\u03BF\u03C5 \u03AD\u03BD\u03B1\u03BD\u03C4\u03B9 \u03C4\u03C9\u03BD \u03C5\u03C0\u03BF\u03BB\u03BF\u03AF\u03C0\u03C9\u03BD.",
  linearSeparationInputTitle: "\u0395\u03B9\u03C3\u03B1\u03B3\u03C9\u03B3\u03AE Dataset JSON",
  linearSeparationJsonPlaceholder: "\u0395\u03C0\u03B9\u03BA\u03BF\u03BB\u03BB\u03AE\u03C3\u03C4\u03B5 \u03B5\u03B4\u03CE \u03C4\u03BF JSON \u03C4\u03BF\u03C5 \u03C3\u03C5\u03BD\u03CC\u03BB\u03BF\u03C5 \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD",
  linearSeparationLoadJson: "\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 JSON",
  linearSeparationJsonError: "\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1 JSON",
  linearSeparationTargetCategory: "\u039A\u03B1\u03C4\u03B7\u03B3\u03BF\u03C1\u03AF\u03B1 \u03C3\u03C4\u03CC\u03C7\u03BF\u03C2",
  linearSeparationDataset: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD",
  linearSeparationMissingClasses: "\u03A7\u03C1\u03B5\u03B9\u03AC\u03B6\u03B5\u03C4\u03B1\u03B9 \u03C4\u03BF\u03C5\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03BF\u03BD \u03AD\u03BD\u03B1 \u03B8\u03B5\u03C4\u03B9\u03BA\u03CC \u03BA\u03B1\u03B9 \u03AD\u03BD\u03B1 \u03B1\u03C1\u03BD\u03B7\u03C4\u03B9\u03BA\u03CC \u03B4\u03B5\u03AF\u03B3\u03BC\u03B1.",
  linearSeparationLimitReason: "\u0394\u03B5\u03BD \u03B2\u03C1\u03AD\u03B8\u03B7\u03BA\u03B5 \u03B1\u03BA\u03AD\u03C1\u03B1\u03B9\u03BF\u03C2 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03C4\u03AE\u03C2 \u03B3\u03B9\u03B1 |w_j| \u2264 {{maxRadius}}.",
  linearSeparationExample: "\u03A0\u03B1\u03C1\u03AC\u03B4\u03B5\u03B9\u03B3\u03BC\u03B1",
  linearSeparationPrediction: "\u03A0\u03C1\u03CC\u03B2\u03BB\u03B5\u03C8\u03B7",
  linearSeparationLabel: "\u0395\u03C4\u03B9\u03BA\u03AD\u03C4\u03B1",
  linearSeparationCorrect: "\u03A3\u03C9\u03C3\u03C4\u03CC",
  linearSeparationPositive: "\u03B8\u03B5\u03C4\u03B9\u03BA\u03CC",
  linearSeparationNegative: "\u03B1\u03C1\u03BD\u03B7\u03C4\u03B9\u03BA\u03CC",
  linearSeparationTarget: "\u03C3\u03C4\u03CC\u03C7\u03BF\u03C2",
  linearSeparationOthers: "\u03BB\u03BF\u03B9\u03C0\u03AC",
  datasetJson: "JSON \u03C3\u03C5\u03BD\u03CC\u03BB\u03BF\u03C5 \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD",
  settings: "\u03A1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2",
  result: "\u0391\u03C0\u03BF\u03C4\u03AD\u03BB\u03B5\u03C3\u03BC\u03B1",
  notEnoughData: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B1\u03BA\u03CC\u03BC\u03B1 \u03B1\u03C1\u03BA\u03B5\u03C4\u03AC \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03B1.",
  separatorNotFound: "\u0394\u03B5\u03BD \u03B2\u03C1\u03AD\u03B8\u03B7\u03BA\u03B5 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03C4\u03AE\u03C2.",
  separatorFound: "\u0392\u03C1\u03AD\u03B8\u03B7\u03BA\u03B5 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03C4\u03AE\u03C2.",
  minimumMaxWeight: "\u039C\u03B9\u03BA\u03C1\u03CC\u03C4\u03B5\u03C1\u03BF \u03BC\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF |w|",
  margin: "\u03A0\u03B5\u03C1\u03B9\u03B8\u03CE\u03C1\u03B9\u03BF",
  runTests: "\u0395\u03BA\u03C4\u03AD\u03BB\u03B5\u03C3\u03B7 \u03B4\u03BF\u03BA\u03B9\u03BC\u03CE\u03BD",
  summary: "\u03A3\u03CD\u03BD\u03BF\u03C8\u03B7",
  activityBuilder: {
    title: "\u0394\u03B9\u03B1\u03C7\u03B5\u03AF\u03C1\u03B9\u03C3\u03B7 \u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD",
    settingsTitle: "\u0394\u03B9\u03B1\u03C7\u03B5\u03AF\u03C1\u03B9\u03C3\u03B7 \u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD / Activity Settings",
    titleLabel: "\u03A4\u03AF\u03C4\u03BB\u03BF\u03C2",
    titlePlaceholder: "\u03A4\u03AF\u03C4\u03BB\u03BF\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    titleRequired: "\u03A3\u03C5\u03BC\u03C0\u03BB\u03B7\u03C1\u03CE\u03C3\u03C4\u03B5 \u03C4\u03BF\u03BD \u03C4\u03AF\u03C4\u03BB\u03BF \u03C4\u03B7\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2.",
    openFile: "\u0386\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1 \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF\u03C5",
    serverActivity: "\u0391\u03C0\u03BF\u03B8\u03B7\u03BA\u03B5\u03C5\u03BC\u03AD\u03BD\u03B5\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
    chooseServerActivity: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    openServerActivity: "\u0386\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    fileLoaded: "\u03A6\u03BF\u03C1\u03C4\u03CE\u03B8\u03B7\u03BA\u03B5 \u03C4\u03BF {{filename}}",
    openFileError: "\u0394\u03B5\u03BD \u03AE\u03C4\u03B1\u03BD \u03B4\u03C5\u03BD\u03B1\u03C4\u03CC \u03BD\u03B1 \u03B1\u03BD\u03BF\u03AF\u03BE\u03B5\u03B9 \u03B1\u03C5\u03C4\u03CC \u03C4\u03BF \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF JSON \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2.",
    jsonPreview: "JSON \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    editorTitle: "\u0395\u03C0\u03B5\u03BE\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    libraryTitle: "\u0392\u03B9\u03B2\u03BB\u03B9\u03BF\u03B8\u03AE\u03BA\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD",
    resource: "\u03A0\u03CC\u03C1\u03BF\u03C2",
    chooseResource: "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03C0\u03CC\u03C1\u03BF",
    activity: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1",
    chooseActivity: "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1",
    activityName: "\u038C\u03BD\u03BF\u03BC\u03B1 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    activityNamePlaceholder: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 \u03BC\u03B1\u03B8\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2",
    activityNameRequired: "\u03A3\u03C5\u03BC\u03C0\u03BB\u03B7\u03C1\u03CE\u03C3\u03C4\u03B5 \u03C4\u03BF \u03CC\u03BD\u03BF\u03BC\u03B1 \u03C4\u03B7\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2.",
    notes: "\u03A3\u03B7\u03BC\u03B5\u03B9\u03CE\u03C3\u03B5\u03B9\u03C2",
    notesPlaceholder: "\u03A3\u03B7\u03BC\u03B5\u03B9\u03CE\u03C3\u03B5\u03B9\u03C2 \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD",
    configJson: "\u03A1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2 \u03C0\u03CC\u03C1\u03BF\u03C5 (JSON)",
    saveActivity: "\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    preview: "\u03A0\u03C1\u03BF\u03B5\u03C0\u03B9\u03C3\u03BA\u03CC\u03C0\u03B7\u03C3\u03B7",
    previewEmpty: "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 \u03B3\u03B9\u03B1 \u03BD\u03B1 \u03B4\u03B5\u03AF\u03C4\u03B5 \u03C4\u03BF JSON \u03C4\u03B7\u03C2.",
    libraryResource: "\u03A0\u03CC\u03C1\u03BF\u03C2: {{title}}",
    ready: "\u0388\u03C4\u03BF\u03B9\u03BC\u03BF",
    noResources: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B4\u03B9\u03B1\u03B8\u03AD\u03C3\u03B9\u03BC\u03BF\u03B9 \u03C0\u03CC\u03C1\u03BF\u03B9.",
    loadResourcesError: "\u0391\u03C0\u03BF\u03C4\u03C5\u03C7\u03AF\u03B1 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7\u03C2 \u03C0\u03CC\u03C1\u03C9\u03BD.",
    loadLibraryError: "\u0391\u03C0\u03BF\u03C4\u03C5\u03C7\u03AF\u03B1 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7\u03C2 \u03B2\u03B9\u03B2\u03BB\u03B9\u03BF\u03B8\u03AE\u03BA\u03B7\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD.",
    loadActivityError: "\u0391\u03C0\u03BF\u03C4\u03C5\u03C7\u03AF\u03B1 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2.",
    selectResource: "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03C0\u03C1\u03CE\u03C4\u03B1 \u03C0\u03CC\u03C1\u03BF.",
    invalidConfig: "\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF JSON \u03C1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03C9\u03BD: {{message}}",
    saving: "\u0391\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7\u2026",
    saved: "\u0397 \u03B1\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7 \u03BF\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5.",
    saveError: "\u0391\u03C0\u03BF\u03C4\u03C5\u03C7\u03AF\u03B1 \u03B1\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2.",
    saveFailed: "\u0397 \u03B1\u03C0\u03BF\u03B8\u03AE\u03BA\u03B5\u03C5\u03C3\u03B7 \u03B1\u03C0\u03AD\u03C4\u03C5\u03C7\u03B5.",
    loadError: "\u0394\u03B5\u03BD \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B4\u03C5\u03BD\u03B1\u03C4\u03AE \u03B7 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03C0\u03CC\u03C1\u03C9\u03BD.",
    loaded: "\u03A6\u03BF\u03C1\u03C4\u03CE\u03B8\u03B7\u03BA\u03B5 \u03C4\u03BF {{filename}}",
    resourceNames: {
      "venn-board": "\u0394\u03B9\u03AC\u03B3\u03C1\u03B1\u03BC\u03BC\u03B1 Venn",
      "input-grid": "\u03A0\u03BB\u03AD\u03B3\u03BC\u03B1 \u03BA\u03B1\u03C4\u03B1\u03C7\u03CE\u03C1\u03B9\u03C3\u03B7\u03C2",
      "grouping-drag-drop": "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03C4\u03BF\u03C0\u03BF\u03B8\u03AD\u03C4\u03B7\u03C3\u03B7\u03C2",
      "algebra-tiles": "\u03A0\u03BB\u03B1\u03BA\u03AF\u03B4\u03B9\u03B1 \u0386\u03BB\u03B3\u03B5\u03B2\u03C1\u03B1\u03C2",
      "collaborative-geogebra": "GeoGebra",
      "collaborative-algebra-tiles": "\u03A0\u03BB\u03B1\u03BA\u03AF\u03B4\u03B9\u03B1 \u0386\u03BB\u03B3\u03B5\u03B2\u03C1\u03B1\u03C2 (\u03BA\u03BF\u03B9\u03BD\u03CC\u03C2 \u03BA\u03B1\u03BC\u03B2\u03AC\u03C2)",
      "options-grid": "\u03A0\u03BB\u03AD\u03B3\u03BC\u03B1 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03CE\u03BD",
      "cartesian-plane": "\u039A\u03B1\u03C1\u03C4\u03B5\u03C3\u03B9\u03B1\u03BD\u03CC \u03B5\u03C0\u03AF\u03C0\u03B5\u03B4\u03BF"
    },
    resourceSettings: "\u03A1\u03C5\u03B8\u03BC\u03AF\u03C3\u03B5\u03B9\u03C2 \u03C0\u03CC\u03C1\u03BF\u03C5",
    columns: "\u03A3\u03C4\u03AE\u03BB\u03B5\u03C2",
    rows: "\u0393\u03C1\u03B1\u03BC\u03BC\u03AD\u03C2",
    gridCell: "\u0393\u03C1\u03B1\u03BC\u03BC\u03AE {{row}}, \u03C3\u03C4\u03AE\u03BB\u03B7 {{column}}",
    className: "\u038C\u03BD\u03BF\u03BC\u03B1 \u03BA\u03BB\u03AC\u03C3\u03B7\u03C2 CSS",
    labelClassName: "\u039A\u03BB\u03AC\u03C3\u03B7 CSS \u03B5\u03C4\u03B9\u03BA\u03AD\u03C4\u03B1\u03C2 \u03B5\u03B9\u03C3\u03CC\u03B4\u03BF\u03C5",
    customLayout: "\u03A7\u03C1\u03AE\u03C3\u03B7 \u03C0\u03C1\u03BF\u03C3\u03B1\u03C1\u03BC\u03BF\u03C3\u03BC\u03AD\u03BD\u03B7\u03C2 \u03B4\u03B9\u03AC\u03C4\u03B1\u03BE\u03B7\u03C2",
    inputFields: "\u03A0\u03B5\u03B4\u03AF\u03B1 \u03B5\u03B9\u03C3\u03CC\u03B4\u03BF\u03C5",
    defaultInput: "\u0395\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2 {{index}}",
    defaultGroup: "\u039F\u03BC\u03AC\u03B4\u03B1 {{index}}",
    defaultItem: "\u0391\u03BD\u03C4\u03B9\u03BA\u03B5\u03AF\u03BC\u03B5\u03BD\u03BF {{index}}",
    defaultItemsBank: "\u0391\u03BD\u03C4\u03B9\u03BA\u03B5\u03AF\u03BC\u03B5\u03BD\u03B1 \u03C0\u03C1\u03BF\u03C2 \u03BF\u03BC\u03B1\u03B4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7",
    defaultOption: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE {{index}}",
    options: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2",
    optionsExpressionHelp: "\u03A7\u03C1\u03B7\u03C3\u03B9\u03BC\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B5 2:20:2, a:f, \u03C4\u03B9\u03BC\u03AD\u03C2 \u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03AD\u03BD\u03B5\u03C2 \u03BC\u03B5 \u03BA\u03CC\u03BC\u03BC\u03B1 \u03AE \u03C3\u03C5\u03BD\u03B4\u03C5\u03B1\u03C3\u03BC\u03BF\u03CD\u03C2 \u03CC\u03C0\u03C9\u03C2 2:6,8:12.",
    optionLabel: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE",
    invalidOptionsJson: "\u039F\u03B9 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2 \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF JSON array.",
    fieldId: "ID \u03C0\u03B5\u03B4\u03AF\u03BF\u03C5",
    fieldLabel: "\u0395\u03C4\u03B9\u03BA\u03AD\u03C4\u03B1 \u03B5\u03B9\u03C3\u03CC\u03B4\u03BF\u03C5",
    fieldPlaceholder: "\u039A\u03B5\u03AF\u03BC\u03B5\u03BD\u03BF \u03C5\u03C0\u03CC\u03B4\u03B5\u03B9\u03BE\u03B7\u03C2",
    fieldType: "\u03A4\u03CD\u03C0\u03BF\u03C2 \u03B5\u03B9\u03C3\u03CC\u03B4\u03BF\u03C5",
    textType: "\u039A\u03B5\u03AF\u03BC\u03B5\u03BD\u03BF",
    numberType: "\u0391\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2",
    correctAnswer: "\u03A3\u03C9\u03C3\u03C4\u03AE \u03B1\u03C0\u03AC\u03BD\u03C4\u03B7\u03C3\u03B7",
    addField: "\u03A0\u03C1\u03BF\u03C3\u03B8\u03AE\u03BA\u03B7 \u03B5\u03B9\u03C3\u03CC\u03B4\u03BF\u03C5",
    groups: "\u039F\u03BC\u03AC\u03B4\u03B5\u03C2",
    groupId: "ID \u03BF\u03BC\u03AC\u03B4\u03B1\u03C2",
    groupLabel: "\u03A4\u03AF\u03C4\u03BB\u03BF\u03C2 \u03BF\u03BC\u03AC\u03B4\u03B1\u03C2",
    addGroup: "\u03A0\u03C1\u03BF\u03C3\u03B8\u03AE\u03BA\u03B7 \u03BF\u03BC\u03AC\u03B4\u03B1\u03C2",
    items: "\u0391\u03BD\u03C4\u03B9\u03BA\u03B5\u03AF\u03BC\u03B5\u03BD\u03B1",
    bankLabel: "\u0395\u03C4\u03B9\u03BA\u03AD\u03C4\u03B1 \u03C4\u03C1\u03AC\u03C0\u03B5\u03B6\u03B1\u03C2 \u03B1\u03BD\u03C4\u03B9\u03BA\u03B5\u03B9\u03BC\u03AD\u03BD\u03C9\u03BD",
    itemId: "ID \u03B1\u03BD\u03C4\u03B9\u03BA\u03B5\u03B9\u03BC\u03AD\u03BD\u03BF\u03C5",
    itemLabel: "\u03A0\u03B5\u03C1\u03B9\u03B5\u03C7\u03CC\u03BC\u03B5\u03BD\u03BF \u03B1\u03BD\u03C4\u03B9\u03BA\u03B5\u03B9\u03BC\u03AD\u03BD\u03BF\u03C5",
    correctGroup: "\u03A3\u03C9\u03C3\u03C4\u03AE \u03BF\u03BC\u03AC\u03B4\u03B1",
    chooseGroup: "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03BF\u03BC\u03AC\u03B4\u03B1",
    addItem: "\u03A0\u03C1\u03BF\u03C3\u03B8\u03AE\u03BA\u03B7 \u03B1\u03BD\u03C4\u03B9\u03BA\u03B5\u03B9\u03BC\u03AD\u03BD\u03BF\u03C5",
    activityId: "ID \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
    initialTiles: "\u0391\u03C1\u03C7\u03B9\u03BA\u03AC \u03C0\u03BB\u03B1\u03BA\u03AF\u03B4\u03B9\u03B1 (\u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 JSON)",
    invalidTilesJson: "\u0395\u03B9\u03C3\u03B1\u03B3\u03AC\u03B3\u03B5\u03C4\u03B5 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1 JSON.",
    roomId: "ID \u03B1\u03AF\u03B8\u03BF\u03C5\u03C3\u03B1\u03C2",
    showStatus: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03BA\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7\u03C2 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7\u03C2",
    showLegend: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03C5\u03C0\u03BF\u03BC\u03BD\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2",
    showToolBar: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03B5\u03C1\u03B3\u03B1\u03BB\u03B5\u03B9\u03BF\u03B8\u03AE\u03BA\u03B7\u03C2",
    showAlgebraView: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03B1\u03BB\u03B3\u03B5\u03B2\u03C1\u03B9\u03BA\u03AE\u03C2 \u03C0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE\u03C2",
    showAlgebraInput: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03B1\u03BB\u03B3\u03B5\u03B2\u03C1\u03B9\u03BA\u03AE\u03C2 \u03B5\u03B9\u03C3\u03CC\u03B4\u03BF\u03C5",
    showMenuBar: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03B3\u03C1\u03B1\u03BC\u03BC\u03AE\u03C2 \u03BC\u03B5\u03BD\u03BF\u03CD",
    showResetIcon: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03BA\u03BF\u03C5\u03BC\u03C0\u03B9\u03BF\u03CD \u03B5\u03C0\u03B1\u03BD\u03B1\u03C6\u03BF\u03C1\u03AC\u03C2",
    showZoomButtons: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03BA\u03BF\u03C5\u03BC\u03C0\u03B9\u03CE\u03BD \u03BC\u03B5\u03B3\u03AD\u03B8\u03C5\u03BD\u03C3\u03B7\u03C2",
    showFullscreenButton: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03BA\u03BF\u03C5\u03BC\u03C0\u03B9\u03BF\u03CD \u03C0\u03BB\u03AE\u03C1\u03BF\u03C5\u03C2 \u03BF\u03B8\u03CC\u03BD\u03B7\u03C2",
    showSuggestionButtons: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03BA\u03BF\u03C5\u03BC\u03C0\u03B9\u03CE\u03BD \u03C0\u03C1\u03BF\u03C4\u03AC\u03C3\u03B5\u03C9\u03BD",
    widgets: "Widgets",
    addWidget: "\u03A0\u03C1\u03BF\u03C3\u03B8\u03AE\u03BA\u03B7 Widget",
    chooseWidget: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE Widget",
    cancel: "\u0391\u03BA\u03CD\u03C1\u03C9\u03C3\u03B7",
    widgetType: "\u0395\u03AF\u03B4\u03BF\u03C2 Widget",
    widgetLeft: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03AC",
    widgetRight: "\u0394\u03B5\u03BE\u03B9\u03AC",
    unknownWidget: "\u0386\u03B3\u03BD\u03C9\u03C3\u03C4\u03BF Widget",
    layoutPreview: "\u03A0\u03C1\u03BF\u03C3\u03C7\u03AD\u03B4\u03B9\u03BF \u03B4\u03B9\u03AC\u03C4\u03B1\u03BE\u03B7\u03C2 Resource",
    emptyWidgetSlot: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03B5\u03B9 \u03B1\u03BA\u03CC\u03BC\u03B7 widget \u03B5\u03B4\u03CE",
    widgetCount: "{{count}} \u03B1\u03C0\u03CC 3 widgets",
    widgetLimit: "\u039C\u03C0\u03BF\u03C1\u03B5\u03AF\u03C4\u03B5 \u03BD\u03B1 \u03C0\u03C1\u03BF\u03C3\u03B8\u03AD\u03C3\u03B5\u03C4\u03B5 \u03AD\u03C9\u03C2 \u03C4\u03C1\u03AF\u03B1 widgets, \u03AD\u03BD\u03B1 \u03C3\u03B5 \u03BA\u03AC\u03B8\u03B5 \u03B8\u03AD\u03C3\u03B7.",
    geoGebraPreview: "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 GeoGebra",
    moveToLeft: "\u039C\u03B5\u03C4\u03B1\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7 \u03B1\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03AC",
    moveToRight: "\u039C\u03B5\u03C4\u03B1\u03BA\u03AF\u03BD\u03B7\u03C3\u03B7 \u03B4\u03B5\u03BE\u03B9\u03AC",
    iconCode: "\u039A\u03C9\u03B4\u03B9\u03BA\u03CC\u03C2 Unicode (\u03B3\u03B9\u03B1 \u03C0\u03B1\u03C1\u03AC\u03B4\u03B5\u03B9\u03B3\u03BC\u03B1 U+1F600)",
    iconPreviewEmpty: "\u0394\u03CE\u03C3\u03C4\u03B5 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF \u03BA\u03C9\u03B4\u03B9\u03BA\u03CC Unicode \u03B3\u03B9\u03B1 \u03C0\u03C1\u03BF\u03B5\u03C0\u03B9\u03C3\u03BA\u03CC\u03C0\u03B7\u03C3\u03B7 \u03B5\u03B9\u03BA\u03BF\u03BD\u03B9\u03B4\u03AF\u03BF\u03C5",
    widgetNames: {
      icon: "\u0395\u03B9\u03BA\u03BF\u03BD\u03AF\u03B4\u03B9\u03BF",
      equation: "\u0395\u03BE\u03AF\u03C3\u03C9\u03C3\u03B7",
      graph: "\u0393\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u03C0\u03B1\u03C1\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7",
      mathPreview: "\u03A0\u03C1\u03BF\u03B5\u03C0\u03B9\u03C3\u03BA\u03CC\u03C0\u03B7\u03C3\u03B7 \u03BC\u03B1\u03B8\u03B7\u03BC\u03B1\u03C4\u03B9\u03BA\u03AE\u03C2 \u03AD\u03BA\u03C6\u03C1\u03B1\u03C3\u03B7\u03C2"
    },
    graphTitle: "\u03A4\u03AF\u03C4\u03BB\u03BF\u03C2 \u03B3\u03C1\u03B1\u03C6\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2",
    xMin: "\u0395\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03BF x",
    xMax: "\u039C\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF x",
    yMin: "\u0395\u03BB\u03AC\u03C7\u03B9\u03C3\u03C4\u03BF y",
    yMax: "\u039C\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF y",
    graphLines: "\u0395\u03C5\u03B8\u03B5\u03AF\u03B5\u03C2 (\u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 JSON: m, b, color, label)",
    graphElement: "\u03A3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03BF \u03B3\u03C1\u03B1\u03C6\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2",
    graphElementHint: "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03B1\u03BD \u03B8\u03B1 \u03C3\u03C7\u03B5\u03B4\u03B9\u03B1\u03C3\u03C4\u03B5\u03AF \u03C3\u03B7\u03BC\u03B5\u03AF\u03BF \u03AE \u03B3\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03AE \u03B5\u03BE\u03AF\u03C3\u03C9\u03C3\u03B7.",
    graphPoint: "\u03A3\u03B7\u03BC\u03B5\u03AF\u03BF",
    showCoordinates: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03C3\u03C5\u03BD\u03C4\u03B5\u03C4\u03B1\u03B3\u03BC\u03AD\u03BD\u03C9\u03BD",
    graphColor: "\u03A7\u03C1\u03CE\u03BC\u03B1",
    graphEquation: "\u0395\u03BE\u03AF\u03C3\u03C9\u03C3\u03B7",
    graphEquationHint: "\u0393\u03C1\u03AC\u03C8\u03C4\u03B5 \u03B3\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03AE \u03B5\u03BE\u03AF\u03C3\u03C9\u03C3\u03B7, \u03CC\u03C0\u03C9\u03C2 y = 2x + 1.",
    addGraphElement: "\u03A0\u03C1\u03BF\u03C3\u03B8\u03AE\u03BA\u03B7 \u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03BF\u03C5",
    showGrid: "\u0395\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7 \u03C0\u03BB\u03AD\u03B3\u03BC\u03B1\u03C4\u03BF\u03C2",
    invalidWidgetJson: "\u0395\u03B9\u03C3\u03B1\u03B3\u03AC\u03B3\u03B5\u03C4\u03B5 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1 JSON.",
    expression: "\u0388\u03BA\u03C6\u03C1\u03B1\u03C3\u03B7",
    expressionHint: "\u0393\u03C1\u03AC\u03C8\u03C4\u03B5 \u03AD\u03BA\u03C6\u03C1\u03B1\u03C3\u03B7 LaTeX \u03BC\u03B5 \u03AE \u03C7\u03C9\u03C1\u03AF\u03C2 \u03C3\u03CD\u03BC\u03B2\u03BF\u03BB\u03B1 \u03B4\u03BF\u03BB\u03B1\u03C1\u03AF\u03BF\u03C5.",
    expressionPreviewEmpty: "\u0397 \u03C0\u03C1\u03BF\u03B5\u03C0\u03B9\u03C3\u03BA\u03CC\u03C0\u03B7\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03B5\u03BE\u03AF\u03C3\u03C9\u03C3\u03B7\u03C2 \u03B8\u03B1 \u03B5\u03BC\u03C6\u03B1\u03BD\u03B9\u03C3\u03C4\u03B5\u03AF \u03B5\u03B4\u03CE",
    remove: "\u0391\u03C6\u03B1\u03AF\u03C1\u03B5\u03C3\u03B7",
    resources: {
      "buffon-needle": [
        {
          value: "round",
          label: "\u03A0\u03B5\u03AF\u03C1\u03B1\u03BC\u03B1 \u03B2\u03B5\u03BB\u03CC\u03BD\u03B1\u03C2 \u03C4\u03BF\u03C5 Buffon"
        }
      ],
      "neural-lab": [
        {
          value: "1",
          label: "1. \u0392\u03C1\u03AF\u03C3\u03BA\u03C9 \u03C4\u03B7\u03BD \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF"
        },
        {
          value: "2",
          label: "2. \u03A5\u03C0\u03BF\u03BB\u03BF\u03B3\u03AF\u03B6\u03C9 \u03C4\u03B7\u03BD \u03AD\u03BE\u03BF\u03B4\u03BF"
        },
        {
          value: "3",
          label: "3. \u03A0\u03C1\u03BF\u03C3\u03B1\u03C1\u03BC\u03CC\u03B6\u03C9 \u03C4\u03B1 \u03B2\u03AC\u03C1\u03B7"
        },
        {
          value: "4",
          label: "4. \u03A3\u03C5\u03B3\u03BA\u03C1\u03AF\u03BD\u03C9"
        }
      ],
      "primes-lab": [
        {
          value: "sieve",
          label: "\u039A\u03CC\u03C3\u03BA\u03B9\u03BD\u03BF \u03C4\u03BF\u03C5 \u0395\u03C1\u03B1\u03C4\u03BF\u03C3\u03B8\u03AD\u03BD\u03B7"
        },
        {
          value: "number-grid",
          label: "\u03A0\u03BB\u03AD\u03B3\u03BC\u03B1 \u03C0\u03C1\u03CE\u03C4\u03C9\u03BD \u03B1\u03C1\u03B9\u03B8\u03BC\u03CE\u03BD"
        }
      ],
      "polynomial-lab": [
        {
          value: "1.1",
          label: "1.1 \u0392\u03B1\u03C3\u03B9\u03BA\u03AD\u03C2 \u03AD\u03BD\u03BD\u03BF\u03B9\u03B5\u03C2 \u03BC\u03BF\u03BD\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD"
        },
        {
          value: "1.2",
          label: "1.2 \u0391\u03BD\u03B1\u03B3\u03BD\u03CE\u03C1\u03B9\u03C3\u03B7 \u03CC\u03BC\u03BF\u03B9\u03C9\u03BD \u03BC\u03BF\u03BD\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD"
        },
        {
          value: "1.3",
          label: "1.3 \u03A0\u03C1\u03AC\u03BE\u03B5\u03B9\u03C2 \u03BC\u03B5 \u03BC\u03BF\u03BD\u03CE\u03BD\u03C5\u03BC\u03B1"
        },
        {
          value: "1.4",
          label: "1.4 \u03A0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03B1\u03C3\u03B9\u03B1\u03C3\u03BC\u03CC\u03C2 \u03BC\u03BF\u03BD\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD"
        },
        {
          value: "2.1",
          label: "2.1 \u0392\u03B1\u03C3\u03B9\u03BA\u03AD\u03C2 \u03AD\u03BD\u03BD\u03BF\u03B9\u03B5\u03C2 \u03C0\u03BF\u03BB\u03C5\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD"
        },
        {
          value: "2.2",
          label: "2.2 \u0391\u03BD\u03B1\u03B3\u03C9\u03B3\u03AE \u03CC\u03BC\u03BF\u03B9\u03C9\u03BD \u03CC\u03C1\u03C9\u03BD"
        },
        {
          value: "2.3",
          label: "2.3 \u039F\u03BC\u03B1\u03B4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7 \u03CC\u03C1\u03C9\u03BD \u03C0\u03BF\u03BB\u03C5\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD"
        },
        {
          value: "2.4",
          label: "2.4 \u03A0\u03C1\u03CC\u03C3\u03B8\u03B5\u03C3\u03B7 \u03BA\u03B1\u03B9 \u03B1\u03C6\u03B1\u03AF\u03C1\u03B5\u03C3\u03B7 \u03C0\u03BF\u03BB\u03C5\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD"
        },
        {
          value: "2.5",
          label: "2.5 \u03A0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03B1\u03C3\u03B9\u03B1\u03C3\u03BC\u03CC\u03C2 \u03C0\u03BF\u03BB\u03C5\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD"
        },
        {
          value: "2.6",
          label: "2.6 \u03A0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03B1\u03C3\u03B9\u03B1\u03C3\u03BC\u03CC\u03C2 \u03BC\u03B5 \u03BC\u03BF\u03BD\u03C4\u03AD\u03BB\u03BF \u03B5\u03BC\u03B2\u03B1\u03B4\u03BF\u03CD"
        },
        {
          value: "2.7",
          label: "2.7 \u03A0\u03BB\u03B1\u03BA\u03AF\u03B4\u03B9\u03B1 \u03AC\u03BB\u03B3\u03B5\u03B2\u03C1\u03B1\u03C2"
        },
        {
          value: "2.8",
          label: "2.8 \u0392\u03B1\u03B8\u03BC\u03CC\u03C2 \u03B3\u03B9\u03BD\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD \u03C0\u03BF\u03BB\u03C5\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD"
        }
      ],
      "linear-systems-lab": [
        {
          value: "1",
          label: "1. \u0393\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u03B4\u03B7\u03BC\u03B9\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1 \u03C3\u03C5\u03C3\u03C4\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2"
        },
        {
          value: "2",
          label: "2. \u039C\u03AF\u03B1, \u03BA\u03B1\u03BC\u03AF\u03B1 \u03AE \u03AC\u03C0\u03B5\u03B9\u03C1\u03B5\u03C2 \u03BB\u03CD\u03C3\u03B5\u03B9\u03C2"
        },
        {
          value: "3",
          label: "3. \u0395\u03BD\u03C3\u03CE\u03BC\u03B1\u03C4\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1"
        },
        {
          value: "4",
          label: "4. \u0395\u03C0\u03AF\u03BB\u03C5\u03C3\u03B7 \u03BC\u03B5 \u03B1\u03C0\u03B1\u03BB\u03BF\u03B9\u03C6\u03AE"
        },
        {
          value: "5",
          label: "5. \u0395\u03C0\u03B1\u03BB\u03AE\u03B8\u03B5\u03C5\u03C3\u03B7 \u03BB\u03CD\u03C3\u03B7\u03C2 \u03C3\u03C4\u03BF \u03B3\u03C1\u03AC\u03C6\u03B7\u03BC\u03B1"
        },
        {
          value: "6",
          label: "6. \u0395\u03BD\u03C3\u03CE\u03BC\u03B1\u03C4\u03B7 \u03C4\u03B1\u03BE\u03B9\u03BD\u03CC\u03BC\u03B7\u03C3\u03B7 \u03B6\u03C9\u03BD\u03CE\u03BD"
        }
      ],
      "identities-lab": [
        {
          value: "1",
          label: "1. \u03A4\u03B5\u03C4\u03C1\u03AC\u03B3\u03C9\u03BD\u03BF \u03B1\u03B8\u03C1\u03BF\u03AF\u03C3\u03BC\u03B1\u03C4\u03BF\u03C2"
        },
        {
          value: "2",
          label: "2. \u03A4\u03B5\u03C4\u03C1\u03AC\u03B3\u03C9\u03BD\u03BF \u03B4\u03B9\u03B1\u03C6\u03BF\u03C1\u03AC\u03C2"
        },
        {
          value: "3",
          label: "3. \u0394\u03B9\u03B1\u03C6\u03BF\u03C1\u03AC \u03C4\u03B5\u03C4\u03C1\u03B1\u03B3\u03CE\u03BD\u03C9\u03BD"
        },
        {
          value: "4",
          label: "4. \u0395\u03BE\u03AC\u03C3\u03BA\u03B7\u03C3\u03B7"
        }
      ],
      "equations-lab": [
        {
          value: "1",
          label: "1. \u0395\u03C0\u03AF\u03BB\u03C5\u03C3\u03B7 \u03B1\u03C0\u03BB\u03CE\u03BD \u03B5\u03BE\u03B9\u03C3\u03CE\u03C3\u03B5\u03C9\u03BD"
        }
      ],
      "factorization-lab": [
        {
          value: "1",
          label: "1. \u03A0\u03B1\u03C1\u03B1\u03B3\u03BF\u03BD\u03C4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7 \u03C4\u03C1\u03B9\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD \u03BC\u03B5 \u03C0\u03BB\u03B1\u03BA\u03AF\u03B4\u03B9\u03B1"
        }
      ]
    },
    widgetPosition: "\u0398\u03AD\u03C3\u03B7 widget",
    previewLabel: "\u0395\u03C4\u03B9\u03BA\u03AD\u03C4\u03B1 \u03C0\u03C1\u03BF\u03B5\u03C0\u03B9\u03C3\u03BA\u03CC\u03C0\u03B7\u03C3\u03B7\u03C2",
    widgetPositions: {
      left: "\u0391\u03C1\u03B9\u03C3\u03C4\u03B5\u03C1\u03AC",
      right: "\u0394\u03B5\u03BE\u03B9\u03AC",
      bottom: "\u039A\u03AC\u03C4\u03C9"
    }
  },
  currentApp: "\u03A4\u03C1\u03AD\u03C7\u03BF\u03C5\u03C3\u03B1 \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AE: {{title}}",
  noSavedActivities: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B1\u03C0\u03BF\u03B8\u03B7\u03BA\u03B5\u03C5\u03BC\u03AD\u03BD\u03B5\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03B3\u03B9\u03B1 \u03B1\u03C5\u03C4\u03AE \u03C4\u03B7\u03BD \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AE.",
  preview: "\u03A0\u03C1\u03BF\u03B5\u03C0\u03B9\u03C3\u03BA\u03CC\u03C0\u03B7\u03C3\u03B7",
  appsTitle: "\u0395\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AD\u03C2",
  toolsTitle: "\u0395\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03B1",
  users: "\u03A7\u03C1\u03AE\u03C3\u03C4\u03B5\u03C2",
  labs: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03B1",
  messageTypes: "\u03A4\u03CD\u03C0\u03BF\u03B9 \u03BC\u03B7\u03BD\u03C5\u03BC\u03AC\u03C4\u03C9\u03BD",
  multiSelectHint: "Ctrl/\u2318 + \u03BA\u03BB\u03B9\u03BA \u03B3\u03B9\u03B1 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AD\u03C2 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2",
  messageCount: "{{count}} \u03BC\u03B7\u03BD\u03CD\u03BC\u03B1\u03C4\u03B1",
  incomingServer: "\u2192 \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE\u03C2",
  serverOutgoing: "\u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE\u03C2 \u2192",
  failedTestsRun: "\u0397 \u03B5\u03BA\u03C4\u03AD\u03BB\u03B5\u03C3\u03B7 \u03C4\u03C9\u03BD \u03B4\u03BF\u03BA\u03B9\u03BC\u03CE\u03BD \u03B1\u03C0\u03AD\u03C4\u03C5\u03C7\u03B5.",
  running: "\u0395\u03BA\u03C4\u03B5\u03BB\u03B5\u03AF\u03C4\u03B1\u03B9...",
  geoGebraMonitorIntro: "\u0394\u03B9\u03B1\u03C7\u03B5\u03B9\u03C1\u03B9\u03C3\u03C4\u03B5\u03AF\u03C4\u03B5 \u03C4\u03B9\u03C2 \u03C3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03B5\u03C2 \u03B1\u03AF\u03B8\u03BF\u03C5\u03C3\u03B5\u03C2, \u03C4\u03B7\u03BD \u03C0\u03C1\u03CC\u03C3\u03B2\u03B1\u03C3\u03B7 \u03C3\u03C4\u03B1 \u03B1\u03BD\u03C4\u03B9\u03BA\u03B5\u03AF\u03BC\u03B5\u03BD\u03B1, \u03C4\u03BF \u03C0\u03B5\u03C1\u03B9\u03B5\u03C7\u03CC\u03BC\u03B5\u03BD\u03BF \u03BA\u03B1\u03B9 \u03C4\u03B7 \u03B6\u03C9\u03BD\u03C4\u03B1\u03BD\u03AE \u03C1\u03BF\u03AE \u03B5\u03BD\u03B5\u03C1\u03B3\u03B5\u03B9\u03CE\u03BD.",
  notEnoughSeparationData: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B1\u03BA\u03CC\u03BC\u03B1 \u03B1\u03C1\u03BA\u03B5\u03C4\u03AC \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03B1.",
  noSeparator: "\u0394\u03B5\u03BD \u03B2\u03C1\u03AD\u03B8\u03B7\u03BA\u03B5 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03C4\u03AE\u03C2.",
  separator: "\u0392\u03C1\u03AD\u03B8\u03B7\u03BA\u03B5 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03C4\u03AE\u03C2.",
  minimumMaxW: "\u039C\u03B9\u03BA\u03C1\u03CC\u03C4\u03B5\u03C1\u03BF \u03BC\u03AD\u03B3\u03B9\u03C3\u03C4\u03BF |w|",
  currentAppLabel: "\u03A4\u03C1\u03AD\u03C7\u03BF\u03C5\u03C3\u03B1 \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AE: {{title}}",
  apps: {
    "buffon-needle": {
      title: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF Buffon",
      description: "\u03A3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C4\u03B9\u03BA\u03CC \u03C0\u03B5\u03AF\u03C1\u03B1\u03BC\u03B1 Buffon \u03BC\u03B5 \u03B3\u03CD\u03C1\u03BF\u03C5\u03C2 \u03BA\u03B1\u03B9 \u03C0\u03AF\u03BD\u03B1\u03BA\u03B5\u03C2 \u03B2\u03B1\u03B8\u03BC\u03BF\u03BB\u03BF\u03B3\u03AF\u03B1\u03C2."
    },
    "neural-lab": {
      title: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u039D\u03B5\u03C5\u03C1\u03C9\u03BD\u03B9\u03BA\u03CE\u03BD \u0394\u03B9\u03BA\u03C4\u03CD\u03C9\u03BD",
      description: "\u03A3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C4\u03B9\u03BA\u03AE \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 \u03BD\u03B5\u03C5\u03C1\u03C9\u03BD\u03B9\u03BA\u03BF\u03CD \u03B4\u03B9\u03BA\u03C4\u03CD\u03BF\u03C5 \u03BC\u03B5 \u03B6\u03C9\u03BD\u03C4\u03B1\u03BD\u03CC \u03C3\u03C5\u03B3\u03C7\u03C1\u03BF\u03BD\u03B9\u03C3\u03BC\u03CC \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD \u03BA\u03B1\u03B9 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD."
    },
    "primes-lab": {
      title: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03A0\u03C1\u03CE\u03C4\u03C9\u03BD \u0391\u03C1\u03B9\u03B8\u03BC\u03CE\u03BD",
      description: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 \u03BC\u03B5 \u03C4\u03BF \u03BA\u03CC\u03C3\u03BA\u03B9\u03BD\u03BF \u03C4\u03BF\u03C5 \u0395\u03C1\u03B1\u03C4\u03BF\u03C3\u03B8\u03AD\u03BD\u03B7, \u03B2\u03AE\u03BC\u03B1\u03C4\u03B1 \u03B5\u03BB\u03B5\u03B3\u03C7\u03CC\u03BC\u03B5\u03BD\u03B1 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC \u03BA\u03B1\u03B9 \u03BA\u03BF\u03B9\u03BD\u03CC \u03C0\u03BB\u03AD\u03B3\u03BC\u03B1 \u03B1\u03C1\u03B9\u03B8\u03BC\u03CE\u03BD."
    },
    "polynomial-lab": {
      title: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03A0\u03BF\u03BB\u03C5\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD",
      description: "\u03A3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C4\u03B9\u03BA\u03AE \u03B5\u03BE\u03AC\u03C3\u03BA\u03B7\u03C3\u03B7 \u03C3\u03C4\u03B1 \u03C0\u03BF\u03BB\u03C5\u03CE\u03BD\u03C5\u03BC\u03B1 \u03BC\u03B5 \u03BA\u03BF\u03B9\u03BD\u03AE \u03C0\u03B5\u03C1\u03B9\u03BF\u03C7\u03AE \u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1\u03C2 \u03BA\u03B1\u03B9 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03BA\u03B1\u03B8\u03BF\u03B4\u03B7\u03B3\u03BF\u03CD\u03BC\u03B5\u03BD\u03B5\u03C2 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC."
    },
    "linear-systems-lab": {
      title: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03A3\u03C5\u03C3\u03C4\u03B7\u03BC\u03AC\u03C4\u03C9\u03BD",
      description: "\u0393\u03C1\u03B1\u03C6\u03B9\u03BA\u03AE \u03BA\u03B1\u03B9 \u03B1\u03BB\u03B3\u03B5\u03B2\u03C1\u03B9\u03BA\u03AE \u03B5\u03C0\u03AF\u03BB\u03C5\u03C3\u03B7 \u03B3\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03CE\u03BD \u03C3\u03C5\u03C3\u03C4\u03B7\u03BC\u03AC\u03C4\u03C9\u03BD \u03BC\u03B5 \u03BA\u03BF\u03B9\u03BD\u03AC \u03C0\u03B5\u03C1\u03B9\u03B2\u03AC\u03BB\u03BB\u03BF\u03BD\u03C4\u03B1 GeoGebra."
    },
    "identities-lab": {
      title: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03A4\u03B1\u03C5\u03C4\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD",
      description: "\u0391\u03BB\u03B3\u03B5\u03B2\u03C1\u03B9\u03BA\u03AD\u03C2 \u03C4\u03B1\u03C5\u03C4\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03BC\u03B5 \u03B3\u03B5\u03C9\u03BC\u03B5\u03C4\u03C1\u03B9\u03BA\u03AD\u03C2 \u03B1\u03C0\u03BF\u03B4\u03B5\u03AF\u03BE\u03B5\u03B9\u03C2 \u03B3\u03B9\u03B1 \u03B2\u03B1\u03C3\u03B9\u03BA\u03AD\u03C2 \u03C4\u03B1\u03C5\u03C4\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2."
    },
    "equations-lab": {
      title: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u0395\u03BE\u03B9\u03C3\u03CE\u03C3\u03B5\u03C9\u03BD - \u0391\u03BD\u03B9\u03C3\u03CE\u03C3\u03B5\u03C9\u03BD",
      description: "\u0395\u03C0\u03AF\u03BB\u03C5\u03C3\u03B7 \u03B1\u03C0\u03BB\u03CE\u03BD \u03B5\u03BE\u03B9\u03C3\u03CE\u03C3\u03B5\u03C9\u03BD \u03BC\u03B5 \u03BA\u03BF\u03B9\u03BD\u03CC\u03C7\u03C1\u03B7\u03C3\u03C4\u03B1 \u03C0\u03BB\u03B1\u03BA\u03AF\u03B4\u03B9\u03B1 \u03AC\u03BB\u03B3\u03B5\u03B2\u03C1\u03B1\u03C2."
    },
    "factorization-lab": {
      title: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03A0\u03B1\u03C1\u03B1\u03B3\u03BF\u03BD\u03C4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7\u03C2",
      description: "\u03A0\u03B1\u03C1\u03B1\u03B3\u03BF\u03BD\u03C4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7 \u03C4\u03C1\u03B9\u03C9\u03BD\u03CD\u03BC\u03C9\u03BD \u03BC\u03B5 \u03C0\u03BB\u03B1\u03BA\u03AF\u03B4\u03B9\u03B1 \u03AC\u03BB\u03B3\u03B5\u03B2\u03C1\u03B1\u03C2."
    }
  },
  toolHelpers: {
    activityBuilder: "\u03A3\u03C7\u03B5\u03B4\u03B9\u03B1\u03C3\u03BC\u03CC\u03C2 \u03BC\u03B1\u03B8\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2 \u03BA\u03B1\u03B9 \u03B5\u03C0\u03B5\u03BE\u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1 JSON \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD.",
    cameraSpeedTest: "\u039C\u03AD\u03C4\u03C1\u03B7\u03C3\u03B7 \u03C7\u03C1\u03CC\u03BD\u03BF\u03C5 \u03BC\u03B5\u03C4\u03AC\u03B4\u03BF\u03C3\u03B7\u03C2 \u03BA\u03B1\u03C1\u03AD \u03B3\u03B9\u03B1 \u03C4\u03B7 \u03B4\u03B9\u03B1\u03B4\u03B9\u03BA\u03B1\u03C3\u03AF\u03B1 \u03B1\u03BD\u03AF\u03C7\u03BD\u03B5\u03C5\u03C3\u03B7\u03C2.",
    visionCollaboration: "\u039B\u03AE\u03C8\u03B7 \u03BA\u03AC\u03BC\u03B5\u03C1\u03B1\u03C2 \u03BC\u03B5 WebRTC, FastAPI/Python tracking \u03BA\u03B1\u03B9 \u03B5\u03C0\u03B9\u03BA\u03AC\u03BB\u03C5\u03C8\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD.",
    workshopJsonValidator: "Validator \u03BA\u03B1\u03BD\u03CC\u03BD\u03C9\u03BD \u03BA\u03B1\u03B9 schema \u03B3\u03B9\u03B1 \u03B1\u03C1\u03C7\u03B5\u03AF\u03B1 workshop JSON.",
    geoGebraCollaborative: "\u039A\u03BF\u03B9\u03BD\u03CC\u03C7\u03C1\u03B7\u03C3\u03C4\u03BF\u03C2 \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 GeoGebra \u03BC\u03B5 \u03B4\u03B9\u03BA\u03B1\u03B9\u03CE\u03BC\u03B1\u03C4\u03B1 \u03B1\u03BD\u03AC \u03C1\u03CC\u03BB\u03BF.",
    geoGebraMonitor: "\u039A\u03B5\u03BD\u03C4\u03C1\u03B9\u03BA\u03CC\u03C2 \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03C3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C4\u03B9\u03BA\u03CE\u03BD \u03B1\u03B9\u03B8\u03BF\u03C5\u03C3\u03CE\u03BD GeoGebra.",
    console: "\u0396\u03C9\u03BD\u03C4\u03B1\u03BD\u03AE \u03C0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE \u03BC\u03B7\u03BD\u03C5\u03BC\u03AC\u03C4\u03C9\u03BD \u03BC\u03B5\u03C4\u03B1\u03BE\u03CD \u03C7\u03C1\u03B7\u03C3\u03C4\u03CE\u03BD \u03BA\u03B1\u03B9 \u03B4\u03B9\u03B1\u03BA\u03BF\u03BC\u03B9\u03C3\u03C4\u03AE.",
    linearSeparation: "\u0394\u03B9\u03B1\u03B4\u03C1\u03B1\u03C3\u03C4\u03B9\u03BA\u03CC \u03B5\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03BF \u03B3\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03BF\u03CD \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03BF\u03CD \u03BC\u03B5 \u03C3\u03CD\u03BD\u03BF\u03BB\u03B1 \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD."
  },
  workshopJsonValidator: {
    title: "Validator JSON Workshop",
    lead: "\u039A\u03AC\u03BD\u03B5 \u03B5\u03C0\u03B9\u03BA\u03CC\u03BB\u03BB\u03B7\u03C3\u03B7 JSON activity, sequence \u03AE workshop \u03BA\u03B1\u03B9 \u03AD\u03BB\u03B5\u03B3\u03BE\u03AD \u03C4\u03BF \u03BC\u03B5 \u03B2\u03AC\u03C3\u03B7 \u03C4\u03B7\u03BD \u03BA\u03BF\u03B9\u03BD\u03AE \u03B3\u03BB\u03CE\u03C3\u03C3\u03B1 JSON.",
    fileInputLabel: "\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF\u03C5 JSON",
    dropHint: "\u0389 \u03C3\u03CD\u03C1\u03B5 \u03BA\u03B1\u03B9 \u03AC\u03C6\u03B7\u03C3\u03B5 \u03B5\u03B4\u03CE \u03AD\u03BD\u03B1 \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF .json.",
    fileLoaded: "\u03A6\u03BF\u03C1\u03C4\u03CE\u03B8\u03B7\u03BA\u03B5 \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF: {{filename}}",
    fileLoadError: "\u0394\u03B5\u03BD \u03AE\u03C4\u03B1\u03BD \u03B4\u03C5\u03BD\u03B1\u03C4\u03AE \u03B7 \u03B1\u03BD\u03AC\u03B3\u03BD\u03C9\u03C3\u03B7 \u03C4\u03BF\u03C5 \u03B5\u03C0\u03B9\u03BB\u03B5\u03B3\u03BC\u03AD\u03BD\u03BF\u03C5 \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF\u03C5.",
    invalidFileType: "\u0395\u03C0\u03AF\u03BB\u03B5\u03BE\u03B5 \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF .json.",
    inputLabel: "\u0388\u03B3\u03B3\u03C1\u03B1\u03C6\u03BF \u03BC\u03B1\u03B8\u03B7\u03C3\u03B9\u03B1\u03BA\u03BF\u03CD JSON",
    validateButton: "\u0388\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 JSON",
    validSummary: "\u039F \u03AD\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 \u03BF\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5 \u03B5\u03C0\u03B9\u03C4\u03C5\u03C7\u03CE\u03C2. \u03A4\u03BF \u03AD\u03B3\u03B3\u03C1\u03B1\u03C6\u03BF \u03B1\u03BA\u03BF\u03BB\u03BF\u03C5\u03B8\u03B5\u03AF \u03C4\u03B7\u03BD \u03BA\u03BF\u03B9\u03BD\u03AE \u03B3\u03BB\u03CE\u03C3\u03C3\u03B1 JSON.",
    invalidSummary: "\u039F \u03AD\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 \u03B1\u03C0\u03AD\u03C4\u03C5\u03C7\u03B5 \u03BC\u03B5 {{count}} \u03B8\u03AD\u03BC\u03B1(\u03C4\u03B1)."
  },
  studentConnection: "\u03A3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 (QR Code)",
  studentQrAlt: "\u039A\u03C9\u03B4\u03B9\u03BA\u03CC\u03C2 QR \u03B3\u03B9\u03B1 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD",
  workshops: {
    primes: {
      kicker: "\u039A\u03CC\u03C3\u03BA\u03B9\u03BD\u03BF \u03C4\u03BF\u03C5 \u0395\u03C1\u03B1\u03C4\u03BF\u03C3\u03B8\u03AD\u03BD\u03B7",
      title: "\u03A4\u03BF \u03BA\u03CC\u03C3\u03BA\u03B9\u03BD\u03BF \u03C4\u03BF\u03C5 \u0395\u03C1\u03B1\u03C4\u03BF\u03C3\u03B8\u03AD\u03BD\u03B7",
      subtitle: "\u0391\u03C0\u03CC \u03C4\u03BF 2 \u03AD\u03C9\u03C2 \u03C4\u03BF 100, \u03B1\u03BD\u03B1\u03BA\u03AC\u03BB\u03C5\u03C8\u03B5 \u03C0\u03BF\u03B9\u03BF\u03B9 \u03B1\u03C1\u03B9\u03B8\u03BC\u03BF\u03AF \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03B1 \u03BA\u03B1\u03B9 \u03C0\u03BF\u03B9\u03BF\u03B9 \u03BC\u03AD\u03BD\u03BF\u03C5\u03BD \u03C9\u03C2 \u03C0\u03C1\u03CE\u03C4\u03BF\u03B9.",
      connectedTeacher: "\u03A3\u03B5 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7",
      connectedStudent: "\u03A3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF\u03C2",
      disconnected: "\u0395\u03BA\u03C4\u03CC\u03C2 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7\u03C2",
      namePrefix: "\u03CC\u03BD\u03BF\u03BC\u03B1 \u03C7\u03C1\u03AE\u03C3\u03C4\u03B7",
      board: "\u039A\u03B5\u03BD\u03C4\u03C1\u03B9\u03BA\u03CC \u03C0\u03AC\u03BD\u03B5\u03BB",
      range: "\u0391\u03C1\u03B9\u03B8\u03BC\u03BF\u03AF 2 \u03AD\u03C9\u03C2 100",
      locked: "\u03BA\u03BB\u03B5\u03B9\u03B4\u03C9\u03BC\u03AD\u03BD\u03BF\u03C2",
      prime: "\u03C0\u03C1\u03CE\u03C4\u03BF\u03C2",
      remaining: "\u03A4\u03B9 \u03B1\u03C0\u03BF\u03BC\u03AD\u03BD\u03B5\u03B9",
      remainingDescription: "\u0391\u03C0\u03CC \u03C4\u03BF\u03C5\u03C2 \u03B1\u03C1\u03B9\u03B8\u03BC\u03BF\u03CD\u03C2 \u03C0\u03BF\u03C5 \u03B4\u03B5\u03BD \u03AD\u03C7\u03BF\u03C5\u03BD \u03BA\u03BB\u03B5\u03B9\u03B4\u03C9\u03B8\u03B5\u03AF, \u03BC\u03AD\u03BD\u03BF\u03C5\u03BD {{remaining}} \u03BA\u03B1\u03B9 \u03B1\u03C0\u03CC \u03B1\u03C5\u03C4\u03BF\u03CD\u03C2 {{primes}} \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C0\u03C1\u03CE\u03C4\u03BF\u03B9.",
      waitingMultiples: "\u03A0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03B1 \u03C0\u03BF\u03C5 \u03C0\u03B5\u03C1\u03B9\u03BC\u03AD\u03BD\u03BF\u03C5\u03BD",
      completedSteps: "\u039F\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03C9\u03BC\u03AD\u03BD\u03B1 \u03B2\u03AE\u03BC\u03B1\u03C4\u03B1",
      activeStudent: "\u03A4\u03C1\u03AD\u03C7\u03C9\u03BD \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
      student: "\u03BC\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
      anotherStudent: "\u03AC\u03BB\u03BB\u03BF\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
      messages: {
        chooseBase: "\u0394\u03B9\u03AC\u03BB\u03B5\u03BE\u03B5 \u03BC\u03B9\u03B1 \u03B2\u03AC\u03C3\u03B7 \u03BA\u03B1\u03B9 \u03BE\u03B5\u03BA\u03AF\u03BD\u03B1 \u03C4\u03BF \u03BA\u03CC\u03C3\u03BA\u03B9\u03BD\u03BF.",
        selectedBase: "\u03A4\u03CE\u03C1\u03B1 \u03B4\u03BF\u03C5\u03BB\u03B5\u03CD\u03BF\u03C5\u03BC\u03B5 \u03BC\u03B5 \u03C4\u03B7 \u03B2\u03AC\u03C3\u03B7 {{prime}}. \u03A4\u03B1 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03AC \u03C4\u03B7\u03C2 \u03C6\u03C9\u03C4\u03AF\u03B6\u03BF\u03BD\u03C4\u03B1\u03B9 \u03C3\u03C4\u03BF\u03BD \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1.",
        baseIsNotMultiple: "\u039F {{number}} \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B7 \u03B2\u03AC\u03C3\u03B7 \u03C4\u03BF\u03C5 \u03B2\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2, \u03CC\u03C7\u03B9 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03BF.",
        alreadyClaimedBy: "\u03A4\u03BF {{number}} \u03AD\u03C7\u03B5\u03B9 \u03AE\u03B4\u03B7 \u03BA\u03BB\u03B5\u03B9\u03B4\u03C9\u03B8\u03B5\u03AF \u03C3\u03C9\u03C3\u03C4\u03AC \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD/\u03C4\u03B7\u03BD {{name}}.",
        claimedBySelf: "\u03A4\u03BF {{number}} \u03AD\u03C7\u03B5\u03B9 \u03AE\u03B4\u03B7 \u03BA\u03BB\u03B5\u03B9\u03B4\u03C9\u03B8\u03B5\u03AF \u03C3\u03C9\u03C3\u03C4\u03AC \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD/\u03C4\u03B7\u03BD {{name}}.",
        correctSelection: "\u039F/\u0397 {{name}} \u03BA\u03BB\u03B5\u03AF\u03B4\u03C9\u03C3\u03B5 \u03C3\u03C9\u03C3\u03C4\u03AC \u03C4\u03BF {{number}}.",
        wrongSelection: "\u039F/\u0397 {{name}} \u03C3\u03B7\u03BC\u03B5\u03AF\u03C9\u03C3\u03B5 \u03C4\u03BF {{number}} \u03C9\u03C2 \u03BB\u03AC\u03B8\u03BF\u03C2 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE."
      },
      grid: {
        ariaLabel: "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03B1\u03C1\u03B9\u03B8\u03BC\u03CE\u03BD \u03B1\u03C0\u03CC \u03C4\u03BF 2 \u03AD\u03C9\u03C2 \u03C4\u03BF 100",
        lockedBy: "{{number}} \u03AD\u03C7\u03B5\u03B9 \u03BA\u03BB\u03B5\u03B9\u03B4\u03C9\u03B8\u03B5\u03AF \u03B1\u03C0\u03CC {{owner}}",
        lockedByOther: "{{number}} \u03AD\u03C7\u03B5\u03B9 \u03AE\u03B4\u03B7 \u03BA\u03BB\u03B5\u03B9\u03B4\u03C9\u03B8\u03B5\u03AF \u03B1\u03C0\u03CC \u03AC\u03BB\u03BB\u03BF\u03BD \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE",
        multipleOf: "{{number}} \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03BF \u03C4\u03BF\u03C5 {{prime}}",
        number: "\u0391\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 {{number}}"
      },
      summary: {
        title: "\u03A3\u03C5\u03BD\u03BF\u03BB\u03B9\u03BA\u03AE \u03B5\u03B9\u03BA\u03CC\u03BD\u03B1",
        subtitle: "\u03A0\u03BF\u03B9\u03BF\u03B9 \u03B1\u03C1\u03B9\u03B8\u03BC\u03BF\u03AF \u03AD\u03C7\u03BF\u03C5\u03BD \u03B2\u03C1\u03B5\u03B8\u03B5\u03AF \u03B3\u03B9\u03B1 \u03C4\u03BF {{prime}}",
        correct: "\u03A3\u03C9\u03C3\u03C4\u03AC \u03BA\u03BB\u03B5\u03B9\u03B4\u03C9\u03BC\u03AD\u03BD\u03B1",
        wrong: "\u039B\u03AC\u03B8\u03BF\u03C2 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2",
        open: "\u0391\u03BD\u03BF\u03B9\u03C7\u03C4\u03BF\u03AF \u03C3\u03C4\u03CC\u03C7\u03BF\u03B9",
        stepTargets: "\u03A3\u03C4\u03CC\u03C7\u03BF\u03B9 \u03C4\u03BF\u03C5 \u03B2\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2",
        allFound: "\u038C\u03BB\u03B1 \u03AD\u03C7\u03BF\u03C5\u03BD \u03B2\u03C1\u03B5\u03B8\u03B5\u03AF"
      },
      table: {
        eyebrow: "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD",
        title: "\u03A4\u03B9 \u03AD\u03C7\u03BF\u03C5\u03BD \u03B5\u03C0\u03B9\u03BB\u03AD\u03BE\u03B5\u03B9 \u03BF\u03B9 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2",
        base: "\u0392\u03AC\u03C3\u03B7",
        student: "\u039C\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
        color: "\u03A7\u03C1\u03CE\u03BC\u03B1",
        correct: "\u03A3\u03C9\u03C3\u03C4\u03AC \u03BA\u03BB\u03B5\u03B9\u03B4\u03C9\u03BC\u03AD\u03BD\u03B1",
        wrong: "\u039B\u03AC\u03B8\u03BF\u03C2 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2",
        status: "\u039A\u03B1\u03C4\u03AC\u03C3\u03C4\u03B1\u03C3\u03B7",
        activeNow: "\u0395\u03BD\u03B5\u03C1\u03B3\u03CC\u03C2 \u03C4\u03CE\u03C1\u03B1",
        viewing: "\u03A0\u03B1\u03C1\u03B1\u03BA\u03BF\u03BB\u03BF\u03CD\u03B8\u03B7\u03C3\u03B7"
      },
      teacher: {
        stepTitle: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE \u03B2\u03AE\u03BC\u03B1\u03C4\u03BF\u03C2",
        stepSubtitle: "\u039F \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2 \u03BF\u03C1\u03AF\u03B6\u03B5\u03B9 \u03C0\u03BF\u03B9\u03BF \u03BA\u03CC\u03C3\u03BA\u03B9\u03BD\u03BF \u03C4\u03C1\u03AD\u03C7\u03B5\u03B9 \u03C4\u03CE\u03C1\u03B1",
        activeTitle: "\u03A0\u03BF\u03B9\u03BF\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2 \u03C0\u03B1\u03C4\u03AC \u03C4\u03CE\u03C1\u03B1",
        activeSubtitle: "\u03A7\u03C1\u03AE\u03C3\u03B9\u03BC\u03BF \u03B3\u03B9\u03B1 \u03C4\u03B7\u03BD \u03C0\u03C1\u03BF\u03C3\u03BF\u03BC\u03BF\u03AF\u03C9\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03C4\u03AC\u03BE\u03B7\u03C2",
        activeLabel: "\u0395\u03BD\u03B5\u03C1\u03B3\u03CC\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2:",
        ruleTitle: "\u03A4\u03C1\u03AD\u03C7\u03C9\u03BD \u03BA\u03B1\u03BD\u03CC\u03BD\u03B1\u03C2",
        ruleSubtitle: "\u0395\u03C0\u03B9\u03BB\u03AD\u03B3\u03BF\u03BD\u03C4\u03B1\u03B9 \u03C4\u03B1 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03B1 \u03C4\u03BF\u03C5 {{prime}}",
        ruleText: "\u0395\u03C0\u03B9\u03BB\u03AD\u03B3\u03BF\u03C5\u03BC\u03B5 \u03CC\u03BB\u03B1 \u03C4\u03B1 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03B1 \u03C4\u03BF\u03C5 {{prime}} \u03C0\u03BF\u03C5 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03BC\u03B5\u03B3\u03B1\u03BB\u03CD\u03C4\u03B5\u03C1\u03B1 \u03B1\u03C0\u03CC \u03C4\u03BF \u03AF\u03B4\u03B9\u03BF \u03C4\u03BF {{prime}}.",
        ruleTeacher: "\u039F \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2 \u03B1\u03BB\u03BB\u03AC\u03B6\u03B5\u03B9 \u03BC\u03CC\u03BD\u03BF \u03C4\u03B7 \u03B2\u03AC\u03C3\u03B7.",
        ruleStudents: "\u039F\u03B9 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2 \u03B5\u03C0\u03B9\u03BB\u03AD\u03B3\u03BF\u03C5\u03BD \u03C3\u03C9\u03C3\u03C4\u03AC \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03B1 \u03C7\u03C9\u03C1\u03AF\u03C2 \u03BD\u03B1 \u03C4\u03B1 \u03BA\u03BB\u03AD\u03B2\u03BF\u03C5\u03BD \u03BF\u03B9 \u03AC\u03BB\u03BB\u03BF\u03B9.",
        ruleLocked: "\u038C,\u03C4\u03B9 \u03BA\u03BB\u03B5\u03B9\u03B4\u03CE\u03BD\u03B5\u03C4\u03B1\u03B9 \u03C3\u03C9\u03C3\u03C4\u03AC \u03BC\u03AD\u03BD\u03B5\u03B9 \u03AD\u03BE\u03C9 \u03B1\u03C0\u03CC \u03C4\u03BF \u03C0\u03B1\u03B9\u03C7\u03BD\u03AF\u03B4\u03B9.",
        goalTitle: "\u0394\u03B9\u03B4\u03B1\u03BA\u03C4\u03B9\u03BA\u03CC\u03C2 \u03C3\u03C4\u03CC\u03C7\u03BF\u03C2",
        goalSubtitle: "\u03A0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03B1, \u03C0\u03C1\u03CE\u03C4\u03BF\u03B9 \u03BA\u03B1\u03B9 \u03C3\u03CD\u03BD\u03B8\u03B5\u03C4\u03BF\u03B9",
        goalCorrect: "\u039F\u03B9 \u03C3\u03C9\u03C3\u03C4\u03AD\u03C2 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2 \u03B1\u03C0\u03BF\u03B4\u03AF\u03B4\u03BF\u03BD\u03C4\u03B1\u03B9 \u03C3\u03B5 \u03C3\u03C5\u03B3\u03BA\u03B5\u03BA\u03C1\u03B9\u03BC\u03AD\u03BD\u03BF \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE \u03BA\u03B1\u03B9 \u03B4\u03B5\u03BD \u03B5\u03C0\u03B1\u03BD\u03B1\u03BB\u03B1\u03BC\u03B2\u03AC\u03BD\u03BF\u03BD\u03C4\u03B1\u03B9 \u03B1\u03C0\u03CC \u03AC\u03BB\u03BB\u03BF\u03C5\u03C2.",
        goalWrong: "\u039F\u03B9 \u03BB\u03AC\u03B8\u03BF\u03C2 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2 \u03BA\u03B1\u03C4\u03B1\u03B3\u03C1\u03AC\u03C6\u03BF\u03BD\u03C4\u03B1\u03B9 \u03BE\u03B5\u03C7\u03C9\u03C1\u03B9\u03C3\u03C4\u03AC \u03B3\u03B9\u03B1 \u03BD\u03B1 \u03C6\u03B1\u03AF\u03BD\u03B5\u03C4\u03B1\u03B9 \u03B7 \u03C3\u03C4\u03C1\u03B1\u03C4\u03B7\u03B3\u03B9\u03BA\u03AE \u03BA\u03AC\u03B8\u03B5 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE.",
        goalProgress: "\u0397 \u03C4\u03AC\u03BE\u03B7 \u03C0\u03C1\u03BF\u03C7\u03C9\u03C1\u03AC \u03B1\u03C0\u03CC \u03C4\u03BF 2, \u03C3\u03C4\u03BF 3, \u03C3\u03C4\u03BF 5 \u03BA.\u03BF.\u03BA. \u03BC\u03AD\u03C7\u03C1\u03B9 \u03BD\u03B1 \u03B1\u03C0\u03BF\u03BC\u03B5\u03AF\u03BD\u03BF\u03C5\u03BD \u03BF\u03B9 \u03C0\u03C1\u03CE\u03C4\u03BF\u03B9 \u03B1\u03C1\u03B9\u03B8\u03BC\u03BF\u03AF."
      }
    },
    neural: {
      title: "Neural Lab",
      homeTitle: "\u0395\u03BD\u03B9\u03B1\u03AF\u03B1 React \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AE",
      homeSubtitle: "\u03A0\u03B5\u03C1\u03B9\u03B2\u03AC\u03BB\u03BB\u03BF\u03BD\u03C4\u03B1 \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD \u03BA\u03B1\u03B9 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE \u03BC\u03B5 \u03BA\u03BF\u03B9\u03BD\u03AE \u03B3\u03BB\u03CE\u03C3\u03C3\u03B1 \u03BA\u03B1\u03B9 \u03BA\u03BF\u03B9\u03BD\u03AC \u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1.",
      openTeacher: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03BD\u03B5\u03C5\u03C1\u03C9\u03BD\u03B9\u03BA\u03CE\u03BD \u03B4\u03B9\u03BA\u03C4\u03CD\u03C9\u03BD \u2014 \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2",
      openStudent: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03BD\u03B5\u03C5\u03C1\u03C9\u03BD\u03B9\u03BA\u03CE\u03BD \u03B4\u03B9\u03BA\u03C4\u03CD\u03C9\u03BD \u2014 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
      openBuffonTeacher: "\u0392\u03B5\u03BB\u03CC\u03BD\u03B1 \u03C4\u03BF\u03C5 Buffon \u2014 \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2",
      openBuffonStudent: "\u0392\u03B5\u03BB\u03CC\u03BD\u03B1 \u03C4\u03BF\u03C5 Buffon \u2014 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
      dashboardTitle: "Neural Lab",
      activitiesTitle: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
      chooseActivity: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2",
      activity1: "1. \u0392\u03C1\u03AF\u03C3\u03BA\u03C9 \u03C4\u03B7\u03BD \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF",
      activity2: "2. \u03A5\u03C0\u03BF\u03BB\u03BF\u03B3\u03AF\u03B6\u03C9 \u03C4\u03B7\u03BD \u03AD\u03BE\u03BF\u03B4\u03BF",
      activity3: "3. \u03A0\u03C1\u03BF\u03C3\u03B1\u03C1\u03BC\u03CC\u03B6\u03C9 \u03C4\u03B1 \u03B2\u03AC\u03C1\u03B7",
      activity4: "4. \u03A3\u03C5\u03B3\u03BA\u03C1\u03AF\u03BD\u03C9",
      datasetsTitle: "\u0394\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03B1",
      chooseDataset: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03C9\u03BD",
      chooseExample: "\u03A0\u03B1\u03C1\u03AC\u03B4\u03B5\u03B9\u03B3\u03BC\u03B1",
      activeInputs: "\u0395\u03BD\u03B5\u03C1\u03B3\u03AC inputs",
      separation: "\u0394\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03CC\u03C2",
      notSeparable: "\u039C\u03B7 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03AF\u03C3\u03B9\u03BC\u03BF",
      separator: "\u0394\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03CC\u03C2",
      noData: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03B1 \u03B3\u03B9\u03B1 \u03C4\u03BF \u03B5\u03C0\u03B9\u03BB\u03B5\u03B3\u03BC\u03AD\u03BD\u03BF dataset",
      examplesClassifier: "\u03A4\u03B1\u03BE\u03B9\u03BD\u03CC\u03BC\u03B7\u03C3\u03B7 \u03A0\u03B1\u03C1\u03B1\u03B4\u03B5\u03B9\u03B3\u03BC\u03AC\u03C4\u03C9\u03BD",
      result: "\u0391\u03C0\u03BF\u03C4\u03AD\u03BB\u03B5\u03C3\u03BC\u03B1",
      confusionMatrix: "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03C3\u03CD\u03B3\u03C7\u03C5\u03C3\u03B7\u03C2",
      actualClass: "\u03A0\u03C1\u03B1\u03B3\u03BC\u03B1\u03C4\u03B9\u03BA\u03AE \u03BA\u03BB\u03AC\u03C3\u03B7",
      prediction: "\u03A0\u03C1\u03CC\u03B2\u03BB\u03B5\u03C8\u03B7",
      positive: "\u0398\u03B5\u03C4\u03B9\u03BA\u03CC",
      negative: "\u0391\u03C1\u03BD\u03B7\u03C4\u03B9\u03BA\u03CC",
      currentWeights: "\u03A4\u03C1\u03AD\u03C7\u03BF\u03BD\u03C4\u03B1 \u03B2\u03AC\u03C1\u03B7",
      selectAll: "\u0395\u03C0\u03AF\u03BB\u03B5\u03BE\u03B5 \u03CC\u03BB\u03B1",
      selectNone: "\u039A\u03B1\u03BC\u03AF\u03B1 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE",
      studentConnection: "\u03A3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD",
      selectPrompt: "-- \u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 --",
      thresholdInfo: " (\u038C\u03C1\u03B9\u03BF: {{op}} {{boundary}})",
      notSeparableInfo: " (\u039C\u03B7 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03AF\u03C3\u03B9\u03BC\u03BF)",
      positiveStatus: "\u2705 \u0398\u03B5\u03C4\u03B9\u03BA\u03CC",
      negativeStatus: "\u274C \u0391\u03C1\u03BD\u03B7\u03C4\u03B9\u03BA\u03CC",
      operationTree: "\u0394\u03AD\u03BD\u03C4\u03C1\u03BF \u03C0\u03C1\u03AC\u03BE\u03B5\u03C9\u03BD",
      classroomView: "\u03A0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE \u03C4\u03AC\u03BE\u03B7\u03C2",
      studentTableTitle: "\u03A0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD",
      noStudents: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2.",
      studentName: "\u039C\u03B1\u03B8\u03B7\u03C4\u03AE\u03C2",
      inputOne: "\u0395\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2 1",
      inputTwo: "\u0395\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2 2",
      belowThreshold: "\u039F\u03C7\u03B9",
      datasetLabels: {
        vehicles: "\u039C\u03AD\u03C3\u03B1 \u03BC\u03B5\u03C4\u03B1\u03C6\u03BF\u03C1\u03AC\u03C2",
        digits: "\u03A8\u03B7\u03C6\u03AF\u03B1"
      },
      featureLabels: {
        vehicles: {
          i1: "\u03A4\u03C1\u03BF\u03C7\u03BF\u03AF",
          i2: "\u039C\u03B7\u03C7\u03B1\u03BD\u03AE"
        },
        digits: {
          i1: "\u039A\u03CD\u03BA\u03BB\u03BF\u03B9",
          i2: "\u03A3\u03C4\u03B1\u03C5\u03C1\u03BF\u03B4\u03C1\u03CC\u03BC\u03B9\u03B1"
        }
      },
      exampleLabels: {
        vehicles: {
          "0": "\u03A0\u03BF\u03B4\u03AE\u03BB\u03B1\u03C4\u03BF",
          "1": "\u039C\u03BF\u03C4\u03BF\u03C3\u03C5\u03BA\u03BB\u03AD\u03C4\u03B1",
          "2": "\u0391\u03C5\u03C4\u03BF\u03BA\u03AF\u03BD\u03B7\u03C4\u03BF",
          "3": "\u03A0\u03B1\u03C4\u03AF\u03BD\u03B9"
        },
        digits: {
          "0": "\u039C\u03B7\u03B4\u03AD\u03BD",
          "1": "\u0388\u03BD\u03B1",
          "2": "\u03A4\u03AD\u03C3\u03C3\u03B5\u03C1\u03B1",
          "3": "\u0388\u03BE\u03B9",
          "4": "\u039F\u03BA\u03C4\u03CE"
        }
      },
      notSelected: "\u039C\u03B7 \u03B5\u03C0\u03B9\u03BB\u03B5\u03B3\u03BC\u03AD\u03BD\u03BF"
    },
    buffon: {
      title: "Buffon Needle",
      teacherTitle: "\u0397 \u03B2\u03B5\u03BB\u03CC\u03BD\u03B1 \u03C4\u03BF\u03C5 Buffon",
      studentTitle: "\u0397 \u03B2\u03B5\u03BB\u03CC\u03BD\u03B1 \u03C4\u03BF\u03C5 Buffon",
      student: {
        waiting: "\u03A0\u03B5\u03C1\u03B9\u03BC\u03AD\u03BD\u03B5\u03C4\u03B5 \u03C4\u03B7\u03BD \u03AD\u03BD\u03B1\u03C1\u03BE\u03B7.",
        needleLength: "\u039C\u03AE\u03BA\u03BF\u03C2 \u03B2\u03B5\u03BB\u03CC\u03BD\u03B1\u03C2",
        lineSpacing: "\u0391\u03C0\u03CC\u03C3\u03C4\u03B1\u03C3\u03B7 \u03B3\u03C1\u03B1\u03BC\u03BC\u03CE\u03BD",
        hit: "\u03A4\u03BF\u03BC\u03AE",
        miss: "\u03A7\u03C9\u03C1\u03AF\u03C2 \u03C4\u03BF\u03BC\u03AE",
        stepLabel: "\u0392\u03B5\u03BB\u03CC\u03BD\u03B5\u03C2 \u03B1\u03BD\u03AC \u03B2\u03AE\u03BC\u03B1",
        stepButton: "+{{count}} \u03C1\u03AF\u03C8\u03B5\u03B9\u03C2",
        automatic: "\u0391\u03C5\u03C4\u03CC\u03BC\u03B1\u03C4\u03BF",
        reset: "\u0395\u03C0\u03B1\u03BD\u03B1\u03C6\u03BF\u03C1\u03AC",
        estimateError: "\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1",
        formula: "\u03A4\u03CD\u03C0\u03BF\u03C2",
        chart: "\u03A3\u03CD\u03B3\u03BA\u03BB\u03B9\u03C3\u03B7 \u03C0\u03C1\u03BF\u03C2 \u03C0",
        connected: "\u03A3\u03C5\u03BD\u03B4\u03B5\u03B8\u03AE\u03BA\u03B1\u03C4\u03B5. \u03A0\u03B5\u03C1\u03B9\u03BC\u03AD\u03BD\u03B5\u03C4\u03B5 \u03C4\u03BF\u03BD \u03BA\u03B1\u03B8\u03B7\u03B3\u03B7\u03C4\u03AE.",
        disconnected: "\u0397 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 \u03BC\u03B5 \u03C4\u03BF\u03BD server \u03B4\u03B9\u03B1\u03BA\u03CC\u03C0\u03B7\u03BA\u03B5.",
        freeExperiment: "\u0395\u03BB\u03B5\u03CD\u03B8\u03B5\u03C1\u03BF\u03C2 \u03C0\u03B5\u03B9\u03C1\u03B1\u03BC\u03B1\u03C4\u03B9\u03C3\u03BC\u03CC\u03C2. \u0397 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 \u03B3\u03AF\u03BD\u03B5\u03C4\u03B1\u03B9 \u03B1\u03C5\u03C4\u03CC\u03BC\u03B1\u03C4\u03B1.",
        roundBanner: "\u0393\u03CD\u03C1\u03BF\u03C2 {{round}}: \u03C3\u03C4\u03CC\u03C7\u03BF\u03C2 \u03C3\u03C6\u03AC\u03BB\u03BC\u03B1\u03C4\u03BF\u03C2 <= {{target}} | \u03B1\u03C0\u03BF\u03BC\u03AD\u03BD\u03BF\u03C5\u03BD {{seconds}} \u03B4\u03B5\u03C5\u03C4.",
        roundEnd: "\u039F \u03B3\u03CD\u03C1\u03BF\u03C2 \u03BF\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5.",
        targetReached: "\u0395\u03C0\u03B9\u03C4\u03B5\u03CD\u03C7\u03B8\u03B7\u03BA\u03B5 \u03BF \u03C3\u03C4\u03CC\u03C7\u03BF\u03C2 \u03C3\u03C6\u03AC\u03BB\u03BC\u03B1\u03C4\u03BF\u03C2.",
        manualStop: "\u039F \u03BA\u03B1\u03B8\u03B7\u03B3\u03B7\u03C4\u03AE\u03C2 \u03C3\u03C4\u03B1\u03BC\u03AC\u03C4\u03B7\u03C3\u03B5 \u03C4\u03BF\u03BD \u03B3\u03CD\u03C1\u03BF.",
        winner: "\u039D\u03B9\u03BA\u03AE\u03C4\u03C1\u03B9\u03B1 \u03BF\u03BC\u03AC\u03B4\u03B1: {{team}}.",
        podium: "\u039A\u03B1\u03C4\u03AC\u03C4\u03B1\u03BE\u03B7: {{ranking}}.",
        tournamentReset: "\u039F\u03B9 \u03B2\u03B1\u03B8\u03BC\u03BF\u03AF \u03BC\u03B7\u03B4\u03B5\u03BD\u03AF\u03C3\u03C4\u03B7\u03BA\u03B1\u03BD. \u03A0\u03B5\u03C1\u03B9\u03BC\u03AD\u03BD\u03B5\u03C4\u03B5 \u03BD\u03AD\u03BF \u03B3\u03CD\u03C1\u03BF.",
        connecting: "\u03A3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 \u03BC\u03B5 \u03C4\u03BF\u03BD server..."
      },
      teacherConnected: "\u03A3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF\u03C2.",
      roundStartedInfo: "\u0393\u03CD\u03C1\u03BF\u03C2 {{round}} | \u03C3\u03C4\u03CC\u03C7\u03BF\u03C2 \u03C3\u03C6\u03AC\u03BB\u03BC\u03B1\u03C4\u03BF\u03C2 {{target}}",
      roundStarted: "\u039E\u03B5\u03BA\u03AF\u03BD\u03B7\u03C3\u03B5 \u03BF \u03B3\u03CD\u03C1\u03BF\u03C2 {{round}}.",
      roundCompletedInfo: "\u039F \u03B3\u03CD\u03C1\u03BF\u03C2 {{round}} \u03BF\u03BB\u03BF\u03BA\u03BB\u03B7\u03C1\u03CE\u03B8\u03B7\u03BA\u03B5",
      scoresReset: "\u039F\u03B9 \u03C0\u03CC\u03BD\u03C4\u03BF\u03B9 \u03BC\u03B7\u03B4\u03B5\u03BD\u03AF\u03C3\u03C4\u03B7\u03BA\u03B1\u03BD.",
      tournamentReset: "\u0397 \u03B2\u03B1\u03B8\u03BC\u03BF\u03BB\u03BF\u03B3\u03AF\u03B1 \u03BC\u03B7\u03B4\u03B5\u03BD\u03AF\u03C3\u03C4\u03B7\u03BA\u03B5. \u039E\u03B5\u03BA\u03B9\u03BD\u03AE\u03C3\u03C4\u03B5 \u03BD\u03AD\u03BF \u03B3\u03CD\u03C1\u03BF.",
      noResults: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B1\u03C0\u03BF\u03C4\u03B5\u03BB\u03AD\u03C3\u03BC\u03B1\u03C4\u03B1 \u03B3\u03B9\u03B1 \u03B1\u03C5\u03C4\u03CC\u03BD \u03C4\u03BF\u03BD \u03B3\u03CD\u03C1\u03BF.",
      needApi: "\u039B\u03B5\u03AF\u03C0\u03B5\u03B9 \u03C4\u03BF shared API script.",
      seconds: "\u03B4\u03B5\u03C5\u03C4.",
      roundDuration: "\u0394\u03B9\u03AC\u03C1\u03BA\u03B5\u03B9\u03B1 \u03B3\u03CD\u03C1\u03BF\u03C5",
      targetError: "\u03A3\u03C4\u03CC\u03C7\u03BF\u03C2 \u03C3\u03C6\u03AC\u03BB\u03BC\u03B1\u03C4\u03BF\u03C2",
      startRound: "\u0388\u03BD\u03B1\u03C1\u03BE\u03B7 \u03B3\u03CD\u03C1\u03BF\u03C5",
      stopRound: "\u03A4\u03AD\u03BB\u03BF\u03C2 \u03B3\u03CD\u03C1\u03BF\u03C5",
      resetScores: "\u039C\u03B7\u03B4\u03B5\u03BD\u03B9\u03C3\u03BC\u03CC\u03C2 \u03B2\u03B1\u03B8\u03BC\u03CE\u03BD",
      round: "\u0393\u03CD\u03C1\u03BF\u03C2",
      liveBoard: "\u03A4\u03C1\u03AD\u03C7\u03BF\u03C5\u03C3\u03B1 \u03B2\u03B1\u03B8\u03BC\u03BF\u03BB\u03BF\u03B3\u03AF\u03B1",
      totalBoard: "\u03A3\u03C5\u03BD\u03BF\u03BB\u03B9\u03BA\u03AE \u03B2\u03B1\u03B8\u03BC\u03BF\u03BB\u03BF\u03B3\u03AF\u03B1",
      standings: "\u039A\u03B1\u03C4\u03AC\u03C4\u03B1\u03BE\u03B7 \u03BF\u03BC\u03AC\u03B4\u03C9\u03BD",
      liveRank: "\u039A\u03B1\u03C4\u03AC\u03C4\u03B1\u03BE\u03B7 \u03B3\u03CD\u03C1\u03BF\u03C5",
      totalRank: "\u03A3\u03C5\u03BD\u03BF\u03BB\u03B9\u03BA\u03AE \u03BA\u03B1\u03C4\u03AC\u03C4\u03B1\u03BE\u03B7",
      roundPoints: "\u03A0\u03CC\u03BD\u03C4\u03BF\u03B9 \u03B3\u03CD\u03C1\u03BF\u03C5",
      team: "\u039F\u03BC\u03AC\u03B4\u03B1",
      estimate: "\u0395\u03BA\u03C4\u03AF\u03BC\u03B7\u03C3\u03B7 \u03C0",
      error: "\u03A3\u03C6\u03AC\u03BB\u03BC\u03B1",
      points: "\u03A0\u03CC\u03BD\u03C4\u03BF\u03B9",
      total: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF",
      noTeams: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03C3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03B5\u03C2 \u03BF\u03BC\u03AC\u03B4\u03B5\u03C2 \u03B1\u03BA\u03CC\u03BC\u03B1...",
      initialTeacherStatus: "\u03A0\u03B1\u03C4\u03AE\u03C3\u03C4\u03B5 \xAB\u0388\u03BD\u03B1\u03C1\u03BE\u03B7 \u03B3\u03CD\u03C1\u03BF\u03C5\xBB \u03B3\u03B9\u03B1 \u03BD\u03AD\u03BF \u03C0\u03B1\u03B9\u03C7\u03BD\u03AF\u03B4\u03B9.",
      noEstimates: "\u03A7\u03C9\u03C1\u03AF\u03C2 \u03B5\u03BA\u03C4\u03B9\u03BC\u03AE\u03C3\u03B5\u03B9\u03C2 \u03C0 \u03B1\u03BA\u03CC\u03BC\u03B1",
      drops: "\u03A1\u03AF\u03C8\u03B5\u03B9\u03C2",
      hits: "\u03A4\u03BF\u03BC\u03AD\u03C2",
      misses: "\u03A7\u03C9\u03C1\u03AF\u03C2 \u03C4\u03BF\u03BC\u03AE"
    }
  },
  activityLibrary: {
    title: "\u0392\u03B9\u03B2\u03BB\u03B9\u03BF\u03B8\u03AE\u03BA\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD",
    description: "\u0395\u03C0\u03AF\u03BB\u03B5\u03BE\u03B5 \u03B1\u03C0\u03BF\u03B8\u03B7\u03BA\u03B5\u03C5\u03BC\u03AD\u03BD\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD server \u03AE \u03AC\u03BD\u03BF\u03B9\u03BE\u03B5 \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF JSON \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD \u03C5\u03C0\u03BF\u03BB\u03BF\u03B3\u03B9\u03C3\u03C4\u03AE \u03BA\u03B1\u03B9 \u03B5\u03C6\u03AC\u03C1\u03BC\u03BF\u03C3\u03AD \u03C4\u03B7\u03BD \u03C3\u03C4\u03B7\u03BD \u03C4\u03AC\u03BE\u03B7.",
    serverTitle: "\u0391\u03C0\u03BF\u03B8\u03B7\u03BA\u03B5\u03C5\u03BC\u03AD\u03BD\u03B5\u03C2 \u03C3\u03C4\u03BF\u03BD server",
    serverFolder: "\u03A4\u03B1 \u03B1\u03C1\u03C7\u03B5\u03AF\u03B1 \u03B4\u03B9\u03B1\u03B2\u03AC\u03B6\u03BF\u03BD\u03C4\u03B1\u03B9 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD \u03C6\u03AC\u03BA\u03B5\u03BB\u03BF \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD \u03C4\u03BF\u03C5 server.",
    chooseFile: "\u0395\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE \u03C4\u03BF\u03C0\u03B9\u03BA\u03BF\u03CD \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF\u03C5 JSON",
    selectionTitle: "\u0395\u03C0\u03B9\u03BB\u03B5\u03B3\u03BC\u03AD\u03BD\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1",
    localFile: "\u03A4\u03BF\u03C0\u03B9\u03BA\u03CC \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF",
    loading: "\u03A6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03B1\u03C0\u03BF\u03B8\u03B7\u03BA\u03B5\u03C5\u03BC\u03AD\u03BD\u03C9\u03BD \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD\u2026",
    empty: "\u0394\u03B5\u03BD \u03B2\u03C1\u03AD\u03B8\u03B7\u03BA\u03B1\u03BD \u03B1\u03C0\u03BF\u03B8\u03B7\u03BA\u03B5\u03C5\u03BC\u03AD\u03BD\u03B5\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03C3\u03C4\u03BF\u03BD server.",
    selectHint: "\u0395\u03C0\u03AF\u03BB\u03B5\u03BE\u03B5 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD server \u03AE \u03AC\u03BD\u03BF\u03B9\u03BE\u03B5 \u03C4\u03BF\u03C0\u03B9\u03BA\u03CC \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF JSON.",
    noDescription: "\u0394\u03B5\u03BD \u03AD\u03C7\u03B5\u03B9 \u03B4\u03BF\u03B8\u03B5\u03AF \u03C0\u03B5\u03C1\u03B9\u03B3\u03C1\u03B1\u03C6\u03AE.",
    apply: "\u0386\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1 \u03C3\u03C4\u03B7\u03BD \u03C4\u03AC\u03BE\u03B7",
    opening: "\u0386\u03BD\u03BF\u03B9\u03B3\u03BC\u03B1\u2026",
    serverLoadError: "\u0394\u03B5\u03BD \u03AE\u03C4\u03B1\u03BD \u03B4\u03C5\u03BD\u03B1\u03C4\u03AE \u03B7 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03B2\u03B9\u03B2\u03BB\u03B9\u03BF\u03B8\u03AE\u03BA\u03B7\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD \u03C4\u03BF\u03C5 server.",
    activityLoadError: "\u0394\u03B5\u03BD \u03AE\u03C4\u03B1\u03BD \u03B4\u03C5\u03BD\u03B1\u03C4\u03AE \u03B7 \u03C6\u03CC\u03C1\u03C4\u03C9\u03C3\u03B7 \u03C4\u03B7\u03C2 \u03B5\u03C0\u03B9\u03BB\u03B5\u03B3\u03BC\u03AD\u03BD\u03B7\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD server.",
    invalidJson: "\u03A4\u03BF \u03B5\u03C0\u03B9\u03BB\u03B5\u03B3\u03BC\u03AD\u03BD\u03BF \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF \u03B4\u03B5\u03BD \u03B5\u03AF\u03BD\u03B1\u03B9 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF JSON.",
    invalidFile: "\u03A4\u03BF \u03B1\u03C1\u03C7\u03B5\u03AF\u03BF \u03B4\u03B5\u03BD \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C5\u03C0\u03BF\u03C3\u03C4\u03B7\u03C1\u03B9\u03B6\u03CC\u03BC\u03B5\u03BD\u03BF JSON \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2.",
    applyError: "\u0394\u03B5\u03BD \u03AE\u03C4\u03B1\u03BD \u03B4\u03C5\u03BD\u03B1\u03C4\u03AE \u03B7 \u03B5\u03C6\u03B1\u03C1\u03BC\u03BF\u03B3\u03AE \u03C4\u03B7\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1\u03C2 \u03C3\u03C4\u03B7\u03BD \u03C4\u03AC\u03BE\u03B7.",
    systemsTitle: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03A3\u03C5\u03C3\u03C4\u03B7\u03BC\u03AC\u03C4\u03C9\u03BD",
    systemsFolder: "\u039F\u03B9 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03C6\u03BF\u03C1\u03C4\u03CE\u03BD\u03BF\u03BD\u03C4\u03B1\u03B9 \u03BC\u03CC\u03BD\u03BF \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD \u03C6\u03AC\u03BA\u03B5\u03BB\u03BF JSON \u03C4\u03C9\u03BD \u03A3\u03C5\u03C3\u03C4\u03B7\u03BC\u03AC\u03C4\u03C9\u03BD.",
    serverSystemsTitle: "\u0391\u03C0\u03BF\u03B8\u03B7\u03BA\u03B5\u03C5\u03BC\u03AD\u03BD\u03B5\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03A3\u03C5\u03C3\u03C4\u03B7\u03BC\u03AC\u03C4\u03C9\u03BD",
    workshopActivitiesTitle: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2 \u03CC\u03BB\u03C9\u03BD \u03C4\u03C9\u03BD \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03B7\u03C1\u03AF\u03C9\u03BD",
    workshopActivitiesFolder: "\u03A4\u03B1 \u03B1\u03C1\u03C7\u03B5\u03AF\u03B1 \u03B5\u03BC\u03C6\u03B1\u03BD\u03AF\u03B6\u03BF\u03BD\u03C4\u03B1\u03B9 \u03B1\u03C0\u03CC \u03C4\u03BF\u03BD \u03C6\u03AC\u03BA\u03B5\u03BB\u03BF server/data/activities.",
    savedActivitiesTitle: "\u0391\u03C0\u03BF\u03B8\u03B7\u03BA\u03B5\u03C5\u03BC\u03AD\u03BD\u03B5\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2"
  }
};

// client/src/locales/el/navigation.json
var navigation_default = {
  labs: "\u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03B1",
  system: "\u03A3\u03CD\u03C3\u03C4\u03B7\u03BC\u03B1",
  tools: "\u0395\u03C1\u03B3\u03B1\u03BB\u03B5\u03AF\u03B1",
  activities: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
  help: "\u0392\u03BF\u03AE\u03B8\u03B5\u03B9\u03B1",
  sectionNavigation: "\u0395\u03BD\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
  items: {
    activityLibrary: "\u0392\u03B9\u03B2\u03BB\u03B9\u03BF\u03B8\u03AE\u03BA\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD",
    venn: "\u0394\u03B9\u03AC\u03B3\u03C1\u03B1\u03BC\u03BC\u03B1 Venn",
    activities: "\u0394\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
    buffon: "Buffon",
    identities: "\u03A4\u03B1\u03C5\u03C4\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
    equations: "\u0395\u03BE\u03B9\u03C3\u03CE\u03C3\u03B5\u03B9\u03C2 - \u0391\u03BD\u03B9\u03C3\u03CE\u03C3\u03B5\u03B9\u03C2",
    factorization: "\u03A0\u03B1\u03C1\u03B1\u03B3\u03BF\u03BD\u03C4\u03BF\u03C0\u03BF\u03AF\u03B7\u03C3\u03B7",
    probabilities: "\u03A0\u03B9\u03B8\u03B1\u03BD\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2",
    linearSystems: "\u03A3\u03C5\u03C3\u03C4\u03AE\u03BC\u03B1\u03C4\u03B1",
    neural: "\u039D\u03B5\u03C5\u03C1\u03C9\u03BD\u03B9\u03BA\u03CC",
    polynomial: "\u03A0\u03BF\u03BB\u03C5\u03CE\u03BD\u03C5\u03BC\u03B1",
    primes: "\u03A0\u03C1\u03CE\u03C4\u03BF\u03B9",
    geogebra: "GeoGebra",
    algebraTiles: "\u03A0\u03BB\u03B1\u03BA\u03AF\u03B4\u03B9\u03B1 \u0386\u03BB\u03B3\u03B5\u03B2\u03C1\u03B1\u03C2",
    numberLine: "\u0391\u03C1\u03B9\u03B8\u03BC\u03BF\u03B3\u03C1\u03B1\u03BC\u03BC\u03AE",
    cartesianPlane: "\u039A\u03B1\u03C1\u03C4\u03B5\u03C3\u03B9\u03B1\u03BD\u03CC \u03B5\u03C0\u03AF\u03C0\u03B5\u03B4\u03BF",
    optionsGrid: "\u03A0\u03BB\u03AD\u03B3\u03BC\u03B1 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03CE\u03BD",
    placementBoard: "\u0391\u03BD\u03C4\u03B9\u03C3\u03C4\u03BF\u03AF\u03C7\u03B9\u03C3\u03B7",
    inputGrid: "\u03A0\u03BB\u03AD\u03B3\u03BC\u03B1 \u03B5\u03B9\u03C3\u03CC\u03B4\u03C9\u03BD",
    vision: "\u039A\u03AC\u03BC\u03B5\u03C1\u03B1",
    camera: "\u0388\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 \u03C4\u03B1\u03C7\u03CD\u03C4\u03B7\u03C4\u03B1\u03C2 \u03BA\u03AC\u03BC\u03B5\u03C1\u03B1\u03C2",
    console: "\u039A\u03BF\u03BD\u03C3\u03CC\u03BB\u03B1",
    scores: "\u0392\u03B1\u03B8\u03BC\u03BF\u03BB\u03BF\u03B3\u03AF\u03B5\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD",
    separation: "\u0393\u03C1\u03B1\u03BC\u03BC\u03B9\u03BA\u03CC\u03C2 \u03B4\u03B9\u03B1\u03C7\u03C9\u03C1\u03B9\u03C3\u03BC\u03CC\u03C2",
    jsonValidator: "\u0388\u03BB\u03B5\u03B3\u03C7\u03BF\u03C2 JSON",
    builder: "\u0394\u03B7\u03BC\u03B9\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03BF\u03C4\u03AE\u03C4\u03C9\u03BD",
    instructions: "\u039F\u03B4\u03B7\u03B3\u03AF\u03B5\u03C2 \u03C7\u03C1\u03AE\u03C3\u03B7\u03C2"
  },
  password: "\u039A\u03C9\u03B4\u03B9\u03BA\u03CC\u03C2",
  login: "\u03A3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7",
  logout: "\u0391\u03C0\u03BF\u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7",
  connected: "\u03A3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF\u03C2 \u03C3\u03C4\u03BF\u03BD server",
  disconnected: "\u03A7\u03C9\u03C1\u03AF\u03C2 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 \u03BC\u03B5 \u03C4\u03BF\u03BD server",
  loginFailed: "\u0397 \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7 \u03B1\u03C0\u03AD\u03C4\u03C5\u03C7\u03B5. \u0395\u03BB\u03AD\u03B3\u03BE\u03C4\u03B5 \u03C4\u03BF \u03CC\u03BD\u03BF\u03BC\u03B1 \u03C7\u03C1\u03AE\u03C3\u03C4\u03B7 \u03BA\u03B1\u03B9 \u03C4\u03BF\u03BD \u03BA\u03C9\u03B4\u03B9\u03BA\u03CC."
};

// client/src/locales/el/instructions.json
var instructions_default = {
  title: "\u039F\u03B4\u03B7\u03B3\u03AF\u03B5\u03C2 \u03C7\u03C1\u03AE\u03C3\u03B7\u03C2",
  intro: "\u03A3\u03CD\u03BD\u03C4\u03BF\u03BC\u03BF\u03C2 \u03BF\u03B4\u03B7\u03B3\u03CC\u03C2 \u03B3\u03B9\u03B1 \u03C4\u03B7 \u03C7\u03C1\u03AE\u03C3\u03B7 \u03C4\u03C9\u03BD \u03C3\u03C5\u03BD\u03B5\u03C1\u03B3\u03B1\u03C4\u03B9\u03BA\u03CE\u03BD \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03B7\u03C1\u03AF\u03C9\u03BD Strobe.",
  teacher: {
    title: "\u0393\u03B9\u03B1 \u03C4\u03BF\u03BD \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC",
    description: "\u03A3\u03C5\u03BD\u03B4\u03B5\u03B8\u03B5\u03AF\u03C4\u03B5 \u03BC\u03B5 \u03C4\u03BF\u03BD \u03BB\u03BF\u03B3\u03B1\u03C1\u03B9\u03B1\u03C3\u03BC\u03CC \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD \u03B3\u03B9\u03B1 \u03BD\u03B1 \u03B4\u03B9\u03B1\u03C7\u03B5\u03B9\u03C1\u03B9\u03C3\u03C4\u03B5\u03AF\u03C4\u03B5 \u03C4\u03B7\u03BD \u03C4\u03AC\u03BE\u03B7 \u03BA\u03B1\u03B9 \u03C4\u03B9\u03C2 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B5\u03C2.",
    steps: [
      "\u0391\u03BD\u03BF\u03AF\u03BE\u03C4\u03B5 \u03AD\u03BD\u03B1 \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF \u03B1\u03C0\u03CC \u03C4\u03BF \u03BC\u03B5\u03BD\u03BF\u03CD \u0395\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03B1 \u03BA\u03B1\u03B9 \u03B5\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03C4\u03B7\u03BD \u03C0\u03C1\u03BF\u03B2\u03BF\u03BB\u03AE \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD.",
      "\u0395\u03C0\u03B9\u03BB\u03AD\u03BE\u03C4\u03B5 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1 \u03BA\u03B1\u03B9 \u03C1\u03C5\u03B8\u03BC\u03AF\u03C3\u03C4\u03B5 \u03C4\u03B9\u03C2 \u03B4\u03B9\u03B1\u03B8\u03AD\u03C3\u03B9\u03BC\u03B5\u03C2 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2 \u03B1\u03C0\u03CC \u03C4\u03B1 \u03B1\u03BD\u03C4\u03AF\u03C3\u03C4\u03BF\u03B9\u03C7\u03B1 \u03C0\u03BB\u03B1\u03AF\u03C3\u03B9\u03B1.",
      "\u039C\u03BF\u03B9\u03C1\u03B1\u03C3\u03C4\u03B5\u03AF\u03C4\u03B5 \u03C4\u03BF\u03BD \u03BA\u03C9\u03B4\u03B9\u03BA\u03CC QR \u03AE \u03C4\u03BF\u03BD \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03BC\u03BF \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03B7\u03C2 \u03BC\u03B5 \u03C4\u03BF\u03C5\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2."
    ]
  },
  student: {
    title: "\u0393\u03B9\u03B1 \u03C4\u03BF\u03BD \u03BC\u03B1\u03B8\u03B7\u03C4\u03AE",
    description: "\u039F\u03B9 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03AD\u03C7\u03BF\u03C5\u03BD \u03B1\u03C0\u03CC \u03C4\u03B7 \u03B4\u03B9\u03BA\u03AE \u03C4\u03BF\u03C5\u03C2 \u03C3\u03C5\u03C3\u03BA\u03B5\u03C5\u03AE \u03BA\u03B1\u03B9 \u03C3\u03C5\u03BD\u03B5\u03C1\u03B3\u03AC\u03B6\u03BF\u03BD\u03C4\u03B1\u03B9 \u03C3\u03C4\u03B7\u03BD \u03BA\u03BF\u03B9\u03BD\u03AE \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1.",
    steps: [
      "\u0391\u03BD\u03BF\u03AF\u03BE\u03C4\u03B5 \u03C4\u03BF\u03BD \u03C3\u03CD\u03BD\u03B4\u03B5\u03C3\u03BC\u03BF \u03AE \u03C3\u03B1\u03C1\u03CE\u03C3\u03C4\u03B5 \u03C4\u03BF\u03BD \u03BA\u03C9\u03B4\u03B9\u03BA\u03CC QR \u03C0\u03BF\u03C5 \u03AD\u03B4\u03C9\u03C3\u03B5 \u03BF \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2.",
      "\u03A3\u03C5\u03BC\u03C0\u03BB\u03B7\u03C1\u03CE\u03C3\u03C4\u03B5 \u03C4\u03BF \u03CC\u03BD\u03BF\u03BC\u03B1 \u03B5\u03BC\u03C6\u03AC\u03BD\u03B9\u03C3\u03B7\u03C2 \u03CC\u03C4\u03B1\u03BD \u03B6\u03B7\u03C4\u03B7\u03B8\u03B5\u03AF \u03BA\u03B1\u03B9 \u03C0\u03B5\u03C1\u03B9\u03BC\u03AD\u03BD\u03B5\u03C4\u03B5 \u03BD\u03B1 \u03BE\u03B5\u03BA\u03B9\u03BD\u03AE\u03C3\u03B5\u03B9 \u03B7 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1.",
      "\u039F\u03B9 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03B9 \u03BE\u03B5\u03BA\u03BB\u03B5\u03B9\u03B4\u03CE\u03BD\u03BF\u03C5\u03BD \u03CC\u03C4\u03B1\u03BD \u03BF \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2 \u03BE\u03B5\u03BA\u03B9\u03BD\u03AE\u03C3\u03B5\u03B9 \u03C4\u03B7 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1."
    ]
  },
  sessions: {
    title: "\u03A3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B5\u03C2",
    description: "\u0397 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1 \u03BF\u03C1\u03AF\u03B6\u03B5\u03B9 \u03C0\u03CC\u03C4\u03B5 \u03BF\u03B9 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2 \u03BC\u03C0\u03BF\u03C1\u03BF\u03CD\u03BD \u03BD\u03B1 \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03BF\u03CD\u03BD \u03BA\u03B1\u03B9 \u03BA\u03B1\u03C4\u03B1\u03B3\u03C1\u03AC\u03C6\u03B5\u03B9 \u03C4\u03B7 \u03B4\u03C1\u03B1\u03C3\u03C4\u03B7\u03C1\u03B9\u03CC\u03C4\u03B7\u03C4\u03B1.",
    steps: [
      "\u039F \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2 \u03C0\u03B1\u03C4\u03AC \u0388\u03BD\u03B1\u03C1\u03BE\u03B7 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1\u03C2 \u03C0\u03C1\u03B9\u03BD \u03B1\u03C1\u03C7\u03AF\u03C3\u03B5\u03B9 \u03B7 \u03B5\u03C1\u03B3\u03B1\u03C3\u03AF\u03B1.",
      "\u039F\u03B9 \u03B1\u03BB\u03BB\u03B1\u03B3\u03AD\u03C2 \u03BA\u03B1\u03B9 \u03C4\u03B1 \u03C3\u03C5\u03BC\u03B2\u03AC\u03BD\u03C4\u03B1 \u03BA\u03B1\u03C4\u03B1\u03B3\u03C1\u03AC\u03C6\u03BF\u03BD\u03C4\u03B1\u03B9 \u03B1\u03C5\u03C4\u03CC\u03BC\u03B1\u03C4\u03B1 \u03BA\u03B1\u03C4\u03AC \u03C4\u03B7 \u03B4\u03B9\u03AC\u03C1\u03BA\u03B5\u03B9\u03B1 \u03C4\u03B7\u03C2 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1\u03C2.",
      "\u039C\u03B5 \u03C4\u03B7\u03BD \u039F\u03BB\u03BF\u03BA\u03BB\u03AE\u03C1\u03C9\u03C3\u03B7 \u03C3\u03C5\u03BD\u03B5\u03B4\u03C1\u03AF\u03B1\u03C2 \u03BF\u03B9 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03B9 \u03C4\u03C9\u03BD \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD \u03BA\u03BB\u03B5\u03B9\u03B4\u03CE\u03BD\u03BF\u03C5\u03BD \u03BE\u03B1\u03BD\u03AC."
    ]
  },
  settings: {
    title: "\u0391\u03BD\u03B1\u03C4\u03C1\u03BF\u03C6\u03BF\u03B4\u03CC\u03C4\u03B7\u03C3\u03B7 \u03BA\u03B1\u03B9 \u03C3\u03BA\u03BF\u03C1",
    description: "\u039F\u03B9 \u03B4\u03B9\u03B1\u03B8\u03AD\u03C3\u03B9\u03BC\u03B5\u03C2 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AD\u03C2 \u03B4\u03B9\u03B1\u03C6\u03AD\u03C1\u03BF\u03C5\u03BD \u03B1\u03BD\u03AC \u03B5\u03C1\u03B3\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF.",
    steps: [
      "\u039F \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2 \u03B5\u03BD\u03B5\u03C1\u03B3\u03BF\u03C0\u03BF\u03B9\u03B5\u03AF \u03C4\u03BF Score \u03BA\u03B1\u03B9 \u03C4\u03BF Feedback \u03B1\u03C0\u03CC \u03C4\u03B1 checkbox \u03C3\u03C4\u03BF\u03BD \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD. \u03A4\u03BF Chat \u03B5\u03BD\u03B5\u03C1\u03B3\u03BF\u03C0\u03BF\u03B9\u03B5\u03AF\u03C4\u03B1\u03B9 \u03B1\u03C0\u03CC \u03C4\u03BF accordion \u03A3\u03C5\u03BD\u03BF\u03BC\u03B9\u03BB\u03AF\u03B1\u03C2.",
      "\u038C\u03C4\u03B1\u03BD \u03B5\u03AF\u03BD\u03B1\u03B9 \u03B5\u03BD\u03B5\u03C1\u03B3\u03CC \u03C4\u03BF Score, \u03BF\u03B9 \u03C3\u03C7\u03B5\u03C4\u03B9\u03BA\u03AD\u03C2 \u03B2\u03B1\u03B8\u03BC\u03BF\u03BB\u03BF\u03B3\u03AF\u03B5\u03C2 \u03B5\u03BC\u03C6\u03B1\u03BD\u03AF\u03B6\u03BF\u03BD\u03C4\u03B1\u03B9 \u03C3\u03C4\u03BF\u03C5\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2 \u03BA\u03B1\u03B9 \u03C3\u03C4\u03BF\u03BD \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1 \u03CC\u03C0\u03BF\u03C5 \u03C5\u03C0\u03BF\u03C3\u03C4\u03B7\u03C1\u03AF\u03B6\u03B5\u03C4\u03B1\u03B9.",
      "\u039F \u03C0\u03AF\u03BD\u03B1\u03BA\u03B1\u03C2 \u03BC\u03B1\u03B8\u03B7\u03C4\u03CE\u03BD \u03B4\u03B5\u03AF\u03C7\u03BD\u03B5\u03B9 \u03C0\u03BF\u03B9\u03BF\u03B9 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03AD\u03C7\u03BF\u03BD\u03C4\u03B5\u03C2 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C3\u03C5\u03BD\u03B4\u03B5\u03B4\u03B5\u03BC\u03AD\u03BD\u03BF\u03B9."
    ]
  },
  chat: {
    title: "\u03A3\u03C5\u03BD\u03BF\u03BC\u03B9\u03BB\u03AF\u03B1",
    description: "\u0397 \u03C3\u03C5\u03BD\u03BF\u03BC\u03B9\u03BB\u03AF\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03BA\u03BF\u03B9\u03BD\u03AE \u03B3\u03B9\u03B1 \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03BF\u03CD\u03C2 \u03BA\u03B1\u03B9 \u03BC\u03B1\u03B8\u03B7\u03C4\u03AD\u03C2 \u03CC\u03C4\u03B1\u03BD \u03C4\u03B7\u03BD \u03B5\u03BD\u03B5\u03C1\u03B3\u03BF\u03C0\u03BF\u03B9\u03AE\u03C3\u03B5\u03B9 \u03BF \u03B5\u03BA\u03C0\u03B1\u03B9\u03B4\u03B5\u03C5\u03C4\u03B9\u03BA\u03CC\u03C2.",
    steps: [
      "\u0393\u03C1\u03AC\u03C8\u03C4\u03B5 \u03C4\u03BF \u03BC\u03AE\u03BD\u03C5\u03BC\u03B1 \u03C3\u03C4\u03BF \u03C0\u03B5\u03B4\u03AF\u03BF \u03C3\u03C4\u03BF \u03BA\u03AC\u03C4\u03C9 \u03BC\u03AD\u03C1\u03BF\u03C2 \u03C4\u03B7\u03C2 \u03C3\u03C5\u03BD\u03BF\u03BC\u03B9\u03BB\u03AF\u03B1\u03C2 \u03BA\u03B1\u03B9 \u03C3\u03C4\u03B5\u03AF\u03BB\u03C4\u03B5 \u03C4\u03BF.",
      "\u03A4\u03B1 \u03BC\u03B7\u03BD\u03CD\u03BC\u03B1\u03C4\u03B1 \u03B5\u03BC\u03C6\u03B1\u03BD\u03AF\u03B6\u03BF\u03C5\u03BD \u03C4\u03BF \u03CC\u03BD\u03BF\u03BC\u03B1 \u03B1\u03C0\u03BF\u03C3\u03C4\u03BF\u03BB\u03AD\u03B1 \u03BA\u03B1\u03B9 \u03C4\u03B7\u03BD \u03CE\u03C1\u03B1 \u03BA\u03B1\u03B9 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03BF\u03C1\u03B1\u03C4\u03AC \u03C3\u03B5 \u03CC\u03BB\u03BF\u03C5\u03C2 \u03C4\u03BF\u03C5\u03C2 \u03C3\u03C5\u03BC\u03BC\u03B5\u03C4\u03AD\u03C7\u03BF\u03BD\u03C4\u03B5\u03C2."
    ]
  }
};

// client/src/locales/en/common.json
var common_default2 = {
  ok: "OK",
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  loading: "Loading...",
  home: "Home",
  teacher: "Teacher",
  admin: "Admin",
  student: "Student",
  group: "Group",
  settings: "Settings",
  activityGeneralSettings: "General activity settings",
  activityResourceSettings: "Resource settings",
  enableChat: "Show chat to students",
  enableFeedback: "Enable feedback",
  showScoreToStudents: "Show scores to students",
  chat: "Chat",
  chatDisabled: "Chat is disabled.",
  chatNeedsSession: "Chat will be available when a session starts.",
  chatMessage: "Write a message",
  chatSend: "Send",
  language: "Language",
  greek: "Greek",
  english: "English",
  startSession: "Start session",
  clearActivityOnStart: "Clear current work when the session starts",
  endSession: "End session",
  input: "Input",
  notAvailable: "Not available",
  status: "Status",
  username: "Username",
  connected: "Connected",
  disconnected: "Disconnected",
  enterFullscreen: "Enter fullscreen",
  exitFullscreen: "Exit fullscreen"
};

// client/src/locales/en/menu.json
var menu_default2 = {
  home: "Home",
  activities: "Activities",
  settings: "Settings",
  mainNavigation: "Main navigation",
  tools: "Tools",
  activityBuilder: "Activity Settings",
  cameraSpeedTest: "Camera Speed Test",
  geoGebraCollab: "GeoGebra Collab",
  geoGebraMonitor: "GeoGebra Monitor",
  console: "Console",
  linearSeparation: "Linear Separation",
  quickLabLinks: "Quick lab links",
  teacherDashboard: "Teacher Dashboard",
  teacherDescription: "Open teaching applications, manage activities, and monitor your class.",
  teacherFeatureApps: "Application library",
  teacherFeatureActivities: "Activity management",
  teacherFeatureClass: "Class monitoring",
  studentLauncher: "Student Launcher",
  studentDescription: "Choose an activity and continue directly to the student view.",
  studentFeatureApps: "Available activities",
  studentFeatureRoutes: "Student workspaces",
  studentFeatureAccess: "Quick access",
  toolsCard: "Learning Tools",
  toolsDescription: "Open tools for learning, activity building, and collaboration.",
  toolsFeatureBuilder: "Activity Settings",
  toolsFeatureCamera: "Camera Speed Test",
  toolsFeatureGeoGebra: "GeoGebra Collab",
  toolsFeatureSeparation: "Linear Separation"
};

// client/src/locales/en/geometry.json
var geometry_default2 = {
  title: "Geometry",
  addPoint: "Add point",
  deletePoint: "Delete point",
  rotate: "Rotate"
};

// client/src/locales/en/interface.json
var interface_default2 = {
  activityWorkspace: {
    settings: "Activity settings",
    title: "Title",
    subtitle: "Subtitle",
    notes: "Notes",
    widgets: "Widgets (JSON, up to 2)",
    save: "Save activity",
    saved: "Activity saved.",
    saveError: "Saving failed.",
    json: "Activity JSON"
  },
  activityLibrary: {
    title: "Activity library",
    description: "Choose a saved activity from the server or open an activity JSON file from this device, then apply it to the classroom.",
    serverTitle: "Saved on the server",
    serverFolder: "Files are read from the server activity library.",
    systemsTitle: "Systems activities",
    systemsFolder: "Activities are loaded only from the Linear Systems JSON folder.",
    serverSystemsTitle: "Saved Linear Systems activities",
    chooseFile: "Choose a local JSON file",
    selectionTitle: "Selected activity",
    localFile: "Local file",
    loading: "Loading saved activities\u2026",
    empty: "No saved activities were found on the server.",
    selectHint: "Choose a server activity or a local JSON file.",
    noDescription: "No description provided.",
    apply: "Open in classroom",
    opening: "Opening\u2026",
    serverLoadError: "Could not load the server activity library.",
    activityLoadError: "Could not load the selected server activity.",
    invalidJson: "The selected file is not valid JSON.",
    invalidFile: "This file is not a supported activity JSON document.",
    applyError: "Could not apply the activity to the classroom.",
    workshopActivitiesTitle: "Activities from all workshops",
    workshopActivitiesFolder: "Files are listed from the server/data/activities folder.",
    savedActivitiesTitle: "Saved activities"
  },
  appsLauncher: "Apps Launcher",
  studentLauncher: "Student Launcher",
  studentWaitingTitle: "Welcome",
  studentWaitingMessage: "Wait for your teacher to choose an activity. You will be taken to the lab automatically.",
  teacherDashboard: "Teacher Dashboard",
  tools: {
    "activity-builder": {
      title: "Activity Settings",
      description: "Configure reusable resources and save activity JSON files."
    },
    "camera-speed-test": {
      title: "Camera Speed Test",
      description: "Frame round-trip benchmark for the detection pipeline."
    },
    "linear-seperation": {
      title: "Linear Separation Tool",
      description: "Interactive dataset-based linear separation tool."
    },
    "geogebra-collab": {
      title: "GeoGebra Collaborative Component",
      description: "Shared GeoGebra board with role-aware permissions."
    },
    "vision-collab": {
      title: "Camera",
      description: "Live camera feed with shared tracking overlays for the classroom."
    },
    "workshop-json-validator": {
      title: "Workshop JSON Validator",
      description: "Validate workshop JSON files against the shared storage language."
    },
    console: {
      title: "Console",
      description: "Live view of messages exchanged between users and the server."
    }
  },
  strobeLogo: "Strobe logo",
  loadingApps: "Loading apps...",
  loadingTools: "Loading tools...",
  loadingLab: "Loading lab...",
  launcher: "Launcher",
  student: "Student",
  teacher: "Teacher",
  tool: "Tool",
  expression: "Expression",
  expressions: "Expressions",
  expressionType: "Monomial or polynomial",
  operatorBetweenTerms: "Operation between polynomial terms",
  coefficient: "Coefficient",
  answer: "Answer",
  wrongPlacement: "A term is in the wrong group. Remove the red term first.",
  automaticResult: "Automatic result",
  activities: "Activity",
  chooseActivity: "Choose activity",
  noAvailableActivities: "No activities available",
  feedbackToggle: "Show feedback for incorrect answers",
  studentTable: "Student table",
  groupsTable: "Groups table",
  score: "Score",
  noStudents: "There are no students in this lab.",
  openStudentView: "Open student view",
  openTeacherView: "Open teacher view",
  openTool: "Open tool",
  available: "Available",
  unavailable: "Unavailable",
  readyToOpen: "Ready to open",
  enableFeature: "Build or enable the required feature first",
  studentAccessible: "Student accessible",
  teacherAccessible: "Teacher accessible",
  toolsLead: "Tools for teaching and testing, with data from the API endpoint /api/tools.",
  reactPage: "React page",
  spaNavigation: "SPA navigation",
  studentLead: "Choose an app and continue to its student route.",
  teacherLead: "Launch teaching apps, manage classroom activities, and monitor your class.",
  identitiesTitle: "Identities Lab",
  identitiesDescription: "Algebraic and geometric understanding of fundamental algebraic identities.",
  geoGebraCollaborativeTitle: "GeoGebra Collaborative Component",
  geoGebraCollaborativeDescription: "A shared GeoGebra board for student collaboration with server-side permissions.",
  failedApps: "Failed to load apps.",
  failedTools: "Failed to load tools.",
  labNotFound: "Lab not found.",
  mainNavigation: "Main navigation",
  roomId: "Room ID",
  joinRoom: "Join room",
  geoGebraCollaborative: "GeoGebra",
  algebraTilesCollaborative: "Algebra Tiles",
  numberLine: {
    title: "Number Line",
    ariaLabel: "Shared number line",
    leftEnd: "Left end",
    rightEnd: "Right end",
    partitions: "Partitions"
  },
  optionsGrid: {
    ariaLabel: "Shared options grid",
    apply: "Apply settings"
  },
  cartesianPlane: {
    title: "Cartesian Plane",
    ariaLabel: "Interactive Cartesian plane",
    minX: "Minimum x",
    maxX: "Maximum x",
    minY: "Minimum y",
    maxY: "Maximum y",
    maxPoints: "Maximum number of points",
    targets: "Target points",
    targetsHelp: "Enter points as x,y pairs separated by semicolons.",
    pointCount: "Your points: {{count}}",
    pointCountLimit: "Your points: {{count}} / {{max}}",
    meanDistance: "Average distance to nearest target: {{distance}}"
  },
  vennCollab: {
    setCount: "Number of sets",
    setName: "Set {{number}} name",
    relationBetween: "Relation between {{first}} and {{second}}",
    elements: "Elements",
    relations: {
      disjoint: "Disjoint",
      intersecting: "Intersecting",
      subset: "Subset (first set inside second)"
    }
  },
  placementBoard: {
    items: "Items to place",
    elements: "Elements",
    groups: "Regions",
    groupsHelp: "Enter region names separated by commas."
  },
  inputGrid: {
    cells: "Input cells",
    correctAnswer: "Correct answer",
    answerExact: "Exact value (=)",
    answerMinimum: "Minimum value (\u2265)",
    answerSet: "Accepted values",
    answerInterval: "Interval",
    correctAnswers: "Accepted values (comma-separated)",
    lowerBound: "Lower bound (use -inf for no lower limit)",
    upperBound: "Upper bound (use inf for no upper limit)",
    includeLowerBound: "Include lower bound",
    includeUpperBound: "Include upper bound",
    cellPosition: "Row {{row}}, column {{column}}",
    applyPropertiesLegend: "Properties to copy from this cell to all cells",
    apply: {
      min: "Minimum",
      max: "Maximum",
      step: "Step",
      correctAnswerType: "Answer rule",
      correctAnswer: "Answer value",
      correctAnswers: "Accepted values",
      correctAnswerMin: "Answer interval lower bound",
      correctAnswerMax: "Answer interval upper bound",
      minInclusive: "Include lower bound",
      maxInclusive: "Include upper bound"
    },
    fieldLabel: "Cell {{number}} label",
    minimum: "Minimum",
    maximum: "Maximum",
    step: "Step",
    applyToAll: "Copy selected properties to every cell",
    responses: "Student responses",
    noResponses: "No responses yet."
  },
  algebraTiles: {
    settings: "Board settings",
    activityType: "Activity type",
    equations: "Equations",
    factorization: "Factorization",
    equation: "Equation",
    factorizationTask: "Factorization problem",
    factorize: "Factorize",
    boardMode: "Board layout",
    prompt: "Prompt",
    modes: {
      equation: "Equation",
      systems: "Systems",
      area: "Area",
      simplified: "Simplified"
    },
    promptExpression: "Expression / LaTeX",
    sendToAll: "Send to everyone",
    sendStatus: {
      sending: "Sending\u2026",
      sent: "Sent to everyone",
      disconnected: "Not connected to the classroom server",
      failed: "The server did not confirm the expression"
    }
  },
  geoGebraCollaborativeDescriptionShort: "A shared GeoGebra board for collaborative work.",
  geoGebraMonitor: "GeoGebra Controls",
  console: "Console",
  consoleIntro: "Live log of messages between users and the server. Refreshes every two seconds.",
  consoleFetchFailed: "Failed to retrieve messages ({{status}}).",
  consoleUnavailable: "Could not retrieve messages.",
  realtimeServer: "REALTIME \u2022 SERVER",
  refresh: "Refresh",
  clearFilters: "Clear filters",
  time: "Time",
  direction: "Direction",
  from: "From",
  to: "To",
  message: "Message",
  noMessages: "No messages match the selected filters.",
  cameraSpeedTest: "Camera Speed Test",
  cameraSpeedDescription: "Raw camera frame compared with the server-tracked frame (DeepSORT).",
  startTest: "Start test",
  stopTest: "Stop test",
  trackingBackend: "Tracking backend",
  roundTripAverage: "Round trip (average)",
  serverProcessAverage: "Server process (average)",
  sendFps: "Send FPS",
  responseFps: "Response FPS",
  trackedBoxes: "Tracked boxes",
  cameraCaptureClient: "Camera capture (client)",
  trackedFrameServer: "Tracked frame (server response)",
  jpegQuality: "JPEG quality",
  cameraStatus: {
    idle: "Idle",
    stopped: "Stopped",
    realtimeConnected: "Connected to realtime server",
    realtimeDisconnected: "Disconnected from realtime server",
    streamingStarted: "Streaming test started",
    cannotStart: "Could not start the test"
  },
  visionCollabTitle: "Camera",
  visionCollabDisplay: "Display",
  visionCollabTrackingMode: "Tracking detail",
  visionCollabSinglePoint: "Single point",
  visionCollabPoseLandmarks: "Pose landmarks",
  visionCollabCameraView: "Camera and board",
  visionCollabBoardView: "Board only",
  visionCollabActiveUsers: "Active users",
  visionCollabNoActiveUsers: "No active users are being tracked.",
  visionCollabSource: "Tracking",
  visionCollabCameraSource: "Camera",
  visionCollabPoseSource: "Pose",
  visionCollabTrackingStatus: "Tracking: {{mode}} \xB7 {{backend}} \xB7 {{points}} landmarks",
  visionCollabPoseLandmarkNames: {
    nose: "Nose",
    left_eye_inner: "Left inner eye",
    left_eye: "Left eye",
    left_eye_outer: "Left outer eye",
    right_eye_inner: "Right inner eye",
    right_eye: "Right eye",
    right_eye_outer: "Right outer eye",
    left_ear: "Left ear",
    right_ear: "Right ear",
    mouth_left: "Left mouth corner",
    mouth_right: "Right mouth corner",
    left_shoulder: "Left shoulder",
    right_shoulder: "Right shoulder",
    left_elbow: "Left elbow",
    right_elbow: "Right elbow",
    left_wrist: "Left wrist",
    right_wrist: "Right wrist",
    left_pinky: "Left pinky",
    right_pinky: "Right pinky",
    left_index: "Left index finger",
    right_index: "Right index finger",
    left_thumb: "Left thumb",
    right_thumb: "Right thumb",
    left_hip: "Left hip",
    right_hip: "Right hip",
    left_knee: "Left knee",
    right_knee: "Right knee",
    left_ankle: "Left ankle",
    right_ankle: "Right ankle",
    left_heel: "Left heel",
    right_heel: "Right heel",
    left_foot_index: "Left foot tip",
    right_foot_index: "Right foot tip"
  },
  visionCollabMouseSource: "Mouse",
  visionCollabCoordinateX: "X",
  visionCollabCoordinateY: "Y",
  visionCollabStudent: "Student",
  visionCollabRenameTrackedPoint: "Name tracked person ({{name}}):",
  visionCollabSaveName: "Save name",
  visionCollabCancelName: "Cancel",
  visionCollabServerUrl: "Vision server URL",
  visionCollabActivity: "Activity template",
  visionCollabStart: "Start collaboration stream",
  visionCollabStop: "Stop collaboration stream",
  visionCollabStatus: "Status",
  visionCollabTrackedPoints: "Tracked points",
  visionCollabWebSocketError: "Vision WebSocket communication error.",
  visionCollabCannotStart: "Could not start camera tracking collaboration.",
  visionCollabStatuses: {
    idle: "Idle",
    stopped: "Stopped",
    connected: "Connected",
    disconnected: "Disconnected",
    error: "Error",
    cannotStart: "Cannot start"
  },
  linearSeparation: "Linear Separation Tool",
  linearSeparationLead: "Provide JSON in the datasets.js format and find a hyperplane for target-versus-rest classification.",
  linearSeparationInputTitle: "Enter Dataset JSON",
  linearSeparationJsonPlaceholder: "Paste the dataset JSON here",
  linearSeparationLoadJson: "Load JSON",
  linearSeparationJsonError: "JSON error",
  linearSeparationTargetCategory: "Target category",
  linearSeparationDataset: "Dataset",
  linearSeparationMissingClasses: "At least one positive and one negative example are required.",
  linearSeparationLimitReason: "No integer separator was found for |w_j| \u2264 {{maxRadius}}.",
  linearSeparationExample: "Example",
  linearSeparationPrediction: "Prediction",
  linearSeparationLabel: "Label",
  linearSeparationCorrect: "Correct",
  linearSeparationPositive: "positive",
  linearSeparationNegative: "negative",
  linearSeparationTarget: "target",
  linearSeparationOthers: "other",
  datasetJson: "Dataset JSON",
  settings: "Settings",
  result: "Result",
  notEnoughData: "Not enough data yet.",
  separatorNotFound: "No separator found.",
  separatorFound: "A separator was found.",
  minimumMaxWeight: "Smallest max|w|",
  margin: "Margin",
  runTests: "Run tests",
  summary: "Summary",
  activityBuilder: {
    title: "Activity Settings",
    settingsTitle: "Activity Settings",
    titleLabel: "Title",
    titlePlaceholder: "Activity title",
    titleRequired: "Enter an activity title.",
    openFile: "Open file",
    serverActivity: "Saved activities",
    chooseServerActivity: "Choose an activity",
    openServerActivity: "Open activity",
    fileLoaded: "Loaded {{filename}}",
    openFileError: "Could not open this activity JSON file.",
    jsonPreview: "Activity JSON",
    editorTitle: "Activity Editor",
    libraryTitle: "Activity Library",
    resource: "Resource",
    chooseResource: "Choose a resource",
    activity: "Activity",
    chooseActivity: "Choose an activity",
    activityName: "Activity name",
    activityNamePlaceholder: "Lesson activity",
    activityNameRequired: "Enter an activity name.",
    notes: "Notes",
    notesPlaceholder: "Teacher notes",
    configJson: "Resource settings (JSON)",
    saveActivity: "Save Activity",
    preview: "Preview",
    previewEmpty: "Select an activity to preview its JSON.",
    libraryResource: "Resource: {{title}}",
    ready: "Ready",
    noResources: "No resources available.",
    loadResourcesError: "Failed to load resources.",
    loadLibraryError: "Failed to load activity library.",
    loadActivityError: "Failed to load activity.",
    selectResource: "Choose a resource first.",
    invalidConfig: "Invalid settings JSON: {{message}}",
    saving: "Saving\u2026",
    saved: "Saved successfully.",
    saveError: "Failed to save activity.",
    saveFailed: "Save failed.",
    loadError: "Cannot load resources.",
    loaded: "Loaded {{filename}}",
    resourceNames: {
      "input-grid": "Entry Grid",
      "grouping-drag-drop": "Placement Board",
      "venn-board": "Venn Board",
      "algebra-tiles": "Algebra Tiles",
      "collaborative-geogebra": "GeoGebra",
      "collaborative-algebra-tiles": "Algebra Tiles (shared board)",
      "options-grid": "Options Grid",
      "cartesian-plane": "Cartesian Plane"
    },
    resourceSettings: "Resource settings",
    columns: "Columns",
    rows: "Rows",
    gridCell: "Row {{row}}, column {{column}}",
    className: "CSS class name",
    labelClassName: "Input label CSS class",
    customLayout: "Use custom layout",
    inputFields: "Input fields",
    defaultInput: "Input {{index}}",
    defaultGroup: "Group {{index}}",
    defaultItem: "Item {{index}}",
    defaultItemsBank: "Items to group",
    defaultOption: "Option {{index}}",
    options: "Options",
    optionsExpressionHelp: "Use 2:20:2, a:f, comma-separated values, or combine ranges such as 2:6,8:12.",
    optionLabel: "Option",
    invalidOptionsJson: "Options must be a valid JSON array.",
    fieldId: "Field ID",
    fieldLabel: "Input label",
    fieldPlaceholder: "Placeholder",
    fieldType: "Input type",
    textType: "Text",
    numberType: "Number",
    correctAnswer: "Correct answer",
    addField: "Add input",
    groups: "Groups",
    groupId: "Group ID",
    groupLabel: "Group title",
    addGroup: "Add group",
    items: "Items",
    bankLabel: "Items bank label",
    itemId: "Item ID",
    itemLabel: "Item content",
    correctGroup: "Correct group",
    chooseGroup: "Choose a group",
    addItem: "Add item",
    activityId: "Activity ID",
    initialTiles: "Initial tiles (JSON array)",
    invalidTilesJson: "Enter a valid JSON array.",
    roomId: "Room ID",
    showStatus: "Show connection status",
    showLegend: "Show legend",
    showToolBar: "Show toolbar",
    showAlgebraView: "Show algebra view",
    showAlgebraInput: "Show algebra input",
    showMenuBar: "Show menu bar",
    showResetIcon: "Show reset button",
    showZoomButtons: "Show zoom buttons",
    showFullscreenButton: "Show fullscreen button",
    showSuggestionButtons: "Show suggestion buttons",
    widgets: "Widgets",
    addWidget: "Add widget",
    chooseWidget: "Choose a widget",
    cancel: "Cancel",
    widgetType: "Widget type",
    widgetLeft: "Left",
    widgetRight: "Right",
    unknownWidget: "Unknown widget",
    layoutPreview: "Resource layout preview",
    emptyWidgetSlot: "No widget here yet",
    widgetCount: "{{count}} of 3 widgets",
    widgetLimit: "You can add up to three widgets, one in each position.",
    geoGebraPreview: "GeoGebra board",
    moveToLeft: "Move left",
    moveToRight: "Move right",
    iconCode: "Unicode code point (for example U+1F600)",
    iconPreviewEmpty: "Enter a valid Unicode code point to preview the icon",
    widgetNames: {
      icon: "Icon",
      equation: "Equation",
      graph: "Graph",
      mathPreview: "Math expression preview"
    },
    graphTitle: "Graph title",
    xMin: "Minimum x",
    xMax: "Maximum x",
    yMin: "Minimum y",
    yMax: "Maximum y",
    graphLines: "Lines (JSON array: m, b, color, label)",
    graphElement: "Graph element",
    graphElementHint: "Choose whether to plot a point or a linear equation.",
    graphPoint: "Point",
    showCoordinates: "Show coordinates",
    graphColor: "Color",
    graphEquation: "Equation",
    graphEquationHint: "Enter a linear equation such as y = 2x + 1.",
    addGraphElement: "Add graph element",
    showGrid: "Show grid",
    invalidWidgetJson: "Enter a valid JSON array.",
    expression: "Expression",
    expressionHint: "Enter a LaTeX expression with or without dollar signs.",
    expressionPreviewEmpty: "Your equation preview will appear here",
    remove: "Remove",
    resources: {
      "buffon-needle": [
        {
          value: "round",
          label: "Buffon needle experiment"
        }
      ],
      "neural-lab": [
        {
          value: "1",
          label: "1. Find the input"
        },
        {
          value: "2",
          label: "2. Calculate the output"
        },
        {
          value: "3",
          label: "3. Adjust the weights"
        },
        {
          value: "4",
          label: "4. Compare"
        }
      ],
      "primes-lab": [
        {
          value: "sieve",
          label: "Sieve of Eratosthenes"
        },
        {
          value: "number-grid",
          label: "Prime number grid"
        }
      ],
      "polynomial-lab": [
        {
          value: "1.1",
          label: "1.1 Monomial concepts"
        },
        {
          value: "1.2",
          label: "1.2 Identify like monomials"
        },
        {
          value: "1.3",
          label: "1.3 Operations with monomials"
        },
        {
          value: "1.4",
          label: "1.4 Multiplying monomials"
        },
        {
          value: "2.1",
          label: "2.1 Polynomial basics"
        },
        {
          value: "2.2",
          label: "2.2 Combine like terms"
        },
        {
          value: "2.3",
          label: "2.3 Group terms in polynomials"
        },
        {
          value: "2.4",
          label: "2.4 Add and subtract polynomials"
        },
        {
          value: "2.5",
          label: "2.5 Multiply polynomials"
        },
        {
          value: "2.6",
          label: "2.6 Area model multiplication"
        },
        {
          value: "2.7",
          label: "2.7 Algebra tiles"
        },
        {
          value: "2.8",
          label: "2.8 Degree of polynomial products"
        }
      ],
      "linear-systems-lab": [
        {
          value: "1",
          label: "1. Create a system graphically"
        },
        {
          value: "2",
          label: "2. One, none, or infinitely many solutions"
        },
        {
          value: "3",
          label: "3. Embodied activity"
        },
        {
          value: "4",
          label: "4. Solve by elimination"
        },
        {
          value: "5",
          label: "5. Verify the solution on the graph"
        },
        {
          value: "6",
          label: "6. Embodied zone sorting"
        }
      ],
      "identities-lab": [
        {
          value: "1",
          label: "1. Square of a sum"
        },
        {
          value: "2",
          label: "2. Square of a difference"
        },
        {
          value: "3",
          label: "3. Difference of squares"
        },
        {
          value: "4",
          label: "4. Practice"
        }
      ],
      "equations-lab": [
        {
          value: "1",
          label: "1. Solve simple equations"
        }
      ],
      "factorization-lab": [
        {
          value: "1",
          label: "1. Factor trinomials with algebra tiles"
        }
      ]
    },
    widgetPosition: "Widget position",
    previewLabel: "Preview label",
    widgetPositions: {
      left: "Left",
      right: "Right",
      bottom: "Bottom"
    }
  },
  currentApp: "Current app: {{title}}",
  noSavedActivities: "No saved activities for this app yet.",
  preview: "Preview",
  appsTitle: "Apps",
  toolsTitle: "Tools",
  users: "Users",
  labs: "Labs",
  messageTypes: "Message types",
  multiSelectHint: "Ctrl/\u2318 + click to select multiple options",
  messageCount: "{{count}} messages",
  incomingServer: "\u2192 server",
  serverOutgoing: "server \u2192",
  failedTestsRun: "Failed to run tests.",
  running: "Running...",
  geoGebraMonitorIntro: "Manage connected rooms, object access, room contents, and the live activity feed.",
  notEnoughSeparationData: "Not enough data yet.",
  noSeparator: "No separator found.",
  separator: "A separator was found.",
  minimumMaxW: "Smallest max|w|",
  currentAppLabel: "Current app: {{title}}",
  apps: {
    "buffon-needle": {
      title: "Buffon Lab",
      description: "Multiplayer Buffon experiment with rounds and scoreboards."
    },
    "neural-lab": {
      title: "Neural Lab",
      description: "Collaborative neural-network activity with live teacher and student sync."
    },
    "primes-lab": {
      title: "Primes Lab",
      description: "Sieve of Eratosthenes activity with teacher-controlled steps and a shared number grid."
    },
    "polynomial-lab": {
      title: "Polynomial Lab",
      description: "Collaborative polynomial practice with a shared workspace and teacher-led activities."
    },
    "linear-systems-lab": {
      title: "Systems Lab",
      description: "Graphical and algebraic solving of linear systems with shared GeoGebra scenes."
    },
    "identities-lab": {
      title: "Identities Lab",
      description: "Algebraic identities with geometric proofs of fundamental identities."
    },
    "equations-lab": {
      title: "Equations - Inequalities Lab",
      description: "Solve simple equations with shared algebra tiles."
    },
    "factorization-lab": {
      title: "Factorization Lab",
      description: "Factor trinomials with algebra tiles."
    }
  },
  toolHelpers: {
    activityBuilder: "Teacher lesson designer and activity JSON editor.",
    cameraSpeedTest: "Round-trip frame benchmark for the detection pipeline.",
    visionCollaboration: "WebRTC camera capture with FastAPI/Python tracking and activity overlays.",
    workshopJsonValidator: "Schema and rule validator for workshop JSON files.",
    geoGebraCollaborative: "Shared GeoGebra board with role-aware object locks.",
    geoGebraMonitor: "Central dashboard for all connected collaborative GeoGebra rooms.",
    console: "Live view of messages exchanged between users and the server.",
    linearSeparation: "Interactive dataset-based linear separation tool."
  },
  workshopJsonValidator: {
    title: "Workshop JSON Validator",
    lead: "Paste an activity, sequence, or workshop JSON document and validate it against the shared JSON language rules.",
    fileInputLabel: "Load JSON file",
    dropHint: "Or drag and drop a .json file here.",
    fileLoaded: "Loaded file: {{filename}}",
    fileLoadError: "Could not read the selected file.",
    invalidFileType: "Please select a .json file.",
    inputLabel: "Learning JSON document",
    validateButton: "Validate JSON",
    validSummary: "Validation succeeded. The document follows the shared JSON language.",
    invalidSummary: "Validation failed with {{count}} issue(s)."
  },
  studentConnection: "Connection (QR Code)",
  studentQrAlt: "QR code for the student connection",
  workshops: {
    primes: {
      kicker: "Sieve of Eratosthenes",
      title: "Sieve of Eratosthenes",
      subtitle: "From 2 to 100, discover which numbers are multiples and which remain prime.",
      connectedTeacher: "Connected",
      connectedStudent: "Connected",
      disconnected: "Disconnected",
      namePrefix: "user name",
      board: "Main board",
      range: "Numbers 2 to 100",
      locked: "locked",
      prime: "prime",
      remaining: "What remains",
      remainingDescription: "Of the numbers that have not been locked, {{remaining}} remain, and {{primes}} of those are prime.",
      waitingMultiples: "Multiples to find",
      completedSteps: "Completed steps",
      activeStudent: "Current student",
      student: "student",
      anotherStudent: "another student",
      messages: {
        chooseBase: "Choose a base and start the sieve.",
        selectedBase: "We are now working with base {{prime}}. Its multiples are highlighted on the board.",
        baseIsNotMultiple: "{{number}} is the base for this step, not a multiple.",
        alreadyClaimedBy: "{{number}} has already been correctly locked by {{name}}.",
        claimedBySelf: "{{number}} has already been correctly locked by {{name}}.",
        correctSelection: "{{name}} correctly locked {{number}}.",
        wrongSelection: "{{name}} marked {{number}} as an incorrect choice."
      },
      grid: {
        ariaLabel: "Number grid from 2 to 100",
        lockedBy: "{{number}} has been locked by {{owner}}",
        lockedByOther: "{{number}} has already been locked by another student",
        multipleOf: "{{number}} is a multiple of {{prime}}",
        number: "Number {{number}}"
      },
      summary: {
        title: "Overview",
        subtitle: "Numbers found for {{prime}}",
        correct: "Correctly locked",
        wrong: "Incorrect choices",
        open: "Open targets",
        stepTargets: "Targets for this step",
        allFound: "All found"
      },
      table: {
        eyebrow: "Student table",
        title: "What students have selected",
        base: "Base",
        student: "Student",
        color: "Color",
        correct: "Correctly locked",
        wrong: "Incorrect choices",
        status: "Status",
        activeNow: "Active now",
        viewing: "Viewing"
      },
      teacher: {
        stepTitle: "Choose a step",
        stepSubtitle: "The teacher chooses which sieve is active",
        activeTitle: "Student taking a turn",
        activeSubtitle: "Useful for simulating the classroom",
        activeLabel: "Active student:",
        ruleTitle: "Current rule",
        ruleSubtitle: "Select multiples of {{prime}}",
        ruleText: "Select every multiple of {{prime}} that is greater than {{prime}} itself.",
        ruleTeacher: "The teacher changes only the base.",
        ruleStudents: "Students select the correct multiples without taking one another's choices.",
        ruleLocked: "Correctly locked numbers are removed from play.",
        goalTitle: "Learning objective",
        goalSubtitle: "Multiples, primes, and composites",
        goalCorrect: "Correct choices are assigned to a specific student and cannot be repeated by others.",
        goalWrong: "Incorrect choices are tracked separately to show each student's strategy.",
        goalProgress: "The class moves from 2 to 3 to 5 and onward until only the primes remain."
      }
    },
    neural: {
      title: "Neural Lab",
      homeTitle: "Unified React application",
      homeSubtitle: "Teacher and student views with a shared language and shared components.",
      openTeacher: "Teacher",
      openStudent: "Student",
      openBuffonTeacher: "Buffon Teacher",
      openBuffonStudent: "Buffon Student",
      dashboardTitle: "Neural Lab",
      activitiesTitle: "Activities",
      chooseActivity: "Choose activity",
      activity1: "1. Find the input",
      activity2: "2. Compute the output",
      activity3: "3. Adjust the weights",
      activity4: "4. Compare",
      datasetsTitle: "Data",
      chooseDataset: "Dataset",
      chooseExample: "Example",
      activeInputs: "Active inputs",
      separation: "Separation",
      notSeparable: "Not separable",
      separator: "Separation",
      noData: "No data is available for the selected dataset",
      examplesClassifier: "Examples classifier",
      result: "Result",
      confusionMatrix: "Confusion matrix",
      actualClass: "Actual class",
      prediction: "Prediction",
      positive: "Positive",
      negative: "Negative",
      currentWeights: "Current weights",
      selectAll: "Select all",
      selectNone: "Select none",
      studentConnection: "Student connection",
      selectPrompt: "-- Select --",
      thresholdInfo: " (Threshold: {{op}} {{boundary}})",
      notSeparableInfo: " (Not separable)",
      positiveStatus: "Positive",
      negativeStatus: "Negative",
      operationTree: "Operation tree",
      classroomView: "Classroom view",
      studentTableTitle: "Student table",
      noStudents: "No students.",
      studentName: "Student",
      inputOne: "Input 1",
      inputTwo: "Input 2",
      belowThreshold: "Below",
      datasetLabels: {
        vehicles: "Vehicles",
        digits: "Digits"
      },
      featureLabels: {
        vehicles: {
          i1: "Wheels",
          i2: "Engine"
        },
        digits: {
          i1: "Circles",
          i2: "Crossings"
        }
      },
      exampleLabels: {
        vehicles: {
          "0": "Bicycle",
          "1": "Motorcycle",
          "2": "Car",
          "3": "Scooter"
        },
        digits: {
          "0": "Zero",
          "1": "One",
          "2": "Four",
          "3": "Six",
          "4": "Eight"
        }
      },
      notSelected: "Not selected"
    },
    buffon: {
      title: "Buffon Needle",
      teacherTitle: "Buffon Needle",
      studentTitle: "Buffon Needle",
      student: {
        waiting: "Waiting for the teacher to start.",
        needleLength: "Needle length",
        lineSpacing: "Line spacing",
        hit: "Hit",
        miss: "Miss",
        stepLabel: "Needles per step",
        stepButton: "+{{count}} drops",
        automatic: "Automatic",
        reset: "Reset",
        estimateError: "Error",
        formula: "Formula",
        chart: "Convergence to pi",
        connected: "Connected. Waiting for the teacher.",
        disconnected: "Server connection lost. You can continue experimenting.",
        freeExperiment: "Free experiment. Connection starts automatically.",
        roundBanner: "Round {{round}}: error target <= {{target}} | {{seconds}} sec remaining",
        roundEnd: "The round is complete.",
        targetReached: "The error target was reached.",
        manualStop: "The teacher stopped the round.",
        winner: "Winning team: {{team}}.",
        podium: "Ranking: {{ranking}}.",
        tournamentReset: "Scores were reset. Waiting for the next round.",
        connecting: "Connecting to server..."
      },
      teacherConnected: "Connected.",
      roundStartedInfo: "Round {{round}} | error target {{target}}",
      roundStarted: "Round {{round}} started.",
      roundCompletedInfo: "Round {{round}} completed",
      scoresReset: "Scores were reset.",
      tournamentReset: "Tournament reset. Start a new round.",
      noResults: "No results for this round.",
      needApi: "The shared API script is unavailable.",
      seconds: "sec",
      roundDuration: "Round duration",
      targetError: "Error target",
      startRound: "Start round",
      stopRound: "Stop round",
      resetScores: "Reset scores",
      round: "Round",
      liveBoard: "Live standings",
      totalBoard: "Total standings",
      standings: "Team standings",
      liveRank: "Round rank",
      totalRank: "Overall rank",
      roundPoints: "Round points",
      team: "Team",
      estimate: "Pi estimate",
      error: "Error",
      points: "Points",
      total: "Total",
      noTeams: "No teams connected yet...",
      initialTeacherStatus: "Select Start round to begin.",
      noEstimates: "No pi estimates yet",
      drops: "Drops",
      hits: "Hits",
      misses: "Misses"
    }
  }
};

// client/src/locales/en/navigation.json
var navigation_default2 = {
  labs: "Workshops",
  system: "System",
  tools: "Tools",
  activities: "Activities",
  help: "Help",
  sectionNavigation: "Sections",
  items: {
    activityLibrary: "Activity library",
    venn: "Venn Diagram",
    activities: "Activities",
    buffon: "Buffon",
    identities: "Identities",
    equations: "Equations - Inequalities",
    factorization: "Factorization",
    probabilities: "Probabilities",
    linearSystems: "Systems",
    neural: "Neural",
    polynomial: "Polynomial",
    primes: "Primes",
    geogebra: "GeoGebra",
    algebraTiles: "Algebra Tiles",
    numberLine: "Number Line",
    cartesianPlane: "Cartesian Plane",
    optionsGrid: "Options Grid",
    placementBoard: "Placement Board",
    inputGrid: "Input Grid",
    vision: "Camera",
    camera: "Camera Speed Test",
    console: "Console",
    scores: "Student Scores",
    separation: "Linear Separation",
    jsonValidator: "JSON Validator",
    builder: "Activity Builder",
    instructions: "User guide"
  },
  password: "Password",
  login: "Log in",
  logout: "Log out",
  connected: "Connected to server",
  disconnected: "Not connected to server",
  loginFailed: "Could not sign in. Check the username and password."
};

// client/src/locales/en/instructions.json
var instructions_default2 = {
  title: "User guide",
  intro: "A short guide to using the Strobe collaborative labs.",
  teacher: {
    title: "For teachers",
    description: "Sign in with a teacher account to manage the class and activities.",
    steps: [
      "Open a lab from the Labs menu and choose the teacher view.",
      "Select an activity and adjust its available options in the corresponding panels.",
      "Share the QR code or connection link with your students."
    ]
  },
  student: {
    title: "For students",
    description: "Students join from their own devices and work together in the shared activity.",
    steps: [
      "Open the link or scan the QR code provided by the teacher.",
      "Enter a display name when prompted, then wait for the session to start.",
      "Inputs become available after the teacher starts the session."
    ]
  },
  sessions: {
    title: "Sessions",
    description: "A session controls when students can work and records activity as it happens.",
    steps: [
      "The teacher selects Start session before work begins.",
      "Changes and events are recorded automatically during the session.",
      "Selecting End session locks student inputs again."
    ]
  },
  settings: {
    title: "Feedback and scores",
    description: "Available options depend on the lab.",
    steps: [
      "The teacher can enable Score and Feedback with the checkboxes in the student table. Chat can be enabled in the Chat accordion.",
      "When Score is enabled, relevant scores are shown to students and in the student table where supported.",
      "The student table indicates which participants are connected."
    ]
  },
  chat: {
    title: "Chat",
    description: "Chat is shared by teachers and students when enabled by the teacher.",
    steps: [
      "Type your message in the input at the bottom of the chat and send it.",
      "Messages show the sender's name and time and are visible to all participants."
    ]
  }
};

// client/src/shared/i18n/index.js
var preferredLanguageStorageKey = "preferredLanguage";
var resources = {
  el: {
    common: common_default,
    menu: menu_default,
    geometry: geometry_default,
    interface: interface_default,
    navigation: navigation_default,
    instructions: instructions_default
  },
  en: {
    common: common_default2,
    menu: menu_default2,
    geometry: geometry_default2,
    interface: interface_default2,
    navigation: navigation_default2,
    instructions: instructions_default2
  }
};
if (!instance.isInitialized) {
  instance.use(Browser).use(initReactI18next).init({
    resources,
    fallbackLng: "el",
    supportedLngs: ["el", "en"],
    defaultNS: "common",
    ns: ["common", "menu", "geometry", "interface", "navigation", "instructions"],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: preferredLanguageStorageKey,
      caches: ["localStorage"]
    }
  });
}
if (typeof window !== "undefined") {
  window.StrobeI18n = instance;
  document.documentElement.lang = instance.resolvedLanguage || instance.language || "el";
  const storedLanguage = (() => {
    try {
      return localStorage.getItem(preferredLanguageStorageKey);
    } catch {
      return null;
    }
  })();
  if (storedLanguage && storedLanguage !== instance.language) {
    instance.changeLanguage(storedLanguage);
  }
}
instance.on("languageChanged", (language) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
  try {
    localStorage.setItem(preferredLanguageStorageKey, language);
  } catch {
  }
});

// client/src/shared/components/menu/StudentIdentityControl.jsx
var import_react46 = __toESM(require_react(), 1);

// client/src/shared/components/menu/RoleAccessControl.jsx
var import_react47 = __toESM(require_react(), 1);

// client/src/shared/components/services/ChatAccordion.jsx
var import_react48 = __toESM(require_react(), 1);

// client/src/workshops/buffon-needle/data/theory-references.json
var theory_references_default = {
  activity: { theoryId: "buffon-needle" }
};

// client/src/workshops/buffon-needle/data/student-template.js
var studentTemplate = String.raw`<div class="connection-status" id="connection-status" role="status" aria-live="polite"></div>

<div class="round-banner waiting" id="round-banner">Περιμένετε την έναρξη.</div>

<!-- Canvas row -->
<div class="canvas-row">
  <div class="vspinner">
    <div class="lbl">l<br>Μήκος<br>βελόνας</div>
    <button class="spin-btn" onclick="changeL(5)">+</button>
    <div class="val" id="val-l" style="color:#a78bfa">50</div>
    <button class="spin-btn" onclick="changeL(-5)">−</button>
    <input type="range" id="range-l" min="10" max="120" value="50"
      style="accent-color:#a78bfa" oninput="setL(+this.value)">
    <div class="range-labels">10–120</div>
  </div>

  <div class="canvas-stage">
    <canvas id="sim" width="480" height="280"></canvas>
    <div class="canvas-footer">
      <span><span style="color:#ef4444">━</span> hit</span>
      <span><span style="color:#22c55e">━</span> miss</span>
      <span id="ratio-badge"></span>
    </div>
  </div>

  <div class="vspinner">
    <div class="lbl">d<br>Απόσταση<br>γραμμών</div>
    <button class="spin-btn" onclick="changeD(5)">+</button>
    <div class="val" id="val-d" style="color:#38bdf8">60</div>
    <button class="spin-btn" onclick="changeD(-5)">−</button>
    <input type="range" id="range-d" min="30" max="150" value="60"
      style="accent-color:#38bdf8" oninput="setD(+this.value)">
    <div class="range-labels">30–150</div>
  </div>
</div>

<!-- Controls -->
<div class="panel lab-card">
  <div class="run-controls">
    <div class="step-inline">
      <div class="step-col">
        <div class="lbl">Βελόνες ανά βήμα</div>
        <div class="step-row">
          <button class="spin-btn" onclick="changeStep(-1)">−</button>
          <div class="step-val" id="step-val">1</div>
          <button class="spin-btn" onclick="changeStep(1)">+</button>
        </div>
        <input type="range" class="hrange" id="range-step" min="1" max="100" value="1"
          oninput="setStep(+this.value)">
      </div>
    </div>
    <button class="btn btn-primary" id="step-btn" onclick="doStep()">▶ +1 βελόνα</button>
    <div class="auto-switch-wrap">
      <span class="auto-lbl">AUTO</span>
      <label class="switch">
        <input type="checkbox" id="auto-toggle" onchange="toggleAutoDrop(this.checked)">
        <span class="slider"></span>
      </label>
      <span class="auto-rate">0.1s</span>
    </div>
    <button class="btn btn-danger" onclick="resetAll()">↺ Reset</button>
  </div>
</div>

<!-- Stats -->
<div class="stats-row lab-card">
  <div class="stat-box">
    <div class="s-lbl">\(\hat{\pi}\)</div>
    <div class="s-val" id="s-pi" style="color:#34d399">—</div>
  </div>
  <div class="stat-box">
    <div class="s-lbl">ΣΦΑΛΜΑ</div>
    <div class="s-val" id="s-err" style="color:#fbbf24">—</div>
  </div>
  <div class="stat-box">
    <div class="s-lbl">HITS</div>
    <div class="s-val" id="s-hits" style="color:#f87171">0</div>
  </div>
  <div class="stat-box">
    <div class="s-lbl">MISS</div>
    <div class="s-val" id="s-miss" style="color:#22c55e">0</div>
  </div>
  <div class="stat-box">
    <div class="s-lbl">ΒΕΛΟΝΕΣ</div>
    <div class="s-val" id="s-drops">0</div>
  </div>
</div>

<!-- Formula collapsible -->
<div class="accordion chart-wrap" data-accordion-id="student-formula">
  <button type="button" class="accordion-btn chart-header" aria-expanded="false">
    <span class="c-lbl">ΤΥΠΟΣ</span>
    <span class="accordion-icon" id="formula-arrow">+</span>
  </button>
  <div class="accordion-content chart-body" id="formula-body">
    <div style="text-align:center;font-size:13px;line-height:2;padding:4px 0 8px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">
        <span style="color:#a78bfa">\(\hat{\pi}\)</span>
        <span style="color:#64748b">\(\approx\)</span>
        <span>
          <div style="border-bottom:1px solid #94a3b8;padding-bottom:2px;text-align:center;">
            <span style="color:#38bdf8">2</span><span style="color:#64748b"> · </span>
            <span style="color:#a78bfa">l</span><span style="color:#64748b"> · </span>
            <span style="color:#e2e8f0">N</span>
          </div>
          <div style="padding-top:2px;text-align:center;">
            <span style="color:#38bdf8">d</span><span style="color:#64748b"> · </span>
            <span style="color:#f87171">H</span>
          </div>
        </span>
        <span style="color:#64748b">=</span>
        <span>
          <div style="border-bottom:1px solid #94a3b8;padding-bottom:2px;text-align:center;">
            <span style="color:#38bdf8">2</span><span style="color:#64748b"> · </span>
            <span style="color:#a78bfa" id="f-l">50</span><span style="color:#64748b"> · </span>
            <span style="color:#e2e8f0" id="f-n">0</span>
          </div>
          <div style="padding-top:2px;text-align:center;">
            <span style="color:#38bdf8" id="f-d">60</span><span style="color:#64748b"> · </span>
            <span style="color:#f87171" id="f-h">0</span>
          </div>
        </span>
        <span style="color:#64748b">=</span>
        <span style="color:#34d399;font-weight:700;font-size:16px;" id="f-result">—</span>
      </div>
    </div>
  </div>
</div>

<!-- Chart collapsible -->
<div class="accordion chart-wrap" data-accordion-id="student-chart">
  <button type="button" class="accordion-btn chart-header" aria-expanded="false">
    <span class="c-lbl">ΣΥΓΚΛΙΣΗ ΠΡΟΣ π</span>
    <span class="accordion-icon" id="chart-arrow">+</span>
  </button>
  <div class="accordion-content chart-body" id="chart-body">
    <canvas id="chart-cv"></canvas>
  </div>
</div>`;

// client/src/workshops/buffon-needle/data/teacher-template.js
var teacherSettingsTemplate = String.raw`<div class="round-panel lab-card">
  <div class="round-grid">
    <div class="round-control">
      <div class="lbl">ΔΙΑΡΚΕΙΑ ΓΥΡΟΥ</div>
      <div class="val" id="round-time-value">60 sec</div>
      <input type="range" id="round-time-slider" min="20" max="120" step="1" value="60" oninput="updateRoundControlLabels()">
      <div class="scale"><span>20 sec</span><span>120 sec</span></div>
    </div>
    <div class="round-control">
      <div class="lbl">ΣΤΟΧΟΣ ΣΦΑΛΜΑΤΟΣ</div>
      <div class="val" id="round-target-value">0.005</div>
      <input type="range" class="target-slider" id="round-target-slider" min="1" max="10" step="1" value="5" oninput="updateRoundControlLabels()">
      <div class="scale"><span>0.010</span><span>0.001</span></div>
    </div>
  </div>

  <div class="round-actions">
    <button class="round-start" id="round-start-btn" onclick="startRoundFromTeacher()">ΕΝΑΡΞΗ ΓΥΡΟΥ</button>
    <button class="round-stop" id="round-stop-btn" onclick="stopRoundManually()" disabled>ΔΙΑΚΟΠΗ</button>
    <button class="round-reset" id="round-reset-btn" onclick="resetTournamentScores()">ΜΗΔΕΝΙΣΜΟΣ</button>
    <div class="round-meta">
      <span id="round-info">Γύρος: -</span>
      <span class="round-timer" id="round-timer">-</span>
    </div>
  </div>

  <div class="round-status" id="round-status">Πάτησε «Έναρξη γύρου» για νέο παιχνίδι.</div>
  <div class="round-status round-result" id="round-result">-</div>
</div>`;

// client/src/shared/components/layouts/accordionDom.js
function mountAccordionInteractions(rootElement, onToggle) {
  if (!rootElement) return () => {
  };
  const handleClick = (event) => {
    const button = event.target.closest(".accordion-btn");
    if (!button || !rootElement.contains(button)) return;
    const accordion = button.closest(".accordion");
    const content = accordion && accordion.querySelector(".accordion-content");
    if (!content) return;
    const isOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(isOpen));
    content.classList.toggle("open", isOpen);
    const icon = button.querySelector(".accordion-icon");
    if (icon) icon.textContent = isOpen ? "\u2212" : "+";
    if (typeof onToggle === "function") onToggle(accordion.dataset.accordionId, isOpen);
  };
  rootElement.addEventListener("click", handleClick);
  return () => rootElement.removeEventListener("click", handleClick);
}

// client/src/workshops/buffon-needle/logic/student-logic.js
function mountBuffonStudent(rootElement, t3, { localOnly = false } = {}) {
  const cleanupAccordions = mountAccordionInteractions(rootElement, (accordionId, isOpen) => {
    if (accordionId === "student-chart" && isOpen) drawChart();
  });
  const Y_MIN = 1.5, Y_MAX = 5;
  const simCv = document.getElementById("sim");
  const simCtx = simCv.getContext("2d");
  const SW = simCv.width, SH = simCv.height;
  const chartCv = document.getElementById("chart-cv");
  const chartCtx = chartCv.getContext("2d");
  let needleL = 50, lineD = 60, stepN = 1;
  let drops = 0, hits = 0, history = [];
  let teamName = "";
  let classroomApi = null;
  let socketConnected = false;
  let teamRegistered = false;
  let autoDropTimer = null;
  let roundControlEnabled = false;
  let roundActive = false;
  let roundNumber = 0;
  let roundTargetError = null;
  let roundEndAt = 0;
  let roundBannerTimer = null;
  const pageQuery = new URLSearchParams(window.location.search);
  const PREFILL_TEAM = (pageQuery.get("team") || pageQuery.get("name") || "").trim();
  function ensureRegisteredTeamName() {
    const identityName = readIdentityName("Student");
    teamName = (PREFILL_TEAM || identityName || "Student").trim();
    if (PREFILL_TEAM) writeIdentityName(PREFILL_TEAM);
    return teamName;
  }
  function connectWS() {
    if (!window.SharedClassroomApi || typeof window.SharedClassroomApi.createClient !== "function") {
      socketConnected = false;
      updateConnDot();
      return;
    }
    if (classroomApi) {
      classroomApi.start();
      return;
    }
    classroomApi = window.SharedClassroomApi.createClient({
      wsPath: "/ws/buffon",
      reconnectDelayMs: 2e3,
      onOpen() {
        socketConnected = true;
        const ensuredTeamName = ensureRegisteredTeamName();
        sendPayload({ type: "register_student", team: ensuredTeamName });
        teamRegistered = true;
        roundControlEnabled = true;
        setRoundBanner(t3("student.connected"), "waiting");
        sendUpdate();
        updateConnDot();
      },
      onMessage(type, msg) {
        if (type === "round_start") {
          handleRoundStart(msg);
          return;
        }
        if (type === "round_end") {
          handleRoundEnd(msg);
          return;
        }
        if (type === "reset_tournament") {
          handleTournamentReset(msg);
        }
      },
      onClose() {
        socketConnected = false;
        teamRegistered = false;
        roundControlEnabled = false;
        roundActive = false;
        stopAutoDrop();
        stopRoundBannerTimer();
        setRoundBanner(t3("student.disconnected"), "waiting");
        updateConnDot();
      },
      onError() {
        socketConnected = false;
        updateConnDot();
      }
    });
    classroomApi.start();
  }
  function sendPayload(payload) {
    if (!classroomApi || !payload || typeof payload !== "object") return false;
    if (typeof payload.type !== "string" || !payload.type.trim()) return false;
    const type = payload.type;
    const data = { ...payload };
    delete data.type;
    return classroomApi.send(type, data);
  }
  function registerTeam() {
    teamName = ensureRegisteredTeamName();
    if (!classroomApi || !classroomApi.isConnected()) {
      connectWS();
      return;
    }
    sendPayload({ type: "register_student", team: teamName });
    teamRegistered = true;
    roundControlEnabled = true;
    setRoundBanner(t3("student.connected"), "waiting");
    updateConnDot();
    sendUpdate();
  }
  function sendUpdate() {
    if (!classroomApi || !classroomApi.isConnected() || !teamName || !teamRegistered) return;
    const piEst = hits > 0 ? 2 * needleL * drops / (lineD * hits) : null;
    sendPayload({ type: "update", drops, hits, piEst: piEst ? parseFloat(piEst.toFixed(5)) : null });
  }
  function updateConnDot() {
    const status = document.getElementById("connection-status");
    if (!status) return;
    const connected = socketConnected && teamRegistered;
    status.textContent = connected ? t3("student.connected") : t3("student.connecting");
    status.classList.toggle("connected", connected);
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function setRoundBanner(text, mode) {
    const banner = document.getElementById("round-banner");
    banner.textContent = text;
    banner.classList.remove("waiting", "active", "ended");
    if (mode === "active") banner.classList.add("active");
    else if (mode === "ended") banner.classList.add("ended");
    else banner.classList.add("waiting");
  }
  function stopRoundBannerTimer() {
    if (roundBannerTimer !== null) {
      clearInterval(roundBannerTimer);
      roundBannerTimer = null;
    }
  }
  function updateActiveRoundBanner() {
    const secs = Math.max(0, Math.ceil((roundEndAt - Date.now()) / 1e3));
    setRoundBanner(t3("student.roundBanner", {
      round: roundNumber,
      target: Number.isFinite(roundTargetError) ? roundTargetError.toFixed(3) : t3("targetError"),
      seconds: secs
    }), "active");
  }
  function startRoundBannerTimer() {
    stopRoundBannerTimer();
    updateActiveRoundBanner();
    roundBannerTimer = setInterval(() => {
      if (!roundActive) {
        stopRoundBannerTimer();
        return;
      }
      updateActiveRoundBanner();
    }, 250);
  }
  function applyRoundDefaults(defaults2) {
    const defaultL = clamp(Number.parseInt(defaults2.needleL, 10) || 50, 10, 120);
    const defaultD = clamp(Number.parseInt(defaults2.lineD, 10) || 60, 30, 150);
    const defaultStep = clamp(Number.parseInt(defaults2.stepN, 10) || 1, 1, 1e3);
    needleL = defaultL;
    lineD = defaultD;
    document.getElementById("val-l").textContent = needleL;
    document.getElementById("range-l").value = needleL;
    document.getElementById("val-d").textContent = lineD;
    document.getElementById("range-d").value = lineD;
    setStep(defaultStep);
    stopAutoDrop();
    document.getElementById("auto-toggle").checked = false;
    resetAll();
  }
  function handleRoundStart(msg) {
    roundControlEnabled = true;
    roundActive = true;
    roundNumber = Number.parseInt(msg.round, 10) || roundNumber + 1 || 1;
    const parsedTarget = Number.parseFloat(msg.targetError);
    roundTargetError = Number.isFinite(parsedTarget) ? clamp(parsedTarget, 1e-3, 0.01) : null;
    const parsedEndAt = Number.parseInt(msg.endAt, 10);
    if (Number.isFinite(parsedEndAt) && parsedEndAt > Date.now()) {
      roundEndAt = parsedEndAt;
    } else {
      const parsedTime = Number.parseInt(msg.timeSec, 10);
      const safeTime = clamp(Number.isInteger(parsedTime) ? parsedTime : 60, 20, 120);
      roundEndAt = Date.now() + safeTime * 1e3;
    }
    applyRoundDefaults(msg.defaults || {});
    startRoundBannerTimer();
  }
  function handleRoundEnd(msg) {
    roundControlEnabled = true;
    roundActive = false;
    roundEndAt = 0;
    stopAutoDrop();
    document.getElementById("auto-toggle").checked = false;
    stopRoundBannerTimer();
    const reasonKey = msg.reason === "target_reached" ? "student.targetReached" : msg.reason === "manual_stop" ? "student.manualStop" : "student.roundEnd";
    const parts = [t3(reasonKey)];
    if (msg.winnerTeam) parts.push(t3("student.winner", { team: msg.winnerTeam }));
    const podium = Array.isArray(msg.rankings) ? msg.rankings.slice(0, 3).map((entry) => `${entry.rank}:${entry.team}`).join(" | ") : "";
    if (podium) parts.push(t3("student.podium", { ranking: podium }));
    setRoundBanner(parts.join(" "), "ended");
  }
  function handleTournamentReset(msg) {
    roundControlEnabled = true;
    roundActive = false;
    roundNumber = 0;
    roundTargetError = null;
    roundEndAt = 0;
    stopAutoDrop();
    document.getElementById("auto-toggle").checked = false;
    stopRoundBannerTimer();
    const defaults2 = msg && msg.defaults ? msg.defaults : {};
    applyRoundDefaults(defaults2);
    setRoundBanner(t3("student.tournamentReset"), "waiting");
  }
  function canPlayCurrentRound() {
    if (!roundControlEnabled) return true;
    return roundActive;
  }
  function drawGrid() {
    simCtx.clearRect(0, 0, SW, SH);
    simCtx.strokeStyle = "#94a3b8";
    simCtx.lineWidth = 1.5;
    for (let x = 0; x <= SW; x += lineD) {
      simCtx.beginPath();
      simCtx.moveTo(x, 0);
      simCtx.lineTo(x, SH);
      simCtx.stroke();
    }
  }
  function drawPreviewNeedle() {
    const halfL = needleL / 2;
    const safePad = 8;
    const clamp2 = (v, min, max) => Math.max(min, Math.min(max, v));
    const safeXMin = halfL + safePad;
    const safeXMax = SW - halfL - safePad;
    const safeYMin = halfL + safePad;
    const safeYMax = SH - halfL - safePad;
    const centerGridLine = Math.round(SW * 0.5 / lineD) * lineD;
    const redX = clamp2(centerGridLine, safeXMin, safeXMax);
    const redY = clamp2(SH * 0.35, safeYMin, safeYMax);
    let greenX = redX + lineD * 0.5;
    if (greenX > safeXMax) greenX = redX - lineD * 0.5;
    greenX = clamp2(greenX, safeXMin, safeXMax);
    const greenY = clamp2(SH * 0.68, safeYMin, safeYMax);
    function drawDashedNeedle(cx, cy, angle, color) {
      const x1 = cx - halfL * Math.cos(angle);
      const x2 = cx + halfL * Math.cos(angle);
      const y1 = cy - halfL * Math.sin(angle);
      const y2 = cy + halfL * Math.sin(angle);
      simCtx.save();
      simCtx.beginPath();
      simCtx.setLineDash([8, 5]);
      simCtx.lineCap = "round";
      simCtx.strokeStyle = color;
      simCtx.lineWidth = 3.2;
      simCtx.shadowColor = color;
      simCtx.shadowBlur = 5;
      simCtx.moveTo(x1, y1);
      simCtx.lineTo(x2, y2);
      simCtx.stroke();
      simCtx.restore();
    }
    drawDashedNeedle(redX, redY, 0, "rgba(239,68,68,0.98)");
    drawDashedNeedle(greenX, greenY, Math.PI / 2, "rgba(34,197,94,0.98)");
  }
  function dropNeedles(count) {
    if (drops === 0) {
      drawGrid();
    }
    for (let i = 0; i < count; i++) {
      const x = Math.random() * SW, y = Math.random() * SH;
      const a = Math.random() * Math.PI;
      const x1 = x - needleL / 2 * Math.cos(a), x2 = x + needleL / 2 * Math.cos(a);
      const y1 = y - needleL / 2 * Math.sin(a), y2 = y + needleL / 2 * Math.sin(a);
      const hit = Math.floor(x1 / lineD) !== Math.floor(x2 / lineD);
      if (hit) hits++;
      drops++;
      simCtx.beginPath();
      simCtx.strokeStyle = hit ? "rgba(220,38,38,0.78)" : "rgba(22,163,74,0.72)";
      simCtx.lineWidth = 2;
      simCtx.moveTo(x1, y1);
      simCtx.lineTo(x2, y2);
      simCtx.stroke();
    }
    const piEst = hits > 0 ? 2 * needleL * drops / (lineD * hits) : null;
    if (piEst) history.push({ n: drops, pi: parseFloat(piEst.toFixed(5)) });
    if (history.length > 500) {
      const s = Math.ceil(history.length / 500);
      history = history.filter((_, i) => i % s === 0);
    }
    updateStats(piEst);
    drawChart();
    sendUpdate();
  }
  function doStep() {
    if (!canPlayCurrentRound()) return;
    dropNeedles(stepN);
  }
  function stopAutoDrop() {
    if (autoDropTimer !== null) {
      clearInterval(autoDropTimer);
      autoDropTimer = null;
    }
  }
  function startAutoDrop() {
    if (!canPlayCurrentRound()) return;
    stopAutoDrop();
    autoDropTimer = setInterval(() => {
      dropNeedles(stepN);
    }, 100);
  }
  function toggleAutoDrop(enabled) {
    if (enabled && !canPlayCurrentRound()) {
      document.getElementById("auto-toggle").checked = false;
      return;
    }
    if (enabled) {
      startAutoDrop();
    } else {
      stopAutoDrop();
    }
  }
  function updateStats(piEst) {
    document.getElementById("s-drops").textContent = drops.toLocaleString();
    document.getElementById("s-hits").textContent = hits.toLocaleString();
    document.getElementById("s-miss").textContent = (drops - hits).toLocaleString();
    document.getElementById("s-pi").textContent = piEst ? piEst.toFixed(5) : "\u03B2\u20AC\u201D";
    document.getElementById("s-err").textContent = piEst ? Math.abs(piEst - Math.PI).toFixed(6) : "\u03B2\u20AC\u201D";
    document.getElementById("f-l").textContent = needleL;
    document.getElementById("f-d").textContent = lineD;
    document.getElementById("f-n").textContent = drops.toLocaleString();
    document.getElementById("f-h").textContent = hits.toLocaleString();
    document.getElementById("f-result").textContent = piEst ? piEst.toFixed(4) : "\u03B2\u20AC\u201D";
    const r = (needleL / lineD).toFixed(2), ok = needleL <= lineD;
    document.getElementById("ratio-badge").innerHTML = `<span style="color:${ok ? "#34d399" : "#fbbf24"}">l/d=${r} ${ok ? "\u03B2\x9C\u201C" : "\u03B2\x9A\xA0"}</span>`;
  }
  function drawChart() {
    const body = document.getElementById("chart-body");
    if (!body.classList.contains("open")) return;
    const cw = body.clientWidth - 4, ch = 148;
    chartCv.width = cw;
    chartCv.height = ch;
    const PAD = { top: 8, right: 18, bottom: 28, left: 38 };
    const pw = cw - PAD.left - PAD.right, ph = ch - PAD.top - PAD.bottom;
    chartCtx.clearRect(0, 0, cw, ch);
    chartCtx.fillStyle = "#141720";
    chartCtx.beginPath();
    chartCtx.roundRect(0, 0, cw, ch, 6);
    chartCtx.fill();
    const xMax = Math.max(10, drops), xMin = 0, xRange = xMax;
    const toX = (n) => PAD.left + (n - xMin) / xRange * pw;
    const toY = (pi) => PAD.top + (1 - (pi - Y_MIN) / (Y_MAX - Y_MIN)) * ph;
    chartCtx.save();
    chartCtx.beginPath();
    chartCtx.rect(PAD.left, PAD.top, pw, ph);
    chartCtx.clip();
    chartCtx.strokeStyle = "#2d3348";
    chartCtx.lineWidth = 0.8;
    chartCtx.setLineDash([]);
    [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].forEach((y) => {
      chartCtx.beginPath();
      chartCtx.moveTo(PAD.left, toY(y));
      chartCtx.lineTo(PAD.left + pw, toY(y));
      chartCtx.stroke();
    });
    const pyp = toY(Math.PI);
    chartCtx.strokeStyle = "#fbbf24";
    chartCtx.lineWidth = 1.2;
    chartCtx.setLineDash([4, 4]);
    chartCtx.beginPath();
    chartCtx.moveTo(PAD.left, pyp);
    chartCtx.lineTo(PAD.left + pw, pyp);
    chartCtx.stroke();
    chartCtx.setLineDash([]);
    if (history.length >= 1) {
      chartCtx.strokeStyle = "#34d399";
      chartCtx.lineWidth = 1.5;
      chartCtx.beginPath();
      history.forEach((pt, i) => {
        const x = toX(pt.n), y = toY(pt.pi);
        i === 0 ? chartCtx.moveTo(x, y) : chartCtx.lineTo(x, y);
      });
      chartCtx.stroke();
    }
    chartCtx.restore();
    chartCtx.fillStyle = "#fbbf24";
    chartCtx.font = "9px Courier New";
    chartCtx.textAlign = "left";
    chartCtx.fillText("\u039F\u20AC", PAD.left + pw + 3, pyp + 3);
    chartCtx.strokeStyle = "#475569";
    chartCtx.lineWidth = 1;
    chartCtx.beginPath();
    chartCtx.moveTo(PAD.left, PAD.top);
    chartCtx.lineTo(PAD.left, PAD.top + ph);
    chartCtx.lineTo(PAD.left + pw, PAD.top + ph);
    chartCtx.stroke();
    chartCtx.fillStyle = "#475569";
    chartCtx.font = "9px Courier New";
    chartCtx.textAlign = "right";
    [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].forEach((y) => chartCtx.fillText(y.toFixed(1), PAD.left - 4, toY(y) + 3));
    chartCtx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const n = Math.round(xRange * i / 5);
      chartCtx.fillText(n >= 1e3 ? `${Math.round(n / 1e3)}k` : n, toX(n), PAD.top + ph + 14);
    }
    chartCtx.fillText(t3("drops"), PAD.left + pw / 2, ch - 4);
  }
  function resetAll() {
    drops = 0;
    hits = 0;
    history = [];
    drawGrid();
    drawPreviewNeedle();
    updateStats(null);
    drawChart();
    sendUpdate();
  }
  function setL(v) {
    needleL = Math.min(120, Math.max(10, v));
    document.getElementById("val-l").textContent = needleL;
    document.getElementById("range-l").value = needleL;
    document.getElementById("f-l").textContent = needleL;
    resetAll();
  }
  function changeL(d) {
    setL(needleL + d);
  }
  function setD(v) {
    lineD = Math.min(150, Math.max(30, v));
    document.getElementById("val-d").textContent = lineD;
    document.getElementById("range-d").value = lineD;
    document.getElementById("f-d").textContent = lineD;
    resetAll();
  }
  function changeD(d) {
    setD(lineD + d);
  }
  function setStep(v) {
    stepN = Math.min(1e3, Math.max(1, v));
    document.getElementById("step-val").textContent = stepN;
    document.getElementById("range-step").value = stepN;
    document.getElementById("step-btn").textContent = t3("student.stepButton", { count: stepN });
  }
  function changeStep(d) {
    setStep(stepN + d);
  }
  function initStudentApp() {
    if (!localOnly) ensureRegisteredTeamName();
    setRoundBanner(t3("student.freeExperiment"), "waiting");
    if (!localOnly) connectWS();
    updateConnDot();
    setStep(stepN);
    drawGrid();
    drawPreviewNeedle();
    updateStats(null);
  }
  const handleIdentityChange = (event) => {
    const nextName = event?.detail?.name?.trim();
    if (!nextName) return;
    teamName = nextName;
    teamRegistered = false;
    roundControlEnabled = false;
    if (!localOnly && classroomApi && classroomApi.isConnected()) registerTeam();
    else updateConnDot();
  };
  window.addEventListener("strobe:identity-change", handleIdentityChange);
  const handleLanguageChange = () => {
    updateConnDot();
    setStep(stepN);
    if (roundActive) updateActiveRoundBanner();
    else if (socketConnected && teamRegistered) setRoundBanner(t3("student.connected"), "waiting");
    else if (!socketConnected) setRoundBanner(t3("student.disconnected"), "waiting");
  };
  window.StrobeI18n?.on("languageChanged", handleLanguageChange);
  const handleBeforeUnload = () => {
    stopAutoDrop();
    stopRoundBannerTimer();
  };
  window.addEventListener("beforeunload", handleBeforeUnload);
  initStudentApp();
  const globalFns = {
    registerTeam,
    changeL,
    setL,
    changeD,
    setD,
    changeStep,
    setStep,
    doStep,
    toggleAutoDrop,
    resetAll
  };
  Object.assign(window, globalFns);
  return () => {
    cleanupAccordions();
    stopAutoDrop();
    stopRoundBannerTimer();
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener("strobe:identity-change", handleIdentityChange);
    window.StrobeI18n?.off("languageChanged", handleLanguageChange);
    if (classroomApi && typeof classroomApi.stop === "function") {
      classroomApi.stop();
    }
    Object.keys(globalFns).forEach((key) => {
      if (window[key] === globalFns[key]) {
        delete window[key];
      }
    });
  };
}

// client/src/workshops/buffon-needle/logic/teacher-logic.js
function mountBuffonTeacher(t3, onStandingsChange = () => {
}) {
  let classroomApi = null;
  let students = [];
  let previousLiveRanks = /* @__PURE__ */ new Map();
  let previousTotalRanks = /* @__PURE__ */ new Map();
  let latestLiveSorted = [];
  let teamHistories = /* @__PURE__ */ new Map();
  let teamPoints = /* @__PURE__ */ new Map();
  let lastRoundPoints = /* @__PURE__ */ new Map();
  let currentRound = 0;
  let roundActive = false;
  let roundEndAt = 0;
  let roundTimerId = null;
  let roundEndScheduled = false;
  let lockedWinnerTeam = "";
  let lastRoundWinnerTeam = "";
  let targetReachedAt = /* @__PURE__ */ new Map();
  const roundConfig = {
    timeSec: 60,
    targetError: 5e-3
  };
  const TEACHER_Y_MIN = 1.5;
  const TEACHER_Y_MAX = 5;
  const teacherChartCv = document.getElementById("teacher-chart-cv");
  const teacherChartCtx = teacherChartCv.getContext("2d");
  function connectWS() {
    if (!window.SharedClassroomApi || typeof window.SharedClassroomApi.createClient !== "function") {
      setRoundStatus(t3("needApi"), "ended");
      return;
    }
    if (classroomApi) {
      classroomApi.start();
      return;
    }
    classroomApi = window.SharedClassroomApi.createClient({
      wsPath: "/ws/buffon",
      reconnectDelayMs: 2e3,
      onOpen() {
        sendWs({ type: "register_teacher" });
        setRoundStatus(t3("teacherConnected"), roundActive ? "active" : "idle");
      },
      onMessage(type, payload) {
        if (type === "roster") {
          students = Array.isArray(payload && payload.students) ? payload.students : [];
          render();
        }
      },
      onClose() {
        setRoundStatus(t3("student.disconnected"), "ended");
      }
    });
    classroomApi.start();
  }
  function sendWs(payload) {
    if (!classroomApi || !payload || typeof payload !== "object") return;
    if (typeof payload.type === "string" && payload.type.trim()) {
      const type = payload.type;
      const data = { ...payload };
      delete data.type;
      classroomApi.send(type, data);
    }
  }
  function updateRoundActionButtons() {
    const startBtn = document.getElementById("round-start-btn");
    const stopBtn = document.getElementById("round-stop-btn");
    if (startBtn) startBtn.disabled = roundActive;
    if (stopBtn) stopBtn.disabled = !roundActive;
  }
  function sliderToTarget(sliderValue) {
    const raw = Number.parseInt(sliderValue, 10);
    const safe = Number.isInteger(raw) ? raw : 5;
    return Math.max(1e-3, Math.min(0.01, safe / 1e3));
  }
  function updateRoundControlLabels() {
    const timeSlider = document.getElementById("round-time-slider");
    const targetSlider = document.getElementById("round-target-slider");
    const timeSec = Number.parseInt(timeSlider.value, 10) || 60;
    const target = sliderToTarget(targetSlider.value);
    document.getElementById("round-time-value").textContent = `${timeSec} ${t3("seconds")}`;
    document.getElementById("round-target-value").textContent = target.toFixed(3);
  }
  function updateTimerLabel() {
    const timerEl = document.getElementById("round-timer");
    if (!roundActive) {
      timerEl.textContent = "\u03B2\u20AC\u201D";
      return;
    }
    const secondsLeft = Math.max(0, Math.ceil((roundEndAt - Date.now()) / 1e3));
    timerEl.textContent = `${secondsLeft} ${t3("seconds")}`;
  }
  function stopRoundTimer() {
    if (roundTimerId !== null) {
      clearInterval(roundTimerId);
      roundTimerId = null;
    }
  }
  function startRoundTimer() {
    stopRoundTimer();
    updateTimerLabel();
    roundTimerId = setInterval(() => {
      if (!roundActive) {
        stopRoundTimer();
        return;
      }
      if (Date.now() >= roundEndAt) {
        endRound("time_up");
        return;
      }
      updateTimerLabel();
    }, 200);
  }
  function setRoundStatus(text, mode) {
    const statusEl = document.getElementById("round-status");
    statusEl.textContent = text;
    statusEl.classList.remove("active", "ended");
    if (mode === "active") statusEl.classList.add("active");
    if (mode === "ended") statusEl.classList.add("ended");
  }
  function pointsForRank(rank) {
    if (rank === 1) return 12;
    if (rank === 2) return 10;
    return Math.max(1, 11 - rank);
  }
  function studentKey(student) {
    return String(student && student.team || "");
  }
  function hasPiEstimate(student) {
    return typeof student.piEst === "number" && Number.isFinite(student.piEst);
  }
  function getStudentError(student) {
    return hasPiEstimate(student) ? Math.abs(student.piEst - Math.PI) : null;
  }
  function sortStudentsByPerformance(list) {
    return [...list].sort((a, b) => {
      const aHasPi = hasPiEstimate(a);
      const bHasPi = hasPiEstimate(b);
      if (aHasPi !== bHasPi) return aHasPi ? -1 : 1;
      const ea = aHasPi ? Math.abs(a.piEst - Math.PI) : Infinity;
      const eb = bHasPi ? Math.abs(b.piEst - Math.PI) : Infinity;
      if (ea !== eb) return ea - eb;
      const ad = typeof a.drops === "number" ? a.drops : 0;
      const bd = typeof b.drops === "number" ? b.drops : 0;
      if (ad !== bd) return bd - ad;
      return String(a.team || "").localeCompare(String(b.team || ""), "el");
    });
  }
  function sortStudentsByTotalPoints(list) {
    return [...list].sort((a, b) => {
      const aKey = studentKey(a);
      const bKey = studentKey(b);
      const at = teamPoints.get(aKey) || 0;
      const bt = teamPoints.get(bKey) || 0;
      if (at !== bt) return bt - at;
      const ar = lastRoundPoints.get(aKey) || 0;
      const br = lastRoundPoints.get(bKey) || 0;
      if (ar !== br) return br - ar;
      const ea = getStudentError(a);
      const eb = getStudentError(b);
      const safeEa = ea === null ? Infinity : ea;
      const safeEb = eb === null ? Infinity : eb;
      if (safeEa !== safeEb) return safeEa - safeEb;
      return String(a.team || "").localeCompare(String(b.team || ""), "el");
    });
  }
  function applyLockedWinner(sorted) {
    if (!lockedWinnerTeam) return sorted;
    const idx = sorted.findIndex((s) => studentKey(s) === lockedWinnerTeam);
    if (idx <= 0) return sorted;
    return [sorted[idx], ...sorted.slice(0, idx), ...sorted.slice(idx + 1)];
  }
  function detectTargetReached(sorted) {
    if (!roundActive || roundEndScheduled) return;
    const now = Date.now();
    sorted.forEach((student) => {
      const key = studentKey(student);
      if (!key || targetReachedAt.has(key)) return;
      const err = getStudentError(student);
      if (err !== null && err <= roundConfig.targetError) {
        targetReachedAt.set(key, now);
      }
    });
    if (targetReachedAt.size === 0) return;
    const [winnerEntry] = [...targetReachedAt.entries()].sort((a, b) => a[1] - b[1]);
    if (!winnerEntry) return;
    lockedWinnerTeam = winnerEntry[0];
    roundEndScheduled = true;
    setTimeout(() => endRound("target_reached"), 0);
  }
  function getRoundRanking() {
    return applyLockedWinner(sortStudentsByPerformance(students));
  }
  function startRoundFromTeacher() {
    if (roundActive) return;
    const timeSec = Number.parseInt(document.getElementById("round-time-slider").value, 10) || 60;
    const targetError = sliderToTarget(document.getElementById("round-target-slider").value);
    stopRoundTimer();
    roundActive = true;
    roundEndScheduled = false;
    currentRound += 1;
    roundEndAt = Date.now() + timeSec * 1e3;
    roundConfig.timeSec = Math.max(20, Math.min(120, timeSec));
    roundConfig.targetError = Math.max(1e-3, Math.min(0.01, targetError));
    lockedWinnerTeam = "";
    lastRoundWinnerTeam = "";
    lastRoundPoints = /* @__PURE__ */ new Map();
    targetReachedAt.clear();
    previousLiveRanks = /* @__PURE__ */ new Map();
    previousTotalRanks = /* @__PURE__ */ new Map();
    latestLiveSorted = [];
    teamHistories = /* @__PURE__ */ new Map();
    students = students.map((student) => ({
      ...student,
      drops: 0,
      hits: 0,
      piEst: null
    }));
    document.getElementById("round-info").textContent = t3("roundStartedInfo", { round: currentRound, target: roundConfig.targetError.toFixed(3) });
    document.getElementById("round-result").textContent = t3("scoresReset");
    setRoundStatus(t3("roundStarted", { round: currentRound }), "active");
    updateRoundActionButtons();
    render();
    startRoundTimer();
    sendWs({
      type: "start_round",
      round: currentRound,
      timeSec: roundConfig.timeSec,
      targetError: roundConfig.targetError
    });
  }
  function stopRoundManually() {
    if (!roundActive) return;
    endRound("manual_stop", { awardPoints: true });
  }
  function resetTournamentScores() {
    stopRoundTimer();
    roundActive = false;
    roundEndScheduled = false;
    roundEndAt = 0;
    currentRound = 0;
    lockedWinnerTeam = "";
    lastRoundWinnerTeam = "";
    targetReachedAt.clear();
    previousLiveRanks = /* @__PURE__ */ new Map();
    previousTotalRanks = /* @__PURE__ */ new Map();
    latestLiveSorted = [];
    teamHistories = /* @__PURE__ */ new Map();
    teamPoints = /* @__PURE__ */ new Map();
    lastRoundPoints = /* @__PURE__ */ new Map();
    students = students.map((student) => ({
      ...student,
      drops: 0,
      hits: 0,
      piEst: null
    }));
    document.getElementById("round-info").textContent = `${t3("round")}: -`;
    document.getElementById("round-result").textContent = t3("scoresReset");
    document.getElementById("round-timer").textContent = "\u03B2\u20AC\u201D";
    setRoundStatus(t3("tournamentReset"), "ended");
    updateRoundActionButtons();
    sendWs({ type: "reset_tournament" });
    render();
  }
  function endRound(reason, options = {}) {
    if (!roundActive) return;
    const awardPoints = options.awardPoints !== false;
    roundActive = false;
    roundEndScheduled = false;
    stopRoundTimer();
    const ranking = getRoundRanking();
    lastRoundPoints = /* @__PURE__ */ new Map();
    const awards = ranking.map((student, index) => {
      const team = studentKey(student);
      if (!team) return null;
      const rank = index + 1;
      const points = awardPoints ? pointsForRank(rank) : 0;
      lastRoundPoints.set(team, points);
      if (awardPoints) {
        const total = (teamPoints.get(team) || 0) + points;
        teamPoints.set(team, total);
      }
      return {
        rank,
        team,
        points,
        error: getStudentError(student)
      };
    }).filter(Boolean);
    lastRoundWinnerTeam = awards.length ? awards[0].team : "";
    const reasonText = reason === "target_reached" ? t3("student.targetReached") : reason === "manual_stop" ? t3("student.manualStop") : t3("student.roundEnd");
    const podium = awards.slice(0, 3).map((entry) => `${entry.rank}. ${entry.team} (+${entry.points})`).join(" | ");
    document.getElementById("round-info").textContent = t3("roundCompletedInfo", { round: currentRound });
    document.getElementById("round-result").textContent = podium || t3("noResults");
    setRoundStatus(reasonText, "ended");
    document.getElementById("round-timer").textContent = `0 ${t3("seconds")}`;
    updateRoundActionButtons();
    sendWs({
      type: "end_round",
      round: currentRound,
      reason,
      winnerTeam: lastRoundWinnerTeam,
      targetError: roundConfig.targetError,
      rankings: awards
    });
    targetReachedAt.clear();
    lockedWinnerTeam = "";
    previousLiveRanks = /* @__PURE__ */ new Map();
    previousTotalRanks = /* @__PURE__ */ new Map();
    render();
  }
  function render() {
    const liveBody = document.getElementById("live-board-body") || { innerHTML: "" };
    const totalBody = document.getElementById("total-board-body") || { innerHTML: "" };
    if (students.length === 0) {
      onStandingsChange([]);
      liveBody.innerHTML = `<div class="empty">${t3("noTeams")}</div>`;
      totalBody.innerHTML = `<div class="empty">${t3("noTeams")}</div>`;
      latestLiveSorted = [];
      previousLiveRanks = /* @__PURE__ */ new Map();
      previousTotalRanks = /* @__PURE__ */ new Map();
      teamHistories.clear();
      drawTeacherChart();
      return;
    }
    const baseLiveSorted = sortStudentsByPerformance(students);
    if (roundActive) detectTargetReached(baseLiveSorted);
    const liveSorted = roundActive ? applyLockedWinner(baseLiveSorted) : baseLiveSorted;
    const totalSorted = sortStudentsByTotalPoints(students);
    const totalRanks = new Map(totalSorted.map((student, index) => [studentKey(student), index + 1]));
    onStandingsChange(liveSorted.map((student, index) => {
      const key = studentKey(student);
      const hasPi = hasPiEstimate(student);
      return {
        id: key,
        name: student.team,
        isConnected: true,
        liveRank: index + 1,
        totalRank: totalRanks.get(key) || "-",
        piEstimate: hasPi ? student.piEst.toFixed(5) : "-",
        error: hasPi ? Math.abs(student.piEst - Math.PI).toFixed(6) : "-",
        drops: (student.drops || 0).toLocaleString(),
        hits: (student.hits || 0).toLocaleString(),
        misses: Math.max(0, (student.drops || 0) - (student.hits || 0)).toLocaleString(),
        roundPoints: roundActive ? "-" : currentRound > 0 ? (lastRoundPoints.get(key) || 0).toLocaleString() : "-",
        totalPoints: (teamPoints.get(key) || 0).toLocaleString()
      };
    }));
    const liveMovement = /* @__PURE__ */ new Map();
    liveSorted.forEach((student, idx) => {
      const key = studentKey(student);
      const prevIndex = previousLiveRanks.has(key) ? previousLiveRanks.get(key) : null;
      liveMovement.set(key, prevIndex === null ? null : prevIndex - idx);
    });
    const totalMovement = /* @__PURE__ */ new Map();
    totalSorted.forEach((student, idx) => {
      const key = studentKey(student);
      const prevIndex = previousTotalRanks.has(key) ? previousTotalRanks.get(key) : null;
      totalMovement.set(key, prevIndex === null ? null : prevIndex - idx);
    });
    liveBody.innerHTML = liveSorted.map((student, idx) => {
      const key = studentKey(student);
      const delta = liveMovement.get(key);
      const hasPi = hasPiEstimate(student);
      const err = hasPi ? Math.abs(student.piEst - Math.PI).toFixed(6) : "\u03B2\u20AC\u201D";
      const piStr = hasPi ? student.piEst.toFixed(5) : "\u03B2\u20AC\u201D";
      const miss = Math.max(0, (student.drops || 0) - (student.hits || 0));
      const movementClass = !hasPi ? " pending" : delta > 0 ? " rank-up" : delta < 0 ? " rank-down" : "";
      return `
      <div class="board-row live-board-row${movementClass}">
        <span class="rank" style="color:${hasPi ? getSeriesColor(idx) : "#64748b"}">${idx + 1}</span>
        <span class="team-name">${esc(student.team)}</span>
        <span class="pi-val">${piStr}</span>
        <span class="err-val">${err}</span>
        <span class="drops-val">${(student.drops || 0).toLocaleString()}</span>
        <span class="hits-val">${(student.hits || 0).toLocaleString()}</span>
        <span class="miss-val">${miss.toLocaleString()}</span>
      </div>`;
    }).join("");
    totalBody.innerHTML = totalSorted.map((student, idx) => {
      const key = studentKey(student);
      const delta = totalMovement.get(key);
      const roundPoints = roundActive ? "\u03B2\u20AC\u201D" : currentRound > 0 ? (lastRoundPoints.get(key) || 0).toLocaleString() : "\u03B2\u20AC\u201D";
      const totalPoints = (teamPoints.get(key) || 0).toLocaleString();
      const movementClass = delta > 0 ? " rank-up" : delta < 0 ? " rank-down" : "";
      const winnerClass = !roundActive && key && key === lastRoundWinnerTeam ? " round-winner" : "";
      return `
      <div class="board-row score-board-row${movementClass}${winnerClass}">
        <span class="rank" style="color:#60a5fa">${idx + 1}</span>
        <span class="team-name">${esc(student.team)}</span>
        <span class="round-points-val">${roundPoints}</span>
        <span class="total-points-val">${totalPoints}</span>
      </div>`;
    }).join("");
    latestLiveSorted = liveSorted;
    updateTeamHistories(liveSorted);
    drawTeacherChart();
    previousLiveRanks = new Map(liveSorted.map((student, idx) => [studentKey(student), idx]));
    previousTotalRanks = new Map(totalSorted.map((student, idx) => [studentKey(student), idx]));
  }
  function esc(text) {
    return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function getSeriesColor(index) {
    const palette = ["#fbbf24", "#94a3b8", "#cd7c3a", "#3b82f6", "#a78bfa", "#f87171", "#34d399", "#f97316", "#38bdf8", "#e879f9"];
    return palette[index % palette.length];
  }
  function updateTeamHistories(sorted) {
    const activeKeys = new Set(sorted.map(studentKey));
    for (const key of Array.from(teamHistories.keys())) {
      if (!activeKeys.has(key)) teamHistories.delete(key);
    }
    sorted.forEach((student) => {
      const key = studentKey(student);
      const drops = typeof student.drops === "number" ? student.drops : 0;
      if (drops <= 0) {
        teamHistories.set(key, []);
        return;
      }
      if (!hasPiEstimate(student)) return;
      const pi = student.piEst;
      const points = teamHistories.get(key) || [];
      const last = points[points.length - 1];
      if (!last || drops > last.n || Math.abs(pi - last.pi) > 1e-12) {
        points.push({ n: drops, pi });
        if (points.length > 500) {
          const skip = Math.ceil(points.length / 500);
          teamHistories.set(key, points.filter((_, idx) => idx % skip === 0));
        } else {
          teamHistories.set(key, points);
        }
      }
    });
  }
  function drawTeacherChart() {
    const body = document.getElementById("teacher-chart-body");
    if (!body.classList.contains("open")) return;
    const cw = Math.max(340, body.clientWidth - 4);
    const ch = 172;
    teacherChartCv.width = cw;
    teacherChartCv.height = ch;
    const PAD = { top: 10, right: 18, bottom: 30, left: 40 };
    const pw = cw - PAD.left - PAD.right;
    const ph = ch - PAD.top - PAD.bottom;
    teacherChartCtx.clearRect(0, 0, cw, ch);
    teacherChartCtx.fillStyle = "#141720";
    teacherChartCtx.beginPath();
    teacherChartCtx.roundRect(0, 0, cw, ch, 6);
    teacherChartCtx.fill();
    const activeSeries = latestLiveSorted.filter(hasPiEstimate).map((student, idx) => {
      const key = studentKey(student);
      const points = (teamHistories.get(key) || []).filter((pt) => pt.n > 0);
      return {
        rank: idx + 1,
        team: String(student.team || ""),
        color: getSeriesColor(idx),
        points
      };
    }).filter((series) => series.points.length > 0);
    if (!activeSeries.length) {
      teacherChartCtx.fillStyle = "#64748b";
      teacherChartCtx.font = "12px Courier New";
      teacherChartCtx.textAlign = "center";
      teacherChartCtx.fillText(t3("noEstimates"), cw / 2, ch / 2);
      return;
    }
    let xMax = 10;
    activeSeries.forEach((series) => {
      series.points.forEach((pt) => {
        if (pt.n > xMax) xMax = pt.n;
      });
    });
    const toX = (n) => PAD.left + n / xMax * pw;
    const toY = (pi) => PAD.top + (1 - (pi - TEACHER_Y_MIN) / (TEACHER_Y_MAX - TEACHER_Y_MIN)) * ph;
    teacherChartCtx.save();
    teacherChartCtx.beginPath();
    teacherChartCtx.rect(PAD.left, PAD.top, pw, ph);
    teacherChartCtx.clip();
    teacherChartCtx.strokeStyle = "#2d3348";
    teacherChartCtx.lineWidth = 0.8;
    teacherChartCtx.setLineDash([]);
    [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].forEach((y) => {
      teacherChartCtx.beginPath();
      teacherChartCtx.moveTo(PAD.left, toY(y));
      teacherChartCtx.lineTo(PAD.left + pw, toY(y));
      teacherChartCtx.stroke();
    });
    const piY = toY(Math.PI);
    teacherChartCtx.strokeStyle = "#fbbf24";
    teacherChartCtx.lineWidth = 1.2;
    teacherChartCtx.setLineDash([4, 4]);
    teacherChartCtx.beginPath();
    teacherChartCtx.moveTo(PAD.left, piY);
    teacherChartCtx.lineTo(PAD.left + pw, piY);
    teacherChartCtx.stroke();
    teacherChartCtx.setLineDash([]);
    activeSeries.forEach((series) => {
      teacherChartCtx.strokeStyle = series.color;
      teacherChartCtx.lineWidth = 1.6;
      teacherChartCtx.beginPath();
      series.points.forEach((pt, idx) => {
        const x = toX(pt.n);
        const y = toY(pt.pi);
        if (idx === 0) teacherChartCtx.moveTo(x, y);
        else teacherChartCtx.lineTo(x, y);
      });
      teacherChartCtx.stroke();
      const last = series.points[series.points.length - 1];
      teacherChartCtx.fillStyle = series.color;
      teacherChartCtx.beginPath();
      teacherChartCtx.arc(toX(last.n), toY(last.pi), 2.8, 0, Math.PI * 2);
      teacherChartCtx.fill();
    });
    teacherChartCtx.restore();
    teacherChartCtx.fillStyle = "#fbbf24";
    teacherChartCtx.font = "9px Courier New";
    teacherChartCtx.textAlign = "left";
    teacherChartCtx.fillText("\u039F\u20AC", PAD.left + pw + 3, piY + 3);
    teacherChartCtx.strokeStyle = "#475569";
    teacherChartCtx.lineWidth = 1;
    teacherChartCtx.beginPath();
    teacherChartCtx.moveTo(PAD.left, PAD.top);
    teacherChartCtx.lineTo(PAD.left, PAD.top + ph);
    teacherChartCtx.lineTo(PAD.left + pw, PAD.top + ph);
    teacherChartCtx.stroke();
    teacherChartCtx.fillStyle = "#475569";
    teacherChartCtx.font = "9px Courier New";
    teacherChartCtx.textAlign = "right";
    [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].forEach((y) => {
      teacherChartCtx.fillText(y.toFixed(1), PAD.left - 4, toY(y) + 3);
    });
    teacherChartCtx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const n = Math.round(xMax * i / 5);
      const label = n >= 1e3 ? `${Math.round(n / 1e3)}k` : n;
      teacherChartCtx.fillText(label, toX(n), PAD.top + ph + 14);
    }
    teacherChartCtx.fillText(t3("drops"), PAD.left + pw / 2, ch - 4);
    let lx = PAD.left;
    let ly = PAD.top + 12;
    teacherChartCtx.font = "9px Courier New";
    teacherChartCtx.textAlign = "left";
    activeSeries.slice(0, 8).forEach((series) => {
      teacherChartCtx.fillStyle = series.color;
      teacherChartCtx.fillRect(lx, ly - 7, 8, 8);
      teacherChartCtx.fillStyle = "#94a3b8";
      teacherChartCtx.fillText(`#${series.rank} ${series.team}`, lx + 12, ly);
      ly += 12;
    });
  }
  updateRoundControlLabels();
  updateRoundActionButtons();
  setRoundStatus(t3("initialTeacherStatus"), "idle");
  const handleLanguageChange = () => {
    setRoundStatus(roundActive ? t3("roundStarted", { round: currentRound }) : classroomApi?.isConnected() ? t3("teacherConnected") : t3("student.disconnected"), roundActive ? "active" : "idle");
    updateRoundControlLabels();
  };
  window.StrobeI18n?.on("languageChanged", handleLanguageChange);
  connectWS();
  window.addEventListener("resize", drawTeacherChart);
  const globalFns = {
    startRoundFromTeacher,
    stopRoundManually,
    resetTournamentScores,
    updateRoundControlLabels,
    drawBuffonTeacherChart: drawTeacherChart
  };
  Object.assign(window, globalFns);
  return () => {
    stopRoundTimer();
    if (classroomApi && typeof classroomApi.stop === "function") {
      classroomApi.stop();
    }
    window.removeEventListener("resize", drawTeacherChart);
    window.StrobeI18n?.off("languageChanged", handleLanguageChange);
    Object.keys(globalFns).forEach((key) => {
      if (window[key] === globalFns[key]) {
        delete window[key];
      }
    });
  };
}

// client/src/workshops/buffon-needle/App.jsx
function App({ role = "teacher" }) {
  const rootRef = (0, import_react49.useRef)(null);
  const settingsHostRef = (0, import_react49.useRef)(null);
  const { t: tInterface } = useTranslation("interface");
  const { t: tNav } = useTranslation("navigation");
  const tBuffon = (key, options) => tInterface(`workshops.buffon.${key}`, options);
  const [standings, setStandings] = import_react49.default.useState([]);
  (0, import_react49.useEffect)(() => {
    const rootElement = rootRef.current;
    if (!rootElement) return void 0;
    if (role === "student") {
      rootElement.innerHTML = studentTemplate;
      if (settingsHostRef.current) settingsHostRef.current.innerHTML = "";
    } else {
      rootElement.innerHTML = studentTemplate;
      if (settingsHostRef.current) settingsHostRef.current.innerHTML = teacherSettingsTemplate;
    }
    applyTemplateTranslations(rootElement, role === "teacher" ? "student" : role, tBuffon, true, settingsHostRef.current);
    if (role === "teacher") {
      applyTemplateTranslations(rootElement, "teacher", tBuffon, true, settingsHostRef.current);
    }
    const cleanups = role === "student" ? [mountBuffonStudent(rootElement, translateBuffon)] : [
      mountBuffonStudent(rootElement, translateBuffon, { localOnly: true }),
      mountBuffonTeacher(translateBuffon, setStandings)
    ];
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      window.MathJax.typesetPromise([rootElement]).catch(() => {
      });
    }
    return () => {
      cleanups.forEach((cleanup) => {
        if (typeof cleanup === "function") cleanup();
      });
      rootElement.innerHTML = "";
      if (settingsHostRef.current) settingsHostRef.current.innerHTML = "";
    };
  }, [role]);
  (0, import_react49.useEffect)(() => {
    if (rootRef.current) {
      applyTemplateTranslations(rootRef.current, role === "teacher" ? "student" : role, tBuffon, false, settingsHostRef.current);
      if (role === "teacher") {
        applyTemplateTranslations(rootRef.current, "teacher", tBuffon, false, settingsHostRef.current);
      }
    }
  }, [role, tBuffon]);
  return /* @__PURE__ */ import_react49.default.createElement(import_react49.default.Fragment, null, /* @__PURE__ */ import_react49.default.createElement(
    HeroTitle,
    {
      title: `${tNav("items.buffon")} - ${role === "student" ? tBuffon("studentTitle") : tBuffon("teacherTitle")}`
    }
  ), /* @__PURE__ */ import_react49.default.createElement("section", { className: "common-zone lab-zone" }, /* @__PURE__ */ import_react49.default.createElement(FullScreenButton, null), /* @__PURE__ */ import_react49.default.createElement(TheoryButton, { theory: getTheoryPath(theory_references_default.activity.theoryId) }), /* @__PURE__ */ import_react49.default.createElement("div", { ref: rootRef, className: `buffon-content ${role === "teacher" ? "student teacher-preview" : "student"}` })), role === "teacher" ? /* @__PURE__ */ import_react49.default.createElement(import_react49.default.Fragment, null, /* @__PURE__ */ import_react49.default.createElement("div", { ref: settingsHostRef, className: "buffon-settings-host buffon-content teacher" }), /* @__PURE__ */ import_react49.default.createElement(
    GroupsAccordion,
    {
      participants: standings,
      columns: [
        { key: "liveRank", label: tBuffon("liveRank"), render: (entry) => entry.liveRank },
        { key: "totalRank", label: tBuffon("totalRank"), render: (entry) => entry.totalRank },
        { key: "estimate", label: tBuffon("estimate"), render: (entry) => entry.piEstimate },
        { key: "error", label: tBuffon("error"), render: (entry) => entry.error },
        { key: "drops", label: tBuffon("drops"), render: (entry) => entry.drops },
        { key: "hits", label: tBuffon("hits"), render: (entry) => entry.hits },
        { key: "misses", label: tBuffon("misses"), render: (entry) => entry.misses },
        { key: "roundPoints", label: tBuffon("roundPoints"), render: (entry) => entry.roundPoints },
        { key: "totalPoints", label: tBuffon("total"), render: (entry) => entry.totalPoints }
      ],
      emptyMessage: tBuffon("noTeams")
    }
  ), /* @__PURE__ */ import_react49.default.createElement(
    Accordion,
    {
      title: tBuffon("student.chart"),
      className: "chart-wrap",
      onToggle: (isOpen) => {
        if (isOpen) window.requestAnimationFrame(() => window.drawBuffonTeacherChart?.());
      }
    },
    /* @__PURE__ */ import_react49.default.createElement("div", { id: "teacher-chart-body", className: "chart-body open" }, /* @__PURE__ */ import_react49.default.createElement("canvas", { id: "teacher-chart-cv" }))
  )) : null);
}
function applyTemplateTranslations(rootElement, role, t3, initialize = false, settingsRoot = null) {
  const setText = (selector, key, options) => {
    const element = settingsRoot?.querySelector(selector) || rootElement.querySelector(selector);
    if (element) element.textContent = t3(key, options);
  };
  if (role === "student") {
    if (initialize) setText(".round-banner", "student.waiting");
    setText(".vspinner:first-child .lbl", "student.needleLength");
    setText(".vspinner:last-child .lbl", "student.lineSpacing");
    setText(".step-col .lbl", "student.stepLabel");
    const stepCount = Number.parseInt(rootElement.querySelector("#step-val")?.textContent, 10) || 1;
    setText("#step-btn", "student.stepButton", { count: stepCount });
    setText(".auto-lbl", "student.automatic");
    setText(".btn-danger", "student.reset");
    const rangeLabels = rootElement.querySelectorAll(".vspinner .range-labels");
    if (rangeLabels[0]) rangeLabels[0].textContent = "10-120";
    if (rangeLabels[1]) rangeLabels[1].textContent = "30-150";
    setText('[data-accordion-id="student-formula"] .c-lbl', "student.formula");
    setText('[data-accordion-id="student-chart"] .c-lbl', "student.chart");
    const footerLabels = rootElement.querySelectorAll(".canvas-footer > span");
    if (footerLabels[0]) footerLabels[0].textContent = t3("student.hit");
    if (footerLabels[1]) footerLabels[1].textContent = t3("student.miss");
    const statLabels = rootElement.querySelectorAll(".stat-box .s-lbl");
    ["student.estimateError", "hits", "misses", "drops"].forEach((key, index) => {
      if (statLabels[index + 1]) statLabels[index + 1].textContent = t3(key);
    });
  } else {
    const labels = (settingsRoot || rootElement).querySelectorAll(".round-control .lbl");
    if (labels[0]) labels[0].textContent = t3("roundDuration");
    if (labels[1]) labels[1].textContent = t3("targetError");
    const seconds = t3("seconds");
    const scaleLabels = (settingsRoot || rootElement).querySelectorAll(".round-control .scale span");
    if (scaleLabels[0]) scaleLabels[0].textContent = `20 ${seconds}`;
    if (scaleLabels[1]) scaleLabels[1].textContent = `120 ${seconds}`;
    setText("#round-start-btn", "startRound");
    setText("#round-stop-btn", "stopRound");
    setText("#round-reset-btn", "resetScores");
    if (initialize) {
      setText("#round-status", "initialTeacherStatus");
      setText("#round-info", "round");
    }
  }
}
function translateBuffon(key, options = {}) {
  return window.StrobeI18n.t(`workshops.buffon.${key}`, { ns: "interface", ...options });
}
var App_default = App;

// client/src/workshops/buffon-needle/StudentView.jsx
function StudentView() {
  return /* @__PURE__ */ import_react50.default.createElement(App_default, { role: "student" });
}
var StudentView_default = StudentView;
export {
  StudentView,
  StudentView_default as default
};
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.development.js:
  (**
   * @license React
   * react-dom.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
