import "./utils/debug-log";

console.log(`Hubs version: ${process.env.BUILD_VERSION || "?"}`);

import "./assets/stylesheets/hub.scss";

import "aframe";
import "./utils/logging";
import { patchWebGLRenderingContext } from "./utils/webgl";
patchWebGLRenderingContext();

import "three/examples/js/loaders/GLTFLoader";
import "networked-aframe/src/index";
import "naf-janus-adapter";
import "aframe-billboard-component";
import "aframe-rounded";
import "webrtc-adapter";
import "aframe-slice9-component";
import "./utils/audio-context-fix";
import "./utils/threejs-positional-audio-updatematrixworld";
import "./utils/threejs-world-update";
import { detectOS, detect } from "detect-browser";
import { getReticulumFetchUrl } from "./utils/phoenix-utils";

import nextTick from "./utils/next-tick";
import { addAnimationComponents } from "./utils/animation";

import "./components/scene-components";
import "./components/wasd-to-analog2d"; //Might be a behaviour or activator in the future
import "./components/mute-mic";
import "./components/bone-mute-state-indicator";
import "./components/bone-visibility";
import "./components/in-world-hud";
import "./components/virtual-gamepad-controls";
import "./components/ik-controller";
import "./components/hand-controls2";
import "./components/character-controller";
import "./components/hoverable-visuals";
import "./components/hover-visuals";
import "./components/haptic-feedback";
import "./components/offset-relative-to";
import "./components/player-info";
import "./components/debug";
import "./components/hand-poses";
import "./components/hud-controller";
import "./components/freeze-controller";
import "./components/icon-button";
import "./components/text-button";
import "./components/block-button";
import "./components/kick-button";
import "./components/visible-if-permitted";
import "./components/visibility-while-frozen";
import "./components/stats-plus";
import "./components/networked-avatar";
import "./components/media-views";
import "./components/pinch-to-move";
import "./components/pitch-yaw-rotator";
import "./components/position-at-box-shape-border";
import "./components/pinnable";
import "./components/pin-networked-object-button";
import "./components/remove-networked-object-button";
import "./components/camera-focus-button";
import "./components/mirror-camera-button";
import "./components/unmute-video-button";
import "./components/destroy-at-extreme-distances";
import "./components/visible-to-owner";
import "./components/camera-tool";
import "./components/scene-sound";
import "./components/emit-state-change";
import "./components/action-to-event";
import "./components/action-to-remove";
import "./components/emit-scene-event-on-remove";
import "./components/stop-event-propagation";
import "./components/follow-in-fov";
import "./components/matrix-auto-update";
import "./components/clone-media-button";
import "./components/open-media-button";
import "./components/transform-object-button";
import "./components/hover-menu";
import "./components/disable-frustum-culling";
import "./components/teleporter";
import "./components/set-active-camera";
import "./components/track-pose";
import "./components/replay";
import "./components/visibility-by-path";
import { sets as userinputSets } from "./systems/userinput/sets";

import ReactDOM from "react-dom";
import React from "react";
import jwtDecode from "jwt-decode";
import { Router, Route } from "react-router-dom";
import { createBrowserHistory } from "history";
import UIRoot from "./react-components/ui-root";
import AuthChannel from "./utils/auth-channel";
import HubChannel from "./utils/hub-channel";
import LinkChannel from "./utils/link-channel";
import { connectToReticulum } from "./utils/phoenix-utils";
import { disableiOSZoom } from "./utils/disable-ios-zoom";
import { generateMeshBVH, traverseMeshesAndAddShapes, proxiedUrlFor } from "./utils/media-utils";
import MessageDispatch from "./message-dispatch";
import SceneEntryManager from "./scene-entry-manager";
import Subscriptions from "./subscriptions";
import { createInWorldLogMessage } from "./react-components/chat-message";

import "./systems/nav";
import "./systems/personal-space-bubble";
import "./systems/app-mode";
import "./systems/permissions";
import "./systems/exit-on-blur";
import "./systems/camera-tools";
import "./systems/userinput/userinput";
import "./systems/camera-mirror";
import "./systems/userinput/userinput-debug";
import "./systems/frame-scheduler";
import "./systems/ui-hotkeys";
import "./systems/tips";

import "./gltf-component-mappings";

import { App } from "./App";

