import { r as __toESM, t as __commonJSMin } from "./chunk-BoAXSpZd.js";
import { t as require_react } from "./react.js";
//#region node_modules/react/cjs/react-jsx-runtime.development.js
/**
* @license React
* react-jsx-runtime.development.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_development = /* @__PURE__ */ __commonJSMin(((exports) => {
	(function() {
		function getComponentNameFromType(type) {
			if (null == type) return null;
			if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
			if ("string" === typeof type) return type;
			switch (type) {
				case REACT_FRAGMENT_TYPE: return "Fragment";
				case REACT_PROFILER_TYPE: return "Profiler";
				case REACT_STRICT_MODE_TYPE: return "StrictMode";
				case REACT_SUSPENSE_TYPE: return "Suspense";
				case REACT_SUSPENSE_LIST_TYPE: return "SuspenseList";
				case REACT_ACTIVITY_TYPE: return "Activity";
			}
			if ("object" === typeof type) switch ("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof) {
				case REACT_PORTAL_TYPE: return "Portal";
				case REACT_CONTEXT_TYPE: return type.displayName || "Context";
				case REACT_CONSUMER_TYPE: return (type._context.displayName || "Context") + ".Consumer";
				case REACT_FORWARD_REF_TYPE:
					var innerType = type.render;
					type = type.displayName;
					type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
					return type;
				case REACT_MEMO_TYPE: return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
				case REACT_LAZY_TYPE:
					innerType = type._payload;
					type = type._init;
					try {
						return getComponentNameFromType(type(innerType));
					} catch (x) {}
			}
			return null;
		}
		function testStringCoercion(value) {
			return "" + value;
		}
		function checkKeyStringCoercion(value) {
			try {
				testStringCoercion(value);
				var JSCompiler_inline_result = !1;
			} catch (e) {
				JSCompiler_inline_result = !0;
			}
			if (JSCompiler_inline_result) {
				JSCompiler_inline_result = console;
				var JSCompiler_temp_const = JSCompiler_inline_result.error;
				var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
				JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
				return testStringCoercion(value);
			}
		}
		function getTaskName(type) {
			if (type === REACT_FRAGMENT_TYPE) return "<>";
			if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
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
				if (getter && getter.isReactWarning) return !1;
			}
			return void 0 !== config.key;
		}
		function defineKeyPropWarningGetter(props, displayName) {
			function warnAboutAccessingKey() {
				specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
			}
			warnAboutAccessingKey.isReactWarning = !0;
			Object.defineProperty(props, "key", {
				get: warnAboutAccessingKey,
				configurable: !0
			});
		}
		function elementRefGetterWithDeprecationWarning() {
			var componentName = getComponentNameFromType(this.type);
			didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
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
				enumerable: !1,
				get: elementRefGetterWithDeprecationWarning
			}) : Object.defineProperty(type, "ref", {
				enumerable: !1,
				value: null
			});
			type._store = {};
			Object.defineProperty(type._store, "validated", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: 0
			});
			Object.defineProperty(type, "_debugInfo", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: null
			});
			Object.defineProperty(type, "_debugStack", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: debugStack
			});
			Object.defineProperty(type, "_debugTask", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: debugTask
			});
			Object.freeze && (Object.freeze(type.props), Object.freeze(type));
			return type;
		}
		function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
			var children = config.children;
			if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
				for (isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++) validateChildKeys(children[isStaticChildren]);
				Object.freeze && Object.freeze(children);
			} else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
			else validateChildKeys(children);
			if (hasOwnProperty.call(config, "key")) {
				children = getComponentNameFromType(type);
				var keys = Object.keys(config).filter(function(k) {
					return "key" !== k;
				});
				isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
				didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error("A props object containing a \"key\" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />", isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
			}
			children = null;
			void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
			hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
			if ("key" in config) {
				maybeKey = {};
				for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
			} else maybeKey = config;
			children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
			return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
		}
		function validateChildKeys(node) {
			isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
		}
		function isValidElement(object) {
			return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
		}
		var React = require_react(), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
			return null;
		};
		React = { react_stack_bottom_frame: function(callStackForError) {
			return callStackForError();
		} };
		var specialPropKeyWarningShown;
		var didWarnAboutElementRef = {};
		var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
		var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
		var didWarnAboutKeySpread = {};
		exports.Fragment = REACT_FRAGMENT_TYPE;
		exports.jsx = function(type, config, maybeKey) {
			var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
			return jsxDEVImpl(type, config, maybeKey, !1, trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
		};
		exports.jsxs = function(type, config, maybeKey) {
			var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
			return jsxDEVImpl(type, config, maybeKey, !0, trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
		};
	})();
}));
//#endregion
//#region node_modules/react/jsx-runtime.js
var require_jsx_runtime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_development();
}));
//#endregion
//#region node_modules/@jitsi/react-sdk/lib/constants/index.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_DOMAIN = "meet.jit.si";
var JAAS_STAGING_DOMAIN = "stage.8x8.vc";
var JAAS_PROD_DOMAIN = "8x8.vc";
//#endregion
//#region node_modules/@jitsi/react-sdk/lib/init.js
var __awaiter = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var loadExternalApi = (domain, release, appId) => __awaiter(void 0, void 0, void 0, function* () {
	return new Promise((resolve, reject) => {
		if (window.JitsiMeetExternalAPI) return resolve(window.JitsiMeetExternalAPI);
		const script = document.createElement("script");
		const releaseParam = release ? `?release=${release}` : "";
		const appIdPath = appId ? `${appId}/` : "";
		script.async = true;
		script.src = `https://${domain}/${appIdPath}external_api.js${releaseParam}`;
		script.onload = () => resolve(window.JitsiMeetExternalAPI);
		script.onerror = () => reject(/* @__PURE__ */ new Error(`Script load error: ${script.src}`));
		document.head.appendChild(script);
	});
});
var scriptPromise;
/**
* Injects the external_api.js script for the corresponding domain in DOM
* and resolves with either the `JitsiMeetExternalApi` class definition or an error.
*
* Only the first script will be injected, therefore avoid using multiple instances
* with mixed domains and release version at the same time.
*
* @param {string} domain - The domain of the external API
* @param {string} release - The Jitsi Meet release. Expected format: 'release-1234'
* @param {string} appId - The tenant for JaaS Meetings
* @returns {Promise<JitsiMeetExternalApi>} - The JitsiMeetExternalAPI or an error
*/
var fetchExternalApi = (domain = DEFAULT_DOMAIN, release, appId) => {
	if (scriptPromise) return scriptPromise;
	scriptPromise = loadExternalApi(domain, release, appId);
	return scriptPromise;
};
//#endregion
//#region node_modules/@jitsi/react-sdk/lib/utils/index.js
/**
* Returns the complete room name
*
* @param {string} roomName
* @param {string} tenant
* @returns {string} the complete room name
*/
var getRoomName = (roomName, tenant) => {
	if (tenant) return `${tenant}/${roomName}`;
	return roomName;
};
/**
* Returns the appId or tenant value
*
* @param {string} roomName
* @returns {string|undefined}
*/
var getAppId = (roomName) => {
	const roomParts = roomName.split("/");
	if (roomParts.length <= 1) return;
	return roomParts[0];
};
/**
* Returns the JaaS domain
*
* @param {boolean|undefined} useStaging
* @returns {string} the JaaS domain
*/
var getJaaSDomain = (useStaging) => {
	if (useStaging) return JAAS_STAGING_DOMAIN;
	return JAAS_PROD_DOMAIN;
};
var instancesCounter = 0;
/**
* Generates an unique id
* @param {string} prefix
* @returns {string} the component id
*/
var generateComponentId = (prefix) => `${prefix}-${instancesCounter++}`;
//#endregion
//#region node_modules/@jitsi/react-sdk/lib/components/JitsiMeeting.js
/**
* Returns the JitsiMeeting Component with access to a custom External API
* to be used as-it-is in React projects
*
* @param {IJitsiMeetingProps} props the component's props
* @returns {ReactElement} the `JitsiMeeting` Component
* @example
```js
<JitsiMeeting
domain='meet.jit.si'
roomName: 'TestingJitsiMeetingComponent'
spinner={CustomSpinner}
onApiReady={(externalApi) => console.log(externalApi)}
/>
```
*/
var JitsiMeeting = ({ domain = DEFAULT_DOMAIN, roomName, configOverwrite, interfaceConfigOverwrite, jwt, invitees, devices, userInfo, release, lang, spinner: Spinner, onApiReady, onReadyToClose, getIFrameRef }) => {
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [apiLoaded, setApiLoaded] = (0, import_react.useState)(false);
	const externalApi = (0, import_react.useRef)();
	const apiRef = (0, import_react.useRef)();
	const meetingRef = (0, import_react.useRef)(null);
	const componentId = (0, import_react.useMemo)(() => generateComponentId("jitsiMeeting"), [generateComponentId]);
	(0, import_react.useEffect)(() => {
		fetchExternalApi(domain, release, getAppId(roomName)).then((api) => {
			externalApi.current = api;
			setApiLoaded(true);
		}).catch((e) => console.error(e.message));
	}, []);
	const loadIFrame = (0, import_react.useCallback)((JitsiMeetExternalAPI) => {
		apiRef.current = new JitsiMeetExternalAPI(domain, {
			roomName,
			configOverwrite,
			interfaceConfigOverwrite,
			jwt,
			invitees,
			devices,
			userInfo,
			release,
			lang,
			parentNode: meetingRef.current
		});
		setLoading(false);
		if (apiRef.current) {
			typeof onApiReady === "function" && onApiReady(apiRef.current);
			apiRef.current.on("readyToClose", () => {
				typeof onReadyToClose === "function" && onReadyToClose();
			});
			if (meetingRef.current && typeof getIFrameRef === "function") getIFrameRef(meetingRef.current);
		}
	}, [
		apiRef,
		meetingRef,
		onApiReady,
		onReadyToClose,
		getIFrameRef,
		domain,
		roomName,
		configOverwrite,
		interfaceConfigOverwrite,
		jwt,
		invitees,
		devices,
		userInfo,
		release,
		lang
	]);
	(0, import_react.useEffect)(() => {
		if (apiLoaded && !apiRef.current) {
			if (externalApi.current) loadIFrame(externalApi.current);
		}
	}, [apiLoaded, loadIFrame]);
	return (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [(0, import_react.useCallback)(() => {
		if (!Spinner) return null;
		if (!loading || apiRef.current) return null;
		return (0, import_jsx_runtime.jsx)(Spinner, {}, void 0);
	}, [Spinner, apiRef.current])(), (0, import_jsx_runtime.jsx)("div", {
		id: componentId,
		ref: meetingRef
	}, componentId)] }, void 0);
};
//#endregion
//#region node_modules/@jitsi/react-sdk/lib/components/JaaSMeeting.js
var __rest = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
/**
* Returns the JaaSMeeting Component with access to the 8x8.vc External API
* to be used as-it-is in React projects
*
* @param {IJaaSMeetingProps} props the component's props
* @returns {ReactElement} the `JaaSMeeting` Component
* @example
```js
<JaaSMeeting
roomName: 'TestingJaaSMeetingComponent'
appId='exampleAppId'
spinner={CustomSpinner}
onApiReady={(externalApi) => console.log(externalApi)}
/>
```
*/
var JaaSMeeting = (_a) => {
	var { appId, roomName, useStaging, release } = _a, rest = __rest(_a, [
		"appId",
		"roomName",
		"useStaging",
		"release"
	]);
	return (0, import_jsx_runtime.jsx)(JitsiMeeting, Object.assign({
		domain: getJaaSDomain(useStaging),
		roomName: getRoomName(roomName, appId),
		release
	}, rest), void 0);
};
//#endregion
export { JaaSMeeting, JitsiMeeting };

//# sourceMappingURL=@jitsi_react-sdk.js.map