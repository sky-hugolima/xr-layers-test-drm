class VRButton {
    constructor(onSessionStarted) {
        this.domElement = null;
        this.session = null;
        this.sessionInit = {
            requiredFeatures: ["layers"],
            optionalFeatures: ["local-floor", "bounded-floor"],
        };
        this.onSessionStarted = onSessionStarted;

        if ("xr" in navigator) {
            const button = document.createElement("button");
            this.domElement = button;

            button.id = "VRButton";
            button.style.display = "none";

            this.#stylizeElement(button);

            navigator.xr
                .isSessionSupported("immersive-vr")
                .then((supported) => {
                    supported ? this.#showEnterVR() : this.#showWebXRNotFound();
                });
        } else {
            const message = document.createElement("a");
            this.domElement = message;

            if (window.isSecureContext === false) {
                message.href = document.location.href.replace(
                    /^http:/,
                    "https:"
                );
                message.innerHTML = "WEBXR NEEDS HTTPS"; // TODO Improve message
            } else {
                message.href = "https://immersiveweb.dev/";
                message.innerHTML = "WEBXR NOT AVAILABLE";
            }

            message.style.left = "calc(50% - 90px)";
            message.style.width = "180px";
            message.style.textDecoration = "none";

            this.#stylizeElement(message);
        }
    }

    #disableButton() {
        this.domElement.style.display = "";

        this.domElement.style.cursor = "auto";
        this.domElement.style.left = "calc(50% - 75px)";
        this.domElement.style.width = "150px";

        this.domElement.onmouseenter = null;
        this.domElement.onmouseleave = null;

        this.domElement.onclick = null;
    }

    #stylizeElement(element) {
        element.style.position = "absolute";
        element.style.bottom = "20px";
        element.style.padding = "12px 6px";
        element.style.border = "1px solid #fff";
        element.style.borderRadius = "4px";
        element.style.background = "rgba(0,0,0,0.1)";
        element.style.color = "#fff";
        element.style.font = "normal 13px sans-serif";
        element.style.textAlign = "center";
        element.style.opacity = "0.5";
        element.style.outline = "none";
        element.style.zIndex = "999";
    }

    #showEnterVR() {
        const onSessionEnded = async () => {
            this.session.removeEventListener("end", onSessionEnded);

            this.domElement.textContent = "ENTER VR";

            this.session = null;
        };

        const onSessionStarted = async (session) => {
            this.session = session;
            this.session.addEventListener("end", onSessionEnded);

            this.onSessionStarted(this.session);
            this.domElement.textContent = "EXIT VR";
        };

        //

        this.domElement.style.display = "";

        this.domElement.style.cursor = "pointer";
        this.domElement.style.left = "calc(50% - 50px)";
        this.domElement.style.width = "100px";

        this.domElement.textContent = "ENTER VR";

        this.domElement.onmouseenter = () => {
            this.domElement.style.opacity = "0.5";
        };

        this.domElement.onclick = () => {
            if (!this.session) {
                const sessionInit = this.sessionInit;

                navigator.xr
                    .requestSession("immersive-vr", sessionInit)
                    .then(onSessionStarted);
            } else {
                this.session.end();
            }
        };
    }

    #showWebXRNotFound() {
        this.#disableButton();

        this.domElement.textContent = "VR NOT SUPPORTED";
    }
}

async function createVideo() {
    const videoEl = document.createElement('video');
    const player = new shaka.Player(videoEl);
    const config = {
        drm: {
            servers: {
                'com.widevine.alpha': 'https://widevine-proxy.appspot.com/proxy',
            },
        }
    };

    videoEl.style.position = 'absolute';
    videoEl.style.top = 0;
    videoEl.style.left = 0;
    videoEl.crossOrigin = 'anonymous';
    videoEl.preload = 'auto';
    videoEl.autoload = true;

    player.configure(config);

    // DRM protected stream
    // await player.load('https://bitmovin-a.akamaihd.net/content/art-of-motion_drm/mpds/11331.mpd');

    // Clear stream
    await player.load('https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd');

    return videoEl;
}

async function startExperience(videoEl, xrSession) {
    const refSpace = await xrSession.requestReferenceSpace('local');
    const layerFactory = new XRMediaBinding(xrSession);
    const layer = await layerFactory.createQuadLayer(videoEl, {
        space: refSpace,
        layout: 'mono',
        transform: new XRRigidTransform({
            x: 0.0,
            y: 1.3,
            z: -2.75,
            w: 1.0,
        }),
    });
    xrSession.updateRenderState({
        layers: [layer],
    });
    videoEl.play();
}

async function setupVR(videoEl) {
    const vrButton = new VRButton((xrSession) => startExperience(videoEl, xrSession));
    document.body.appendChild(vrButton.domElement);
}

createVideo().then(setupVR);