window.APP = new App();
window.APP.RENDER_ORDER = {
  HUD_BACKGROUND: 1,
  HUD_ICONS: 2,
  CURSOR: 3
};
const store = window.APP.store;
const mediaSearchStore = window.APP.mediaSearchStore;

const qs = new URLSearchParams(location.search);
const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();

THREE.Object3D.DefaultMatrixAutoUpdate = false;
window.APP.quality = qs.get("quality") || (isMobile || isMobileVR) ? "low" : "high";

const Ammo = require("ammo.js/builds/ammo.wasm.js");
const AmmoWasm = require("ammo.js/builds/ammo.wasm.wasm");
window.Ammo = Ammo.bind(undefined, {
  locateFile(path) {
    if (path.endsWith(".wasm")) {
      return AmmoWasm;
    }
    return path;
  }
});
require("aframe-physics-system");
import "super-hands";
import "./components/super-networked-interactable";
import "./components/scalable-when-grabbed";
import "./components/networked-counter";
import "./components/event-repeater";
import "./components/set-yxz-order";
import "./components/set-sounds-invisible";

import "./components/cursor-controller";

import "./components/nav-mesh-helper";

import "./components/tools/pen";
import "./components/tools/networked-drawing";
import "./components/tools/drawing-manager";

import registerNetworkSchemas from "./network-schemas";
import registerTelemetry from "./telemetry";
import { warmSerializeElement } from "./utils/serialize-element";

import { getAvailableVREntryTypes, VR_DEVICE_AVAILABILITY } from "./utils/vr-caps-detect.js";
import detectConcurrentLoad from "./utils/concurrent-load-detector.js";

import qsTruthy from "./utils/qs_truthy";

const isBotMode = qsTruthy("bot");
const isTelemetryDisabled = qsTruthy("disable_telemetry");
const isDebug = qsTruthy("debug");
const loadingEnvironmentURL = proxiedUrlFor(
  "https://uploads-prod.reticulum.io/files/61d77151-7a74-40a6-b427-0c5a350c4502.glb"
);

if (!isBotMode && !isTelemetryDisabled) {
  registerTelemetry("/hub", "Room Landing Page");
}

disableiOSZoom();
detectConcurrentLoad();

store.init();

function getPlatformUnsupportedReason() {
  if (typeof RTCDataChannelEvent === "undefined") return "no_data_channels";
  return null;
}

function setupLobbyCamera() {
  const camera = document.querySelector("#player-camera");
  const previewCamera = document.querySelector("#environment-scene").object3D.getObjectByName("scene-preview-camera");

  if (previewCamera) {
    camera.object3D.position.copy(previewCamera.position);
    camera.object3D.rotation.copy(previewCamera.rotation);
    camera.object3D.rotation.reorder("YXZ");
  } else {
    const cameraPos = camera.object3D.position;
    camera.object3D.position.set(cameraPos.x, 2.5, cameraPos.z);
  }

  camera.object3D.matrixNeedsUpdate = true;

  camera.setAttribute("scene-preview-camera", "positionOnly: true; duration: 60");
  camera.components["pitch-yaw-rotator"].set(camera.object3D.rotation.x, camera.object3D.rotation.y);
}

let uiProps = {};

// Hub ID and slug are the basename
let routerBaseName = document.location.pathname
  .split("/")
  .slice(0, 2)
  .join("/");

if (document.location.pathname.includes("hub.html")) {
  routerBaseName = "";
}

const history = createBrowserHistory({ basename: routerBaseName });

function mountUI(props = {}) {
  const scene = document.querySelector("a-scene");
  const disableAutoExitOnConcurrentLoad = qsTruthy("allow_multi");
  const forcedVREntryType = qs.get("vr_entry_type");
  const isCursorHoldingPen = scene && scene.systems.userinput.activeSets.has(userinputSets.cursorHoldingPen);
  const hasActiveCamera = scene && !!scene.systems["camera-tools"].getMyCamera();

  ReactDOM.render(
    <Router history={history}>
      <Route
        render={routeProps => (
          <UIRoot
            {...{
              scene,
              isBotMode,
              disableAutoExitOnConcurrentLoad,
              forcedVREntryType,
              store,
              mediaSearchStore,
              isCursorHoldingPen,
              hasActiveCamera,
              ...props,
              ...routeProps
            }}
          />
        )}
      />
    </Router>,
    document.getElementById("ui-root")
  );
}

function remountUI(props) {
  uiProps = { ...uiProps, ...props };
  mountUI(uiProps);
}

