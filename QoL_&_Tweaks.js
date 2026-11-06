const SETTINGS_KEY = "QoLAndTweaks";
const LEGACY_SETTINGS_KEY = "RandomColorAutoEnabler";
const RANDOM_COLOUR_APPEARANCE_TYPE = 8;
const SCAN_INTERVAL_MS = 1000;
const MIN_PRICE = 0;
const MAX_PRICE = 200;
const NORMAL_CLICKS = 5;
const FIVE_X_CLICKS = 5;
const CLICK_STREAK_TIMEOUT_MS = 300;

const SHOP_IDENTIFIERS = new Set([
    "rct2.ride.infok",
    "rct2.ride.balln",
    "rct2.ride.tshrt",
    "rct2tt.ride.1960tsrt",
    "rct2.ride.hatst",
    "rct2.ride.souvs",
    "rct2tt.ride.softoyst"
]);

let settings;
const processedRides = new Set();
const pendingSteps = new Map();
const clickStreaks = new Map();

function loadSettings() {
    const legacyRandomColours = [
        "informationKiosk",
        "balloonStall",
        "tShirtStall",
        "hatStall",
        "souvenirStall",
        "toyStall"
    ].some(key => context.sharedStorage.get(`${LEGACY_SETTINGS_KEY}.${key}`, true) === true);

    return {
        randomColours: context.sharedStorage.get(
            `${SETTINGS_KEY}.randomColours`,
            legacyRandomColours
        ) === true,
        autoNoEntrySigns: context.sharedStorage.get(
            `${SETTINGS_KEY}.autoNoEntrySigns`,
            true
        ) === true,
        priceChangeMultiplier: context.sharedStorage.get(
            `${SETTINGS_KEY}.priceChangeMultiplier`,
            true
        ) === true
    };
}

function saveToggle(name, value) {
    settings[name] = Boolean(value);
    context.sharedStorage.set(`${SETTINGS_KEY}.${name}`, settings[name]);

    if (name === "randomColours") {
        processedRides.clear();
        applyRandomColours();
    }
}

function isShop(ride) {
    return ride && ride.object && SHOP_IDENTIFIERS.has(ride.object.identifier);
}

function enableRandomColour(ride, onComplete) {
    context.executeAction("ridesetappearance", {
        ride: ride.id,
        type: RANDOM_COLOUR_APPEARANCE_TYPE,
        value: 1,
        index: 0
    }, onComplete);
}

function applyRandomColours() {
    if (!settings.randomColours || typeof map === "undefined" || !map.rides) return;

    map.rides.forEach(ride => {
        if (!isShop(ride) || processedRides.has(ride.id)) return;

        enableRandomColour(ride, result => {
            if (result && result.error) {
                console.log(
                    `[QoL and Tweaks]: Could not enable random colours for ${ride.name}: ` +
                    `${result.errorMessage || result.error}`
                );
                return;
            }
            processedRides.add(ride.id);
        });
    });
}

function enableNoEntrySign(event) {
    if (!settings.autoNoEntrySigns ||
        event.action !== "bannerplace" ||
        event.isClientOnly ||
        !event.result ||
        typeof event.result.bannerIndex !== "number") return;

    context.executeAction("bannersetstyle", {
        id: event.result.bannerIndex,
        type: 2,
        parameter: 1
    }, result => {
        if (result && result.error) {
            console.log(
                `[QoL and Tweaks]: Could not set sign ${event.result.bannerIndex} to no-entry: ` +
                `${result.errorMessage || result.error}`
            );
        }
    });
}

function getPriceStepKey(rideId, isPrimaryPrice) {
    return `${rideId}:${isPrimaryPrice ? 1 : 0}`;
}

function rememberPriceStep(event) {
    if (!settings.priceChangeMultiplier || event.action !== "ridesetprice") return;

    const args = event.args;
    const ride = map.getRide(args.ride);
    if (!ride || !Array.isArray(ride.price)) return;

    const priceIndex = args.isPrimaryPrice ? 0 : 1;
    const direction = args.price - ride.price[priceIndex];
    if (direction !== 1 && direction !== -1) return;

    const key = getPriceStepKey(args.ride, args.isPrimaryPrice);
    const pending = { price: args.price, direction };
    pendingSteps.set(key, pending);
    context.setTimeout(() => {
        if (pendingSteps.get(key) === pending) pendingSteps.delete(key);
    }, 1000);
}

