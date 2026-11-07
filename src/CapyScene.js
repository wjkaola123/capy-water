import React, { useEffect, useRef } from "react";
import {
  Animated,
  AppState,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Ellipse,
  G,
  Path,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

const PROFILE =
  "M229 153 C257 132 309 133 332 151 C344 161 347 174 356 180 L373 187 C384 192 388 201 387 214 C386 229 375 238 356 243 C324 252 289 253 269 247 C232 240 211 225 211 202 C210 183 217 167 229 153Z";
const FRONT =
  "M234 153 C257 132 323 132 346 153 C357 163 366 177 370 189 L371 196 C375 207 369 220 362 229 C347 244 318 251 290 251 C262 251 233 244 218 229 C211 220 205 207 209 196 C213 177 223 163 234 153Z";
const FRONT_COORDS = FRONT.match(/\d+/g).map(Number);
const clamp = (value) => Math.max(0, Math.min(1, value));
const ease = (value) => Easing.inOut(Easing.sin)(clamp(value));
const mix = (from, to, amount) => from + (to - from) * amount;

const CUP_REST_X = -116;
const CUP_REST_Y = 56;
const APPROACH_X = -86;
const APPROACH_Y = 20;
const WATER_PER_SIP = 0.25;
const CUP_HANDLE = "M275 259 C264 253 248 251 247 263 C246 274 259 280 279 274";
const BIRD_FLAP_PHASES = Array.from({ length: 37 }, (_, index) => index / 36);
const BIRD_WING_SCALE = BIRD_FLAP_PHASES.map((_, index) =>
  index % 2 === 0 ? 1 : 0.35,
);

function EffectMark({ effect }) {
  if (effect === "stars") {
    return (
      <G>
        <Path
          d="M0 -19 Q3 -4 15 0 Q3 3 0 18 Q-3 3 -15 0 Q-3 -4 0 -19Z"
          fill="#edbc65"
        />
        <Circle cx="-16" cy="-14" r="2.5" fill="#f1e5b3" />
        <Circle cx="17" cy="12" r="2" fill="#edbc65" />
      </G>
    );
  }
  if (effect === "petals") {
    return (
      <G>
        <Path d="M-2 13 C-25 3 -18 -17 -2 -17 Q12 -12 -2 13Z" fill="#e7b9ae" />
        <Path d="M3 14 C1 0 11 -12 21 -8 Q25 7 3 14Z" fill="#d99484" />
        <Path d="M-3 5 Q-10 -3 -8 -10" fill="none" stroke="#fffdf1" strokeWidth="1.5" strokeLinecap="round" />
      </G>
    );
  }
  return (
    <Path
      d="M0 6 C-17 -5 -13 -17 -5 -15 Q0 -15 0 -10 Q5 -20 13 -14 Q24 -5 0 6Z"
      fill="#d99484"
    />
  );
}

export function CapyEffectIcon({ effect }) {
  return (
    <Svg width={38} height={38} viewBox="-26 -26 52 52" accessible={false}>
      <EffectMark effect={effect} />
    </Svg>
  );
}

function SceneryLayer({ frame, wide, origin, opacity, transform, children }) {
  const [x, y] = origin;
  const originX = wide ? (x + 100) / 8 : x / 6;
  const originY = wide ? (y / 440) * 100 : ((y + 80) / 520) * 100;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { opacity, transformOrigin: `${originX}% ${originY}%`, transform },
      ]}
    >
      <Svg width="100%" height="100%" viewBox={frame}>{children}</Svg>
    </Animated.View>
  );
}

function hindFootPose(cycle, direction, offset) {
  const phase = (cycle + offset) % 1;
  const swinging = phase >= 0.5;
  const progress = swinging ? (phase - 0.5) * 2 : phase * 2;
  return {
    x: direction * (swinging ? mix(-10, 10, ease(progress)) : mix(10, -10, progress)),
    y: swinging ? -10 * Math.sin(Math.PI * progress) : 0,
  };
}