async function updateUIForHub(hub) {
  remountUI({
    hubId: hub.hub_id,
    hubName: hub.name,
    hubScene: hub.scene,
    hubEntryCode: hub.entry_code
  });
}

async function updateEnvironmentForHub(hub) {
  let sceneUrl;
  let isLegacyBundle; // Deprecated

  const environmentScene = document.querySelector("#environment-scene");
  const sceneEl = document.querySelector("a-scene");

  if (hub.scene) {
    isLegacyBundle = false;
    sceneUrl = hub.scene.model_url;
  } else if (hub.scene === null) {
    // delisted/removed scene
    sceneUrl = loadingEnvironmentURL;
  } else {
    const defaultSpaceTopic = hub.topics[0];
    const glbAsset = defaultSpaceTopic.assets.find(a => a.asset_type === "glb");
    const bundleAsset = defaultSpaceTopic.assets.find(a => a.asset_type === "gltf_bundle");
    sceneUrl = (glbAsset || bundleAsset).src;
    const hasExtension = /\.gltf/i.test(sceneUrl) || /\.glb/i.test(sceneUrl);
    isLegacyBundle = !(glbAsset || hasExtension);
  }

  if (isLegacyBundle) {
    // Deprecated
    const res = await fetch(sceneUrl);
    const data = await res.json();
    const baseURL = new URL(THREE.LoaderUtils.extractUrlBase(sceneUrl), window.location.href);
    sceneUrl = new URL(data.assets[0].src, baseURL).href;
  } else {
    sceneUrl = proxiedUrlFor(sceneUrl);
  }

  console.log(`Scene URL: ${sceneUrl}`);

  let environmentEl = null;

  if (environmentScene.childNodes.length === 0) {
    const environmentEl = document.createElement("a-entity");
    environmentEl.setAttribute("gltf-model-plus", { src: sceneUrl, useCache: false, inflate: true });

    environmentScene.appendChild(environmentEl);

    environmentEl.addEventListener(
      "model-loaded",
      () => {
        //TODO: check if the environment was made with spoke to determine if a shape should be added
        traverseMeshesAndAddShapes(environmentEl);
        generateMeshBVH(environmentEl.object3D);
      },
      { once: true }
    );
  } else {
    // Change environment
    environmentEl = environmentScene.childNodes[0];

    // Clear the three.js image cache and load the loading environment before switching to the new one.
    THREE.Cache.clear();

    environmentEl.addEventListener(
      "model-loaded",
      () => {
        if (sceneEl.is("entered")) {
          // We've already entered, so move to new spawn point once new environment is loaded
          environmentEl.addEventListener(
            "model-loaded",
            () => {
              traverseMeshesAndAddShapes(environmentEl);
              generateMeshBVH(environmentEl.object3D);
              document.querySelector("#player-rig").components["spawn-controller"].moveToSpawnPoint();
            },
            { once: true }
          );
        }

        environmentEl.setAttribute("gltf-model-plus", { src: sceneUrl });
      },
      { once: true }
    );

    environmentEl.setAttribute("gltf-model-plus", { src: loadingEnvironmentURL });
  }
}