function applyPriceMultiplier(event) {
    if (!settings.priceChangeMultiplier || event.action !== "ridesetprice") return;

    const args = event.args;
    const key = getPriceStepKey(args.ride, args.isPrimaryPrice);
    const pending = pendingSteps.get(key);
    if (!pending || pending.price !== args.price) return;
    pendingSteps.delete(key);

    const previousStreak = clickStreaks.get(key);
    const sameDirection = previousStreak && previousStreak.direction === pending.direction;
    const count = sameDirection ? previousStreak.count + 1 : 1;
    const priceMultiplier = count <= NORMAL_CLICKS
        ? 1
        : count <= NORMAL_CLICKS + FIVE_X_CLICKS ? 5 : 15;
    if (previousStreak) context.clearTimeout(previousStreak.resetHandle);

    const streak = { direction: pending.direction, count, resetHandle: null };
    streak.resetHandle = context.setTimeout(() => {
        if (clickStreaks.get(key) === streak) clickStreaks.delete(key);
    }, CLICK_STREAK_TIMEOUT_MS);
    clickStreaks.set(key, streak);
    if (priceMultiplier === 1) return;

    const ride = map.getRide(args.ride);
    if (!ride) return;

    const newPrice = Math.max(
        MIN_PRICE,
        Math.min(MAX_PRICE, args.price + pending.direction * (priceMultiplier - 1))
    );
    if (newPrice === args.price) return;

    context.executeAction("ridesetprice", {
        ride: args.ride,
        price: newPrice,
        isPrimaryPrice: args.isPrimaryPrice
    });
}

function openSettings() {
    ui.openWindow({
        classification: "qol-and-tweaks-settings",
        title: "QoL and Tweaks",
        width: 330,
        height: 140,
        widgets: [
            {
                type: "checkbox",
                x: 10,
                y: 18,
                width: 310,
                height: 18,
                text: "Random colours for shops",
                tooltip: "Automatically enable random merchandise colours for supported shops when they are built.",
                isChecked: settings.randomColours,
                onChange: value => saveToggle("randomColours", value)
            },
            {
                type: "checkbox",
                x: 10,
                y: 42,
                width: 310,
                height: 18,
                text: "Set placed signs to no-entry",
                tooltip: "Automatically mark every newly placed path sign as no-entry.",
                isChecked: settings.autoNoEntrySigns,
                onChange: value => saveToggle("autoNoEntrySigns", value)
            },
            {
                type: "checkbox",
                x: 10,
                y: 66,
                width: 310,
                height: 18,
                text: "Price change multiplier",
                tooltip: "After five consecutive clicks in one direction, price changes become 5x, then 15x after ten clicks.",
                isChecked: settings.priceChangeMultiplier,
                onChange: value => saveToggle("priceChangeMultiplier", value)
            },
            {
                type: "label",
                x: 10,
                y: 102,
                width: 310,
                height: 14,
                text: "{CYAN}Tip: Hover over each option for more information."
            }
        ]
    });
}

function main() {
    settings = loadSettings();

    if (typeof ui !== "undefined") {
        ui.registerMenuItem("QoL and Tweaks Settings", openSettings);
    }

    context.subscribe("action.query", rememberPriceStep);
    context.subscribe("action.execute", event => {
        applyPriceMultiplier(event);
        enableNoEntrySign(event);
    });

    context.setInterval(() => {
        try {
            applyRandomColours();
        } catch (error) {
            console.log(`[QoL and Tweaks Error]: ${error}`);
        }
    }, SCAN_INTERVAL_MS);
}

registerPlugin({
    name: "QoL and Tweaks",
    version: "2.0",
    apiVersion: 74,
    authors: ["YourName"],
    type: "local",
    licence: "MIT",
    main
});