function Cup({ x, y, tilt = 0, water }) {
  const waterClip = `cup-water-${React.useId().replace(/:/g, "")}`;
  const cupAngle = 32 * tilt;
  const angle = (cupAngle * Math.PI) / 180;
  const surfaceY = mix(283, 256, water);
  const leftWaterY = surfaceY + 26 * Math.tan(angle);
  const rightWaterY = surfaceY - 26 * Math.tan(angle);
  return (
    <G
      transform={`translate(${x} ${y}) rotate(${cupAngle} 316 251)`}
    >
      <Defs>
        <ClipPath id={waterClip}>
          <Path d="M266 252 L273 280 Q290 287 309 280 L314 252Z" />
        </ClipPath>
      </Defs>
      <Path
        d={CUP_HANDLE}
        fill="none"
        stroke="#8e9676"
        strokeWidth="6"
      />
      <Path
        d={CUP_HANDLE}
        fill="none"
        stroke="#f7f4e4"
        strokeWidth="2.5"
      />
      <Path
        d="M264 253 L272 281 Q292 289 310 281 L316 251Z"
        fill="#f7f4e4"
        stroke="#8e9676"
        strokeWidth="2.5"
      />
      {water > 0 && (
        <G clipPath={`url(#${waterClip})`}>
          <Path
            d={`M263 ${leftWaterY} L317 ${rightWaterY} V289 H263Z`}
            fill="#8eb8a0"
            opacity=".78"
          />
          <Path
            d={`M263 ${leftWaterY} L317 ${rightWaterY}`}
            stroke="#d7eee0"
            strokeWidth="2"
          />
        </G>
      )}
      <Ellipse
        cx="290"
        cy="251"
        rx="26"
        ry="7"
        fill="#eee9d6"
        stroke="#8e9676"
        strokeWidth="2.5"
      />
      <Path
        d="M270 260 L274 275"
        stroke="#fffdf3"
        strokeWidth="3"
        opacity=".7"
        strokeLinecap="round"
      />
    </G>
  );
}