async function handleHubChannelJoined(entryManager, hubChannel, messageDispatch, data) {
  const scene = document.querySelector("a-scene");
  const isRejoin = NAF.connection.isConnected();

  if (isRejoin) {
    // Slight hack, to ensure correct presence state we need to re-send the entry event
    // on re-join. Ideally this would be updated into the channel socket state but this
    // would require significant changes to the hub channel events and socket management.
    hubChannel.sendEntryEvent();

    // Send complete sync on phoenix re-join.
    NAF.connection.entities.completeSync(null, true);
    return;
  }

  const hub = data.hubs[0];

  console.log(`Janus host: ${hub.host}`);

  const objectsScene = document.querySelector("#objects-scene");
  const objectsUrl = getReticulumFetchUrl(`/${hub.hub_id}/objects.gltf`);
  const objectsEl = document.createElement("a-entity");
  objectsEl.setAttribute("gltf-model-plus", { src: objectsUrl, useCache: false, inflate: true });

  if (!isBotMode) {
    objectsScene.appendChild(objectsEl);
  }

  updateEnvironmentForHub(hub);
  updateUIForHub(hub);

  remountUI({
    onSendMessage: messageDispatch.dispatch,
    onMediaSearchResultEntrySelected: entry => scene.emit("action_selected_media_result_entry", entry),
    onMediaSearchCancelled: entry => scene.emit("action_media_search_cancelled", entry)
  });

  scene.addEventListener("action_selected_media_result_entry", e => {
    const entry = e.detail;
    if (entry.type !== "scene_listing") return;
    if (!hubChannel.permissions.update_hub) return;

    hubChannel.updateScene(entry.url);
  });

  scene.addEventListener("scene_media_selected", e => {
    hubChannel.updateScene(e.detail);
  });

  // Wait for scene objects to load before connecting, so there is no race condition on network state.
  const connectToScene = async () => {
    scene.setAttribute("networked-scene", {
      room: hub.hub_id,
      serverURL: `wss://${hub.host}`,
      debug: !!isDebug
    });

    while (!scene.components["networked-scene"] || !scene.components["networked-scene"].data) await nextTick();
    scene.components["networked-scene"]
      .connect()
      .then(() => {
        let newHostPollInterval = null;

        scene.emit("didConnectToNetworkedScene");
        // When reconnecting, update the server URL if necessary
        NAF.connection.adapter.setReconnectionListeners(
          () => {
            if (newHostPollInterval) return;

            newHostPollInterval = setInterval(async () => {
              const currentServerURL = NAF.connection.adapter.serverUrl;
              const newHubHost = await hubChannel.getHost();
              const newServerURL = `wss://${newHubHost}`;

              if (currentServerURL !== newServerURL) {
                console.log("Connecting to new Janus server " + newServerURL);
                scene.setAttribute("networked-scene", { serverURL: newServerURL });
                NAF.connection.adapter.serverUrl = newServerURL;
              }
            }, 1000);
          },
          () => {
            clearInterval(newHostPollInterval);
            newHostPollInterval = null;
          },
          null
        );

        NAF.connection.adapter.reliableTransport = (clientId, dataType, data) => {
          const payload = { dataType, data };

          if (clientId) {
            payload.clientId = clientId;
          }

          hubChannel.channel.push("naf", payload);
        };
      })
      .catch(connectError => {
        // hacky until we get return codes
        const isFull = connectError.error && connectError.error.msg.match(/\bfull\b/i);
        console.error(connectError);
        remountUI({ roomUnavailableReason: isFull ? "full" : "connect_error" });
        entryManager.exitScene();

        return;
      });
  };

  if (!isBotMode) {
    objectsEl.addEventListener("model-loaded", async el => {
      if (el.target !== objectsEl) return;
      connectToScene();
    });
  } else {
    connectToScene();
  }
}

async function runBotMode(scene, entryManager) {
  const noop = () => {};
  scene.renderer = { setAnimationLoop: noop, render: noop };

  while (!NAF.connection.isConnected()) await nextTick();
  entryManager.enterSceneWhenLoaded(new MediaStream(), false);
}