function Capy({
  accessory = "orange",
  blink = false,
  mini = false,
  turn = 0,
  sip = 0,
  tilt = 0,
  water = 0.8,
  satisfied = false,
  holdingCup = false,
  lift = 0,
  gait = null,
  walking = false,
}) {
  let coordinate = 0;
  const outline = turn
    ? PROFILE.replace(/\d+/g, (value) =>
        mix(Number(value), FRONT_COORDS[coordinate++], turn).toFixed(2),
      )
    : PROFILE;
  const cupX = mix(CUP_REST_X - APPROACH_X, -26 * sip, lift);
  const cupY = mix(CUP_REST_Y - APPROACH_Y, 20 - 41 * sip, lift);
  const cupAngle = 32 * tilt;
  const angle = (cupAngle * Math.PI) / 180;
  // Hand and cup share the same transform, so the wrist stays attached while tilting.
  const handPoint = (x, y) => {
    const dx = x - 316;
    const dy = y - 251;
    return `${316 + cupX + dx * Math.cos(angle) - dy * Math.sin(angle)} ${251 + cupY + dx * Math.sin(angle) + dy * Math.cos(angle)}`;
  };
  const elbowY = 278 - 19 * sip;
  const armOutline = `M231 245
    C225 257 226 ${elbowY} ${handPoint(245, 268)}
    C${handPoint(247, 274)} ${handPoint(257, 276)} ${handPoint(262, 270)}
    Q${handPoint(267, 264)} ${handPoint(262, 261)}
    Q${handPoint(259, 259)} ${handPoint(256, 263)}
    Q${handPoint(250, 254)} ${handPoint(246, 260)}
    C236 ${elbowY - 10} 246 258 248 250`;
  const farFoot = gait ? hindFootPose(gait.cycle, gait.direction, 0.5) : { x: 0, y: 0 };
  const nearFoot = gait ? hindFootPose(gait.cycle, gait.direction, 0) : { x: 0, y: 0 };
  const footBlend = gait?.blend ?? 0;
  return (
    <G>
      <Ellipse
        cx="306"
        cy="300"
        rx="84"
        ry="12"
        fill="#86a995"
        opacity=".22"
      />
      {!mini && (
        <G stroke="#815d41" strokeWidth="2.5" strokeLinecap="round">
          <G transform={`translate(${farFoot.x * footBlend} ${farFoot.y * footBlend})`}>
            <Path
              d="M336 266 Q350 267 350 283 C350 291 365 290 365 298 Q363 304 346 303 Q330 302 327 292 L325 279Z"
              fill="#b58156"
            />
            <Path d="M351 297 Q355 298 355 302" fill="none" />
          </G>
          <G transform={`translate(${nearFoot.x * footBlend} ${nearFoot.y * footBlend})`}>
            <Path
              d="M251 270 Q268 266 279 278 L275 291 C276 296 290 295 291 302 Q290 310 271 309 Q252 308 249 299 Q243 288 251 270Z"
              fill="#bb8b62"
            />
            <Path d="M275 302 Q279 303 279 308" fill="none" />
          </G>
        </G>
      )}
      <Path
        d="M222 259 C213 225 230 189 257 174 C284 159 344 170 361 203 C376 229 375 259 358 274 C330 290 248 290 222 259Z"
        fill="#bb8b62"
        stroke="#815d41"
        strokeWidth="3"
      />
      <Ellipse cx="296" cy="246" rx="45" ry="35" fill="#cda278" />
      <Path
        d="M221 172 C205 161 202 141 210 132 C220 121 235 131 243 149 Q240 165 221 172Z M323 150 C324 134 332 124 341 125 C353 125 360 139 354 152 Q351 161 342 166 Q327 165 323 150Z"
        fill="#bc8c61"
        stroke="#815d41"
        strokeWidth="3"
      />
      <Path
        d="M219 151 C213 140 221 135 229 144 Q234 149 232 155 Q224 156 219 151Z M332 149 C334 139 340 134 345 139 Q350 143 346 151 Q340 157 332 149Z"
        fill="#a57555"
      />
      <Path d={outline} fill="#cca074" stroke="#815d41" strokeWidth="3" />
      <Path
        d="M225 169 C248 148 283 145 313 152"
        fill="none"
        stroke="#dbb78e"
        strokeWidth="8"
        strokeLinecap="round"
        opacity=".7"
      />
      <Path
        d="M325 238 Q356 243 382 222 C375 237 356 244 330 247 Q303 251 283 246 Q307 246 325 238Z"
        fill="#d9b58b"
        opacity={1 - turn}
      />
      <G transform={`translate(${-33 * turn} 0)`}>
        {/* The resting profile dozes, but stays alert while walking. */}
        {satisfied ? (
          <Path
            d="M281 193 Q289 186 297 193"
            stroke="#5d4837"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        ) : blink || (!walking && turn < 0.5) ? (
          <Path
            d="M281 189 Q289 196 297 189"
            stroke="#5d4837"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <>
            <Circle cx="288" cy="191.5" r="3.4" fill="#5d4837" />
            <Circle cx="286.7" cy="190.1" r="1.2" fill="#fffdf4" />
          </>
        )}
        <Ellipse
          cx="279"
          cy="211"
          rx="13"
          ry="6"
          fill="#d79479"
          opacity=".65"
        />
      </G>
      {turn > 0 && (
        <G opacity={turn}>
          <Ellipse cx="290" cy="221" rx="32" ry="22" fill="#d9b58b" />
          {satisfied ? (
            <Path
              d="M315 193 Q323 186 331 193"
              stroke="#5d4837"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          ) : blink ? (
            <Path
              d="M315 189 Q323 196 331 189"
              stroke="#5d4837"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <>
              <Circle cx="322" cy="191.5" r="3.4" fill="#5d4837" />
              <Circle cx="320.7" cy="190.1" r="1.2" fill="#fffdf4" />
            </>
          )}
          <Ellipse
            cx="335"
            cy="211"
            rx="13"
            ry="6"
            fill="#d79479"
            opacity=".65"
          />
          <Path
            d="M281 212 L284 211 M296 211 L299 212"
            stroke="#74563f"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </G>
      )}
      {turn > 0 &&
        (tilt > 0.1 ? (
          <Ellipse
            cx="290"
            cy="231"
            rx="4"
            ry="3"
            fill="#74563f"
            opacity={turn}
          />
        ) : (
          <Path
            d={
              satisfied
                ? "M277 225 Q290 241 303 225"
                : "M280 226 Q290 234 300 226"
            }
            fill="none"
            stroke="#74563f"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={turn}
          />
        ))}
      <Path
        d="M374 198 L377 199 M362 223 Q371 226 379 220"
        stroke="#74563f"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity={1 - turn}
      />
      <Path
        d="M308 260 Q321 269 334 259"
        stroke="#966e4d"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {accessory === "orange" && (
        <G transform="rotate(-9 285 130)">
          <Ellipse
            cx="283"
            cy="135"
            rx="25"
            ry="5"
            fill="#ad7d54"
            opacity=".25"
          />
          <Circle cx="282" cy="117" r="23" fill="#eea342" />
          <Path
            d="M263 110 Q269 97 281 98"
            fill="none"
            stroke="#f7c679"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Path
            d="M283 95 Q284 83 294 81"
            stroke="#647c46"
            strokeWidth="3"
            fill="none"
          />
          <Path d="M286 94 Q309 98 305 80 Q291 80 286 94Z" fill="#6d8b53" />
          <Circle cx="292" cy="120" r="1.5" fill="#d89034" />
          <Circle cx="286" cy="128" r="1.5" fill="#d89034" />
        </G>
      )}
      {accessory === "flower" && (
        <G>
          <Path
            d="M253 143 Q283 124 318 143"
            stroke="#6c8953"
            strokeWidth="7"
            fill="none"
          />
          {[259, 282, 307].map((x, i) => (
            <G key={x}>
              <Circle cx={x - 6} cy={135 - (i % 2) * 5} r="8" fill="#f1b9b2" />
              <Circle cx={x + 6} cy={135 - (i % 2) * 5} r="8" fill="#f1b9b2" />
              <Circle cx={x} cy={128 - (i % 2) * 5} r="8" fill="#f1b9b2" />
              <Circle cx={x} cy={136 - (i % 2) * 5} r="5" fill="#f0cd70" />
            </G>
          ))}
        </G>
      )}
      {accessory === "towel" && (
        <G transform="rotate(-8 280 130)">
          <Rect
            x="248"
            y="114"
            width="69"
            height="25"
            rx="9"
            fill="#f7f4e5"
            stroke="#c9c9b6"
            strokeWidth="2"
          />
          <Path
            d="M258 121 H307 M259 127 H307"
            stroke="#d8dec8"
            strokeWidth="2"
          />
        </G>
      )}
      {!mini && (
        <>
          <Path
            d="M353 243 C363 253 361 267 352 275 C346 280 336 281 332 277 C327 272 334 267 339 263 Q346 255 343 249"
            fill="#bb8b62"
            stroke="#815d41"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {holdingCup && <Cup x={cupX} y={cupY} tilt={tilt} water={water} />}
          {!holdingCup && (
            <Path
              d="M232 244 C225 254 228 268 236 275 Q246 282 251 276 Q256 272 248 265 Q241 259 244 250"
              fill="#bb8b62"
              stroke="#815d41"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
          {holdingCup && (
            <>
              <Path d={`${armOutline} Z`} fill="#bb8b62" />
              <Path
                d={armOutline}
                fill="none"
                stroke="#815d41"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <G
                transform={`translate(${cupX} ${cupY}) rotate(${cupAngle} 316 251)`}
              >
                <Path
                  d="M249 265 Q253 269 257 268 M256 263 L259 265"
                  fill="none"
                  stroke="#956b49"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </G>
            </>
          )}
        </>
      )}
    </G>
  );
}

export function CapyAvatar({ size = 54, accessory = "orange" }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#ebe8d6",
        overflow: "hidden",
      }}
    >
      <Svg width="100%" height="100%" viewBox="195 80 190 190">
        <Capy accessory={accessory} mini />
      </Svg>
    </View>
  );
}