document.addEventListener("DOMContentLoaded", async () => {
  warmSerializeElement();

  // HACK: On Safari for iOS & MacOS, if mic permission is not granted, subscriber webrtc negotiation fails.
  const detectedOS = detectOS(navigator.userAgent);
  const browser = detect();
  if (["iOS", "Mac OS"].includes(detectedOS) && ["safari", "ios"].includes(browser.name)) {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      remountUI({ showSafariMicDialog: true });
      return;
    }
  }

  const hubId = qs.get("hub_id") || document.location.pathname.substring(1).split("/")[0];
  console.log(`Hub ID: ${hubId}`);

  const subscriptions = new Subscriptions(hubId);

  if (navigator.serviceWorker) {
    try {
      navigator.serviceWorker
        .register("/hub.service.js")
        .then(() => {
          navigator.serviceWorker.ready
            .then(registration => subscriptions.setRegistration(registration))
            .catch(() => subscriptions.setRegistrationFailed());
        })
        .catch(() => subscriptions.setRegistrationFailed());
    } catch (e) {
      subscriptions.setRegistrationFailed();
    }
  } else {
    subscriptions.setRegistrationFailed();
  }

  const scene = document.querySelector("a-scene");
  scene.removeAttribute("keyboard-shortcuts"); // Remove F and ESC hotkeys from aframe
  scene.setAttribute("shadow", { enabled: window.APP.quality !== "low" }); // Disable shadows on low quality

  // Physics needs to be ready before spawning anything.
  while (!scene.systems.physics.initialized) await nextTick();

  scene.addEventListener("loaded", () => {
    const physicsSystem = scene.systems.physics;
    physicsSystem.setDebug(isDebug || physicsSystem.data.debug);
  });

  const authChannel = new AuthChannel(store);
  const hubChannel = new HubChannel(store);
  const availableVREntryTypes = await getAvailableVREntryTypes();
  const entryManager = new SceneEntryManager(hubChannel, authChannel, availableVREntryTypes, history);
  entryManager.onRequestAuthentication = (
    signInMessageId,
    signInCompleteMessageId,
    signInContinueTextId,
    onContinueAfterSignIn
  ) => {
    remountUI({
      showSignInDialog: true,
      signInMessageId,
      signInCompleteMessageId,
      signInContinueTextId,
      onContinueAfterSignIn: () => {
        remountUI({ showSignInDialog: false });
        onContinueAfterSignIn();
      }
    });
  };
  entryManager.init();

  const linkChannel = new LinkChannel(store);

  window.APP.scene = scene;
  window.APP.hubChannel = hubChannel;

  const handleEarlyVRMode = () => {
    // If VR headset is activated, refreshing page will fire vrdisplayactivate
    // which puts A-Frame in VR mode, so exit VR mode whenever it is attempted
    // to be entered and we haven't entered the room yet.
    if (scene.is("vr-mode") && !scene.is("vr-entered")) {
      console.log("Pre-emptively exiting VR mode.");
      scene.exitVR();
      return true;
    }

    return false;
  };

  scene.addEventListener("enter-vr", () => {
    if (handleEarlyVRMode()) return true;

    document.body.classList.add("vr-mode");

    // Don't stretch canvas on cardboard, since that's drawing the actual VR view :)
    if ((!isMobile && !isMobileVR) || availableVREntryTypes.cardboard !== VR_DEVICE_AVAILABILITY.yes) {
      document.body.classList.add("vr-mode-stretch");
    }
  });

  handleEarlyVRMode();

  // HACK A-Frame 0.9.0 seems to fail to wire up vrdisplaypresentchange early enough
  // to catch presentation state changes and recognize that an HMD is presenting on startup.
  window.addEventListener(
    "vrdisplaypresentchange",
    () => {
      if (scene.is("vr-entered")) return;
      if (scene.is("vr-mode")) return;

      const device = AFRAME.utils.device.getVRDisplay();

      if (device && device.isPresenting) {
        if (!scene.is("vr-mode")) {
          console.warn("Hit A-Frame bug where VR display is presenting but A-Frame has not entered VR mode.");
          scene.enterVR();
        }
      }
    },
    { once: true }
  );

  scene.addEventListener("exit-vr", () => {
    document.body.classList.remove("vr-mode");
    document.body.classList.remove("vr-mode-stretch");

    // HACK: Oculus browser pauses videos when exiting VR mode, so we need to resume them after a timeout.
    if (/OculusBrowser/i.test(window.navigator.userAgent)) {
      document.querySelectorAll("[media-video]").forEach(m => {
        const video = m.components["media-video"].video;

        if (!video.paused) {
          setTimeout(() => video.play(), 1000);
        }
      });
    }
  });

  registerNetworkSchemas();

  remountUI({
    authChannel,
    hubChannel,
    linkChannel,
    subscriptions,
    enterScene: entryManager.enterScene,
    exitScene: reason => {
      entryManager.exitScene();

      if (reason) {
        remountUI({ roomUnavailableReason: reason });
      }
    },
    initialIsSubscribed: subscriptions.isSubscribed(),
    activeTips: scene.systems.tips.activeTips
  });

  scene.addEventListener("action_focus_chat", () => {
    const chatFocusTarget = document.querySelector(".chat-focus-target");
    chatFocusTarget && chatFocusTarget.focus();
  });

  scene.addEventListener("tips_changed", e => {
    remountUI({ activeTips: e.detail });
  });

  scene.addEventListener("camera_toggled", () => remountUI({}));

  scene.addEventListener("camera_removed", () => remountUI({}));

  const platformUnsupportedReason = getPlatformUnsupportedReason();

  if (platformUnsupportedReason) {
    remountUI({ platformUnsupportedReason });
    entryManager.exitScene();
    return;
  }

  if (qs.get("required_version") && process.env.BUILD_VERSION) {
    const buildNumber = process.env.BUILD_VERSION.split(" ", 1)[0]; // e.g. "123 (abcd5678)"

    if (qs.get("required_version") !== buildNumber) {
      remountUI({ roomUnavailableReason: "version_mismatch" });
      setTimeout(() => document.location.reload(), 5000);
      entryManager.exitScene();
      return;
    }
  }

  if (isMobileVR) {
    remountUI({ availableVREntryTypes, forcedVREntryType: "vr" });

    if (/Oculus/.test(navigator.userAgent)) {
      // HACK - The polyfill reports Cardboard as the primary VR display on startup out ahead of Oculus Go on Oculus Browser 5.5.0 beta. This display is cached by A-Frame,
      // so we need to resolve that and get the real VRDisplay before entering as well.
      const displays = await navigator.getVRDisplays();
      const vrDisplay = displays.length && displays[0];
      AFRAME.utils.device.getVRDisplay = () => vrDisplay;
    }
  } else {
    remountUI({ availableVREntryTypes });
  }

  const environmentScene = document.querySelector("#environment-scene");

  const onFirstEnvironmentLoad = () => {
    if (!scene.is("entered")) {
      setupLobbyCamera();
    }

    // Replace renderer with a noop renderer to reduce bot resource usage.
    if (isBotMode) {
      runBotMode(scene, entryManager);
    }

    environmentScene.removeEventListener("model-loaded", onFirstEnvironmentLoad);
  };

  environmentScene.addEventListener("model-loaded", onFirstEnvironmentLoad);

  environmentScene.addEventListener("model-loaded", () => {
    // This will be run every time the environment is changed (including the first load.)
    remountUI({ environmentSceneLoaded: true });

    // Re-bind the teleporter controls collision meshes in case the scene changed.
    document.querySelectorAll("a-entity[teleporter]").forEach(x => x.components["teleporter"].queryCollisionEntities());

    for (const modelEl of environmentScene.children) {
      addAnimationComponents(modelEl);
    }
  });

  const socket = connectToReticulum(isDebug);

  socket.onClose(e => {
    // The socket should close normally if the server has explicitly killed it.
    const NORMAL_CLOSURE = 1000;
    if (e.code === NORMAL_CLOSURE) {
      entryManager.exitScene();
      remountUI({ roomUnavailableReason: "kicked" });
    }
  });

  remountUI({ sessionId: socket.params().session_id });

  // Hub local channel
  const context = {
    mobile: isMobile || isMobileVR,
    hmd: availableVREntryTypes.isInHMD
  };

  // Reticulum global channel
  const retPhxChannel = socket.channel(`ret`, { hub_id: hubId });
  retPhxChannel
    .join()
    .receive("ok", async data => subscriptions.setVapidPublicKey(data.vapid_public_key))
    .receive("error", res => {
      subscriptions.setVapidPublicKey(null);
      console.error(res);
    });

  const pushSubscriptionEndpoint = await subscriptions.getCurrentEndpoint();
  const joinPayload = { profile: store.state.profile, push_subscription_endpoint: pushSubscriptionEndpoint, context };
  const { token } = store.state.credentials;
  if (token) {
    console.log(`Logged into account ${jwtDecode(token).sub}`);
    joinPayload.auth_token = token;
  }
  const hubPhxChannel = socket.channel(`hub:${hubId}`, joinPayload);

  const presenceLogEntries = [];
  const addToPresenceLog = entry => {
    entry.key = Date.now().toString();

    presenceLogEntries.push(entry);
    remountUI({ presenceLogEntries });
    scene.emit(`presence-log-${entry.type}`);

    // Fade out and then remove
    setTimeout(() => {
      entry.expired = true;
      remountUI({ presenceLogEntries });

      setTimeout(() => {
        presenceLogEntries.splice(presenceLogEntries.indexOf(entry), 1);
        remountUI({ presenceLogEntries });
      }, 5000);
    }, 20000);
  };

  const messageDispatch = new MessageDispatch(
    scene,
    entryManager,
    hubChannel,
    addToPresenceLog,
    remountUI,
    mediaSearchStore
  );

  hubPhxChannel
    .join()
    .receive("ok", async data => {
      hubChannel.setPhoenixChannel(hubPhxChannel);

      const hubPhxPresence = hubChannel.presence;
      let isInitialSync = true;
      const vrHudPresenceCount = document.querySelector("#hud-presence-count");

      hubPhxPresence.onSync(() => {
        remountUI({ presences: hubPhxPresence.state });
        const occupantCount = Object.entries(hubPhxPresence.state).length;
        vrHudPresenceCount.setAttribute("text", "value", occupantCount.toString());

        if (occupantCount > 1) {
          scene.addState("copresent");
        } else {
          scene.removeState("copresent");
        }

        if (!isInitialSync) return;
        // Wire up join/leave event handlers after initial sync.
        isInitialSync = false;

        hubPhxPresence.onJoin((sessionId, current, info) => {
          const meta = info.metas[info.metas.length - 1];

          if (current) {
            // Change to existing presence
            const isSelf = sessionId === socket.params().session_id;
            const currentMeta = current.metas[0];

            if (!isSelf && currentMeta.presence !== meta.presence && meta.profile.displayName) {
              addToPresenceLog({
                type: "entered",
                presence: meta.presence,
                name: meta.profile.displayName
              });
            }

            if (currentMeta.profile && meta.profile && currentMeta.profile.displayName !== meta.profile.displayName) {
              addToPresenceLog({
                type: "display_name_changed",
                oldName: currentMeta.profile.displayName,
                newName: meta.profile.displayName
              });
            }
          } else {
            // New presence
            const meta = info.metas[0];

            if (meta.presence && meta.profile.displayName) {
              addToPresenceLog({
                type: "join",
                presence: meta.presence,
                name: meta.profile.displayName
              });
            }
          }
        });

        hubPhxPresence.onLeave((sessionId, current, info) => {
          if (current && current.metas.length > 0) return;

          const meta = info.metas[0];

          if (meta.profile.displayName) {
            addToPresenceLog({
              type: "leave",
              name: meta.profile.displayName
            });
          }
        });
      });

      hubChannel.setPermissionsFromToken(data.perms_token);
      scene.addEventListener("adapter-ready", ({ detail: adapter }) => {
        adapter.setClientId(socket.params().session_id);
        adapter.setJoinToken(data.perms_token);
      });
      subscriptions.setHubChannel(hubChannel);
      subscriptions.setSubscribed(data.subscriptions.web_push);
      remountUI({ initialIsSubscribed: subscriptions.isSubscribed() });
      await handleHubChannelJoined(entryManager, hubChannel, messageDispatch, data);
    })
    .receive("error", res => {
      if (res.reason === "closed") {
        entryManager.exitScene();
        remountUI({ roomUnavailableReason: "closed" });
      }

      console.error(res);
    });

  hubPhxChannel.on("naf", data => {
    if (!NAF.connection.adapter) return;
    NAF.connection.adapter.onData(data);
  });

  hubPhxChannel.on("message", ({ session_id, type, body, from }) => {
    const getAuthor = () => {
      const userInfo = hubChannel.presence.state[session_id];
      if (from) {
        return from;
      } else if (userInfo) {
        return userInfo.metas[0].profile.displayName;
      } else {
        return "Mystery user";
      }
    };

    const name = getAuthor();
    const maySpawn = scene.is("entered");

    const incomingMessage = { name, type, body, maySpawn };

    if (scene.is("vr-mode")) {
      createInWorldLogMessage(incomingMessage);
    }

    addToPresenceLog(incomingMessage);
  });

  hubPhxChannel.on("hub_refresh", ({ session_id, hubs, stale_fields }) => {
    const hub = hubs[0];
    const userInfo = hubChannel.presence.state[session_id];

    updateUIForHub(hub);

    if (stale_fields.includes("scene")) {
      updateEnvironmentForHub(hub);

      addToPresenceLog({
        type: "scene_changed",
        name: userInfo.metas[0].profile.displayName,
        sceneName: hub.scene ? hub.scene.name : "a custom URL"
      });
    }

    if (stale_fields.includes("name")) {
      const titleParts = document.title.split(" | "); // Assumes title has | trailing site name
      titleParts[0] = hub.name;
      document.title = titleParts.join(" | ");

      // Re-write the slug in the browser history
      const pathParts = history.location.pathname.split("/");
      const oldSlug = pathParts[1];
      const { search, state } = history.location;
      const pathname = history.location.pathname.replace(`/${oldSlug}`, `/${hub.slug}`);

      history.replace({ pathname, search, state });

      addToPresenceLog({
        type: "hub_name_changed",
        name: userInfo.metas[0].profile.displayName,
        hubName: hub.name
      });
    }
  });

  authChannel.setSocket(socket);
  linkChannel.setSocket(socket);
});