export default function CapyScene({
  motion = true,
  celebration = 0,
  drinkRequest = 0,
  effect = "hearts",
  accessory = "orange",
  onPet,
  garden = false,
  wide = false,
  growth = 1,
  paused = false,
}) {
  const frame = wide ? "-100 0 800 440" : "0 -80 600 520";
  const poolClip = `pool-surface-${React.useId().replace(/:/g, "")}`;
  const bob = useRef(new Animated.Value(0)).current;
  const steam = useRef(new Animated.Value(0)).current;
  const breeze = useRef(new Animated.Value(0)).current;
  const flight = useRef(new Animated.Value(0)).current;
  const cloud = useRef(new Animated.Value(0)).current;
  const hearts = useRef(new Animated.Value(0)).current;
  const [blink, setBlink] = React.useState(false);
  const [pose, setPose] = React.useState(null);
  const [sipCelebration, setSipCelebration] = React.useState(0);
  const remainingWater = useRef(1);
  const [previewRun, setPreviewRun] = React.useState(0);
  const consumedPreview = useRef(0);
  const consumedDrink = useRef(drinkRequest);
  const [active, setActive] = React.useState(
    AppState.currentState === "active",
  );
  useEffect(() => {
    setActive(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (drinkRequest === consumedDrink.current || pose || paused || !active) return;
    consumedDrink.current = drinkRequest;
    setPreviewRun((run) => run + 1);
  }, [drinkRequest, pose, paused, active]);

  useEffect(() => {
    const manual = previewRun > consumedPreview.current;
    if ((!motion && !manual) || paused || !active) {
      setPose(null);
      return;
    }
    if (manual) consumedPreview.current = previewRun;
    let timer;
    let frameId;
    const schedule = (delay) => {
      timer = setTimeout(() => {
        if (remainingWater.current === 0) {
          if (!manual || delay !== 0) return;
          remainingWater.current = 1;
        }
        const startWater = remainingWater.current;
        const endWater = Math.max(0, startWater - WATER_PER_SIP);
        const startedAt = performance.now();
        let previous;
        const tick = (now) => {
          const elapsed = now - startedAt;
          if (elapsed >= 10500) {
            remainingWater.current = endWater;
            setPose(null);
            if (motion && endWater > 0) schedule(45000 + Math.random() * 30000);
            return;
          }
          const returning = elapsed >= 8600;
          const approach = ease(elapsed / 1700) * ease((10500 - elapsed) / 1900);
          const holdingCup = elapsed >= 1700 && elapsed < 8600;
          const lift = ease((elapsed - 1700) / 650) * ease((8600 - elapsed) / 900);
          const turn = ease((elapsed - 900) / 580) * ease((10500 - elapsed) / 800);
          const sip =
            ease((elapsed - 2180) / 1400) * ease((6600 - elapsed) / 1500);
          const tilt =
            ease((elapsed - 3800) / 850) * ease((5800 - elapsed) / 850);
          const water = mix(startWater, endWater, ease((elapsed - 4300) / 1050));
          remainingWater.current = water;
          // Blink twice after reaching the ledge, then sip.
          const eyesClosed =
            (elapsed >= 1750 && elapsed < 1870) ||
            (elapsed >= 2020 && elapsed < 2140) ||
            (elapsed >= 4100 && elapsed < 5800);
          // After the swallow, beam with happy crescent eyes before turning back.
          const satisfied = elapsed >= 6100 && !returning;
          if (
            !previous ||
            previous.approach !== approach ||
            previous.returning !== returning ||
            previous.holdingCup !== holdingCup ||
            previous.lift !== lift ||
            previous.turn !== turn ||
            previous.sip !== sip ||
            previous.tilt !== tilt ||
            previous.water !== water ||
            previous.eyesClosed !== eyesClosed ||
            previous.satisfied !== satisfied
          ) {
            previous = {
              approach,
              returning,
              holdingCup,
              lift,
              turn,
              sip,
              tilt,
              water,
              eyesClosed,
              satisfied,
            };
            setPose(previous);
          }
          frameId = requestAnimationFrame(tick);
        };
        frameId = requestAnimationFrame(tick);
      }, delay);
    };
    schedule(manual ? 0 : 18000);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frameId);
    };
  }, [motion, paused, active, previewRun]);
  useEffect(() => {
    if (!motion) {
      bob.setValue(0);
      steam.setValue(0);
      breeze.setValue(0);
      flight.setValue(0);
      cloud.setValue(0);
      return;
    }
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    const mist = Animated.loop(
      Animated.timing(steam, {
        toValue: 1,
        duration: 4300,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    float.start();
    mist.start();
    const wind = Animated.loop(
      Animated.timing(breeze, {
        toValue: 1,
        duration: 7400,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      }),
    );
    const birds = Animated.loop(
      Animated.timing(flight, {
        toValue: 1,
        duration: 17000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      }),
    );
    wind.start();
    birds.start();
    const clouds = Animated.loop(
      Animated.sequence([
        Animated.timing(cloud, {
          toValue: 1,
          duration: 12500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
          isInteraction: false,
        }),
        Animated.timing(cloud, {
          toValue: 0,
          duration: 12500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
          isInteraction: false,
        }),
      ]),
    );
    clouds.start();
    let timeout;
    const timer = setInterval(() => {
      setBlink(true);
      timeout = setTimeout(() => setBlink(false), 190);
    }, 4600);
    return () => {
      float.stop();
      mist.stop();
      wind.stop();
      birds.stop();
      clouds.stop();
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [motion, bob, steam, breeze, flight, cloud]);
  useEffect(() => {
    if (pose?.satisfied) setSipCelebration((count) => count + 1);
  }, [pose?.satisfied]);
  useEffect(() => {
    if ((!celebration && !sipCelebration) || !motion) return;
    hearts.setValue(0);
    const animation = Animated.timing(hearts, {
      toValue: 1,
      duration: effect === "petals" ? 2600 : 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [celebration, sipCelebration, motion, hearts, effect]);
  const approach = pose?.approach ?? 0;
  const walking = approach > 0 && approach < 1;
  const travelX = APPROACH_X * approach;
  const travelY = APPROACH_Y * approach;
  const gait = {
    cycle: 2 * (pose?.returning ? 1 - approach : approach),
    direction: pose?.returning ? 1 : -1,
    blend: (4 * approach * (1 - approach)) ** 0.55,
  };
  const weightShift = 3 * gait.blend * Math.sin(4 * Math.PI * gait.cycle);
  const lean = 2.5 * gait.direction * gait.blend;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="摸摸卡皮的头"
      onPress={onPet}
      style={[sceneStyles.stage, wide && { aspectRatio: 800 / 440 }]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={frame}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="pond" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#b4d0b9" />
            <Stop offset="1" stopColor="#83b39d" />
          </LinearGradient>
        </Defs>
        <Circle cx="128" cy={wide ? 75 : -10} r="39" fill="#f5e5b3" opacity=".9" />
        <Path
          d="M-200 206 Q40 165 90 182 Q111 112 157 152 Q208 123 236 184 Q279 157 310 190 Q366 138 395 176 Q430 120 473 152 Q509 117 539 165 Q585 151 800 174 V390 H-200Z"
          fill="#cddcc2"
        />
        <Path
          d="M-200 248 Q35 204 78 221 Q104 180 137 209 Q174 189 199 223 Q265 192 313 233 Q350 197 391 211 Q428 170 478 212 Q534 178 800 220 V390 H-200Z"
          fill="#b9cfae"
        />
        <Path
          d="M-200 365 Q70 375 174 392 Q326 412 479 383 Q648 361 800 377 V440 H-200Z"
          fill="#b9cfae"
        />
        <Ellipse
          cx="303"
          cy="310"
          rx="231"
          ry="65"
          fill="#a8b59a"
          opacity=".45"
        />
        <Path
          d="M80 289 C79 243 168 224 301 226 C448 222 531 251 533 290 L528 312 C507 366 109 376 80 310Z"
          fill="#b7b6a0"
        />
        <Ellipse cx="306" cy="287" rx="227" ry="67" fill="#dcd7bd" />
        <Ellipse cx="306" cy="286" rx="204" ry="51" fill="url(#pond)" />
        <Path
          d="M97 292 Q106 320 139 324 L148 340 M160 241 L168 254 M247 226 L251 237 M371 226 L365 236 M468 246 L457 256 M490 316 L476 336 M345 337 L342 353 M222 337 L225 354"
          fill="none"
          stroke="#b9b69e"
          strokeWidth="3"
        />
        <Ellipse
          cx="103"
          cy="305"
          rx="26"
          ry="12"
          fill="#e3dec5"
          transform="rotate(23 103 305)"
        />
        <Ellipse
          cx="176"
          cy="336"
          rx="34"
          ry="11"
          fill="#e6e0c7"
          transform="rotate(9 176 336)"
        />
        <Ellipse
          cx="425"
          cy="338"
          rx="36"
          ry="10"
          fill="#e6e0c7"
          transform="rotate(-9 425 338)"
        />
        <Ellipse
          cx="514"
          cy="286"
          rx="20"
          ry="12"
          fill="#e6e0c7"
          transform="rotate(-8 514 286)"
        />
        <Ellipse cx="65" cy="330" rx="20" ry="7" fill="#adbd9c" />
        <Ellipse cx="552" cy="314" rx="21" ry="8" fill="#a6b895" />
        <Path
          d="M46 342 Q29 316 40 298 Q51 314 49 333 Q55 308 69 310 Q71 330 46 342Z M536 356 Q525 334 535 324 Q549 337 542 350 Q554 330 566 338 Q560 355 536 356Z"
          fill="#7d9a6c"
        />
        <Circle cx="93" cy="352" r="3" fill="#f1e5b3" />
        <Circle cx="499" cy="356" r="3" fill="#f1e5b3" />
        {[
          [74, 411, 1],
          [145, 423, 0.65],
          [514, 415, 0.9],
          [555, 397, 0.55],
        ].map(([x, y, scale], index) => (
          <G key={x} transform={`translate(${x} ${y}) scale(${scale})`}>
            <Ellipse cx="0" cy="2" rx="23" ry="5" fill="#a6b895" opacity=".45" />
            <Path
              d="M-6 0 Q-25 -10 -22 -23 Q-8 -20 -6 0 M6 1 Q24 -6 23 -19 Q9 -17 6 1 M0 0 Q-8 -17 -3 -28 Q7 -17 0 0"
              fill="#7d9a6c"
            />
            <Path d="M1 0 Q6 -17 3 -30" stroke="#789b70" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <G transform="translate(3 -30)">
              <Path
                d="M0 0 C-15 3 -15 -10 -7 -10 C-13 -21 2 -24 5 -13 C16 -19 21 -6 11 -3 C19 7 7 15 2 6 C-5 15 -15 6 -9 0Z"
                fill={index % 2 === 0 ? "#e7b9ae" : "#f1e5b3"}
              />
              <Circle cx="1" cy="-3" r="4" fill="#edab4a" />
            </G>
          </G>
        ))}
        {garden && (
          <G
            transform={`translate(${119 * (1 - (0.65 + growth * 0.15))} ${240 * (1 - (0.65 + growth * 0.15))}) scale(${0.65 + growth * 0.15})`}
          >
            <Path
              d="M119 225 V192 M115 208 Q95 189 101 184 Q119 183 119 204 M120 202 Q128 180 141 185 Q145 198 120 208"
              stroke="#789867"
              fill="#8fab7d"
              strokeWidth="3"
            />
            <Path d="M109 221 H134 L130 241 H113Z" fill="#c9956d" />
            {growth >= 2 && (
              <>
                <Circle cx="118" cy="186" r="7" fill="#e7b2a5" />
                <Circle cx="118" cy="186" r="3" fill="#f1d08e" />
              </>
            )}
          </G>
        )}
      </Svg>
      <SceneryLayer
        frame={frame}
        wide={wide}
        origin={[440, 8]}
        opacity={0.76}
        transform={[
          {
            translateX: cloud.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -18],
            }),
          },
          {
            translateY: cloud.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 2],
            }),
          },
        ]}
      >
        <G transform={wide ? "translate(0 55)" : undefined}>
          <Path
            d="M390 18 C378 18 376 4 387 -2 C390 -18 411 -24 422 -12 C430 -34 463 -31 470 -9 C490 -17 505 -2 501 10 C516 17 510 29 496 29 H397 Q386 29 390 18Z"
            fill="#fffdf1"
          />
          <Path
            d="M466 42 Q488 38 502 42"
            stroke="#fffdf1"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity=".5"
          />
        </G>
      </SceneryLayer>
      <SceneryLayer
        frame={frame}
        wide={wide}
        origin={[55, 263]}
        transform={[
          { rotate: breeze.interpolate({
            inputRange: [0, 0.28, 0.56, 0.78, 1],
            outputRange: ["0deg","3deg","-1deg","2deg","0deg"],
          }) },
        ]}
      >
        <Path d="M47 258 Q21 213 44 175 Q52 209 57 233 Q59 181 84 172 Q88 217 58 265Z" fill="#789b70" />
        <Path d="M75 275 Q81 244 99 237" stroke="#98b28a" strokeWidth="7" strokeLinecap="round" />
      </SceneryLayer>
      <SceneryLayer
        frame={frame}
        wide={wide}
        origin={[523, 255]}
        transform={[
          { rotate: breeze.interpolate({
            inputRange: [0, 0.28, 0.56, 0.78, 1],
            outputRange: ["0deg","1.5deg","3deg","-1deg","0deg"],
          }) },
        ]}
      >
        <Path d="M510 242 Q499 201 521 182 Q535 212 524 235 Q546 195 565 199 Q561 236 523 255Z" fill="#7e9e70" />
        <Path d="M543 248 Q544 218 560 215" stroke="#98b28a" strokeWidth="7" strokeLinecap="round" />
      </SceneryLayer>
      <SceneryLayer
        frame={frame}
        wide={wide}
        origin={[366, 65]}
        opacity={motion ? flight.interpolate({
          inputRange: [0, 0.12, 0.83, 1],
          outputRange: [0, 1, 1, 0],
        }) : 1}
        transform={[
          { translateX: flight.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) },
          { translateY: flight.interpolate({ inputRange: [0, 1], outputRange: [0, -19] }) },
          { scaleY: flight.interpolate({ inputRange: BIRD_FLAP_PHASES, outputRange: BIRD_WING_SCALE }) },
        ]}
      >
        <Path
          d="M350 68 Q355 63 360 68 Q365 63 370 68 M371 59 Q375 55 379 59 Q383 55 387 59"
          stroke="#8da284"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </SceneryLayer>
      <SceneryLayer
        frame={frame}
        wide={wide}
        origin={[137, 273]}
        transform={[
          { translateX: bob.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) },
          { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
          { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "2deg"] }) },
        ]}
      >
        <G>
          <Path
            d="M116 278 Q121 252 150 264 Q144 286 116 278Z"
            fill="#729d76"
          />
          <Path d="M119 277 L139 268" stroke="#a7c598" strokeWidth="2" />
          <Circle cx="149" cy="269" r="10" fill="#edab4a" />
          <Path d="M149 259 L154 254" stroke="#66874b" strokeWidth="2" />
        </G>
      </SceneryLayer>
      <SceneryLayer
        frame={frame}
        wide={wide}
        origin={[457, 306]}
        transform={[
          { translateX: bob.interpolate({ inputRange: [0, 1], outputRange: [0, 9] }) },
          { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
          { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-2deg"] }) },
        ]}
      >
        <G>
          <Path
            d="M433 308 Q456 287 478 305 Q463 323 433 308Z"
            fill="#719e78"
          />
          <Path
            d="M449 302 Q435 285 448 286 Q458 273 462 289 Q475 284 470 298Z"
            fill="#e7b9ae"
          />
          <Circle cx="458" cy="298" r="5" fill="#f1d497" />
        </G>
      </SceneryLayer>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              {
                translateY: pose ? 0 : bob.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -3],
                }),
              },
              {
                rotate: pose ? "0deg" : bob.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "0.4deg"],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox={frame}>
          <G transform={`translate(${travelX} ${travelY + weightShift}) rotate(${lean} 292 288)`}>
            <Capy
              accessory={accessory}
              blink={!walking && (pose?.eyesClosed ?? (motion && blink))}
              turn={pose?.turn}
              sip={pose?.sip}
              tilt={pose?.tilt}
              water={pose?.water ?? remainingWater.current}
              satisfied={!walking && pose?.satisfied}
              holdingCup={pose?.holdingCup}
              lift={pose?.lift}
              gait={gait}
              walking={walking}
            />
          </G>
        </Svg>
      </Animated.View>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox={frame}>
          <Defs>
            <ClipPath id={poolClip}>
              <Ellipse cx="306" cy="286" rx="201" ry="49" />
            </ClipPath>
            <LinearGradient id={`${poolClip}-wash`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#86a995" stopOpacity=".15" />
              <Stop offset=".27" stopColor="#86a995" stopOpacity=".62" />
              <Stop offset="1" stopColor="#86a995" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <G clipPath={`url(#${poolClip})`}>
            <G transform={`translate(${travelX} ${travelY * 0.7})`}>
              <Path
                d="M201 270 C229 267 245 280 290 282 C336 285 364 271 400 275 L400 314 H201Z"
                fill={`url(#${poolClip}-wash)`}
              />
              <Path
                d="M207 271 C229 269 243 278 264 280 M319 282 C345 281 365 272 387 274"
                fill="none"
                stroke="#d9ead6"
                strokeWidth="3"
                strokeLinecap="round"
                opacity=".82"
              />
              {gait.blend > 0 && (
                <Path
                  d="M227 305 Q244 312 263 311 M302 314 Q324 314 341 308"
                  fill="none"
                  stroke="#d9ead6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity={0.7 * gait.blend}
                />
              )}
            </G>
          </G>
        </Svg>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: bob.interpolate({
              inputRange: [0, 1],
              outputRange: [0.45, 0.9],
            }),
            transform: [{
              translateX: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [-5, 7],
              }),
            }],
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox={frame}>
          <Path
            d="M130 284 Q166 273 203 280 M220 299 Q253 307 283 305 M325 305 Q372 305 400 292 M401 282 Q442 274 476 285 M180 311 Q257 331 371 321"
            fill="none"
            stroke="#d9ead6"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      {!pose?.holdingCup && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" viewBox={frame}>
            <Cup x={CUP_REST_X} y={CUP_REST_Y} water={pose?.water ?? remainingWater.current} />
          </Svg>
        </View>
      )}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: steam.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, 0.6, 0.6, 0],
            }),
            transform: [
              {
                translateY: steam.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, -28],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox={frame}>
          <Path
            d="M179 238 C156 223 193 210 178 192 M409 237 C390 222 423 209 408 189 M373 140 C359 126 383 115 372 101"
            stroke="#fffdf1"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
      {!!(celebration || sipCelebration) && motion && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: hearts.interpolate({
                inputRange: [0, 0.15, 0.65, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transformOrigin: `50% ${wide ? (120 / 440) * 100 : (200 / 520) * 100}%`,
              transform: [
                {
                  translateY: hearts.interpolate({
                    inputRange: [0, 1],
                    outputRange: effect === "petals" ? [-35, 22] : [10, -65],
                  }),
                },
                {
                  translateX: hearts.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: effect === "petals" ? [-8, 13, 4] : [0, 0, 0],
                  }),
                },
                {
                  scale: hearts.interpolate({
                    inputRange: [0, 0.18, 0.4, 0.6, 0.8, 1],
                    outputRange: effect === "stars" ? [0.7, 1.05, 0.85, 1.1, 0.9, 1] : [1, 1, 1, 1, 1, 1],
                  }),
                },
                {
                  rotate: hearts.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: effect === "petals" ? ["-5deg", "5deg", "-2deg"] : ["0deg", "0deg", "0deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg width="100%" height="100%" viewBox={frame}>
            <G transform={`translate(${travelX} ${travelY})`}>
              {(effect === "hearts"
                ? [[210, 139, 1], [359, 124, 1.2], [320, 95, 0.7]]
                : [[213, 144, 0.7], [252, 103, 0.65], [317, 92, 0.85], [368, 129, 0.8], [344, 158, 0.5]]
              ).map(([x, y, scale], index) => (
                <G key={x} transform={`translate(${x} ${y}) scale(${scale}) rotate(${effect === "petals" ? index * 47 - 35 : 0})`}>
                  <EffectMark effect={effect} />
                </G>
              ))}
              <Path
                d="M193 181 V169 M187 175 H199 M399 163 V151 M393 157 H405"
                stroke="#edbc65"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </G>
          </Svg>
        </Animated.View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          remainingWater.current === 0 && !pose
            ? "添水并预览喝水动画"
            : "预览喝水动画"
        }
        disabled={!!pose || paused}
        onPress={(event) => {
          event.stopPropagation();
          setPreviewRun((value) => value + 1);
        }}
        style={sceneStyles.previewButton}
      >
        <Text style={sceneStyles.previewText}>
          {pose
            ? "卡皮在喝水…"
            : remainingWater.current === 0
              ? "▶ 添水再喝"
              : "▶ 看卡皮喝水"}
        </Text>
      </Pressable>
    </Pressable>
  );
}
const sceneStyles = StyleSheet.create({
  previewButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: 6,
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fffdf4",
  },
  previewText: { fontSize: 11, color: "#476343", fontWeight: "600" },
  stage: { width: "100%", aspectRatio: 600 / 520 },
});
