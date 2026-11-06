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

const GREETING = "喝口水休息下吧。";
const PROFILE =
  "M229 153 C257 132 309 133 332 151 C344 161 347 174 356 180 L373 187 C384 192 388 201 387 214 C386 229 375 238 356 243 C324 252 289 253 269 247 C232 240 211 225 211 202 C210 183 217 167 229 153Z";
const FRONT =
  "M234 153 C257 132 323 132 346 153 C357 163 366 177 370 189 L371 196 C375 207 369 220 362 229 C347 244 318 251 290 251 C262 251 233 244 218 229 C211 220 205 207 209 196 C213 177 223 163 234 153Z";
const FRONT_COORDS = FRONT.match(/\d+/g).map(Number);
const clamp = (value) => Math.max(0, Math.min(1, value));
const ease = (value) => Easing.inOut(Easing.sin)(clamp(value));
const mix = (from, to, amount) => from + (to - from) * amount;

function Capy({
  accessory = "orange",
  blink = false,
  mini = false,
  turn = 0,
  sip = 0,
  tilt = 0,
  water = 0.8,
}) {
  const waterClip = `cup-water-${React.useId().replace(/:/g, "")}`;
  let coordinate = 0;
  const outline = turn
    ? PROFILE.replace(/\d+/g, (value) =>
        mix(Number(value), FRONT_COORDS[coordinate++], turn).toFixed(2),
      )
    : PROFILE;
  const cupX = -26 * sip;
  const cupY = 20 - 41 * sip;
  const cupAngle = 32 * tilt;
  const angle = (cupAngle * Math.PI) / 180;
  // Hand and cup share the same transform, so the wrist stays attached while tilting.
  const handPoint = (x, y) => {
    const dx = x - 316;
    const dy = y - 251;
    return `${316 + cupX + dx * Math.cos(angle) - dy * Math.sin(angle)} ${251 + cupY + dx * Math.sin(angle) + dy * Math.cos(angle)}`;
  };
  const elbowY = 278 - 19 * sip;
  const armOutline = `M228 247
    C220 260 220 ${elbowY} ${handPoint(245, 268)}
    C${handPoint(247, 274)} ${handPoint(257, 276)} ${handPoint(262, 270)}
    Q${handPoint(267, 264)} ${handPoint(262, 261)}
    Q${handPoint(259, 259)} ${handPoint(256, 263)}
    Q${handPoint(250, 254)} ${handPoint(246, 260)}
    C233 ${elbowY - 10} 244 258 246 250`;
  const surfaceY = 279 - 22 * water - 6 * tilt;
  const leftWaterY = surfaceY + 26 * Math.tan(angle);
  const rightWaterY = surfaceY - 26 * Math.tan(angle);
  return (
    <G>
      <Ellipse
        cx="306"
        cy="295"
        rx="103"
        ry="21"
        fill="#86a995"
        opacity=".22"
      />
      <Path
        d="M222 262 C212 226 224 190 257 174 C284 159 346 170 363 203 C381 230 377 266 365 279 C333 297 250 295 222 262Z"
        fill="#bb8b62"
        stroke="#815d41"
        strokeWidth="3"
      />
      <Path
        d="M344 219 C368 207 380 224 366 245 L347 256"
        fill="#b58156"
        stroke="#815d41"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Ellipse cx="295" cy="245" rx="49" ry="42" fill="#cda278" />
      <Path
        d="M216 170 C199 140 215 116 234 133 L245 148 M325 147 C327 118 354 119 355 145 L349 168"
        fill="#bc8c61"
        stroke="#815d41"
        strokeWidth="3"
      />
      <Path
        d="M221 151 Q217 137 228 141 M339 145 Q344 134 347 145"
        fill="none"
        stroke="#8f6848"
        strokeWidth="5"
        strokeLinecap="round"
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
        {/* Side profile naps with closed eyes; the eye opens as the face fronts. */}
        {blink || turn < 0.5 ? (
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
          {blink ? (
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
            d="M280 226 Q290 234 300 226"
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
          <G
            transform={`translate(${cupX} ${cupY}) rotate(${cupAngle} 316 251)`}
          >
            <Defs>
              <ClipPath id={waterClip}>
                <Path d="M266 252 L273 280 Q290 287 309 280 L314 252Z" />
              </ClipPath>
            </Defs>
            <Path
              d="M264 257 C243 250 241 276 266 274"
              fill="none"
              stroke="#8e9676"
              strokeWidth="6"
            />
            <Path
              d="M264 257 C243 250 241 276 266 274"
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
            <Ellipse
              cx="290"
              cy="251"
              rx="26"
              ry="7"
              fill="#e3ead9"
              stroke="#8e9676"
              strokeWidth="2.5"
            />
            <Ellipse
              cx={290 + 6 * tilt}
              cy="252"
              rx={17 + 5 * tilt}
              ry="4"
              fill="#8eb8a0"
              opacity={0.45 + tilt * 0.55}
            />
            <Path
              d="M270 260 L274 275"
              stroke="#fffdf3"
              strokeWidth="3"
              opacity=".7"
              strokeLinecap="round"
            />
          </G>
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
          {tilt > 0.65 && (
            <Path
              d="M288 229 Q290 231 290 233"
              stroke="#a7cbbb"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          )}
          <Path
            d="M345 253 Q339 283 316 286"
            fill="none"
            stroke="#815d41"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={1 - turn}
          />
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
  accessory = "orange",
  onPet,
  garden = false,
  wide = false,
  growth = 1,
  paused = false,
}) {
  const frame = wide ? "-100 0 800 390" : "0 0 600 390";
  const bob = useRef(new Animated.Value(0)).current;
  const steam = useRef(new Animated.Value(0)).current;
  const hearts = useRef(new Animated.Value(0)).current;
  const [blink, setBlink] = React.useState(false);
  const [pose, setPose] = React.useState(null);
  const remainingWater = useRef(0.8);
  const [previewRun, setPreviewRun] = React.useState(0);
  const consumedPreview = useRef(0);
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
        const startedAt = performance.now();
        let previous;
        const tick = (now) => {
          const elapsed = now - startedAt;
          if (elapsed >= 10500) {
            remainingWater.current = Math.max(
              0.2,
              remainingWater.current - 0.18,
            );
            setPose(null);
            if (motion) schedule(45000 + Math.random() * 30000);
            return;
          }
          const turn = ease(elapsed / 580) * ease((10500 - elapsed) / 800);
          const sip =
            ease((elapsed - 2100) / 1400) * ease((6600 - elapsed) / 1500);
          const tilt =
            ease((elapsed - 3800) / 850) * ease((5800 - elapsed) / 850);
          const water = Math.max(
            0.2,
            remainingWater.current - 0.18 * ease((elapsed - 4500) / 1300),
          );
          const greeting = elapsed >= 6700 && elapsed < 9900;
          // Face front, keep eyes open through a relaxed double blink, then sip.
          const eyesClosed =
            (elapsed >= 700 && elapsed < 950) ||
            (elapsed >= 1200 && elapsed < 1450) ||
            (elapsed >= 4100 && elapsed < 5800);
          if (
            !previous ||
            previous.turn !== turn ||
            previous.sip !== sip ||
            previous.tilt !== tilt ||
            previous.water !== water ||
            previous.greeting !== greeting ||
            previous.eyesClosed !== eyesClosed
          ) {
            previous = { turn, sip, tilt, water, greeting, eyesClosed };
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
    let timeout;
    const timer = setInterval(() => {
      setBlink(true);
      timeout = setTimeout(() => setBlink(false), 190);
    }, 4600);
    return () => {
      float.stop();
      mist.stop();
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [motion, bob, steam]);
  useEffect(() => {
    if (!celebration || !motion) return;
    hearts.setValue(0);
    const animation = Animated.timing(hearts, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [celebration, motion, hearts]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="摸摸卡皮的头"
      onPress={onPet}
      style={[sceneStyles.stage, wide && { aspectRatio: 800 / 390 }]}
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
        <Circle cx="469" cy="75" r="39" fill="#f5e5b3" opacity=".9" />
        <Path
          d="M-200 206 Q40 165 90 182 Q111 112 157 152 Q208 123 236 184 Q279 157 310 190 Q366 138 395 176 Q430 120 473 152 Q509 117 539 165 Q585 151 800 174 V390 H-200Z"
          fill="#cddcc2"
        />
        <Path
          d="M-200 248 Q35 204 78 221 Q104 180 137 209 Q174 189 199 223 Q265 192 313 233 Q350 197 391 211 Q428 170 478 212 Q534 178 800 220 V390 H-200Z"
          fill="#b9cfae"
        />
        <Path
          d="M47 258 Q21 213 44 175 Q52 209 57 233 Q59 181 84 172 Q88 217 58 265Z"
          fill="#789b70"
        />
        <Path
          d="M510 242 Q499 201 521 182 Q535 212 524 235 Q546 195 565 199 Q561 236 523 255Z"
          fill="#7e9e70"
        />
        <Path
          d="M543 248 Q544 218 560 215 M75 275 Q81 244 99 237"
          stroke="#98b28a"
          strokeWidth="7"
          strokeLinecap="round"
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
          d="M139 285 Q190 271 225 281 M363 294 Q418 282 462 288 M194 311 Q270 328 370 316"
          fill="none"
          stroke="#d9ead6"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".7"
        />
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
        <G>
          <Path
            d="M116 278 Q121 252 150 264 Q144 286 116 278Z"
            fill="#729d76"
          />
          <Path d="M119 277 L139 268" stroke="#a7c598" strokeWidth="2" />
          <Circle cx="149" cy="269" r="10" fill="#edab4a" />
          <Path d="M149 259 L154 254" stroke="#66874b" strokeWidth="2" />
        </G>
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
        <Ellipse cx="65" cy="330" rx="20" ry="7" fill="#adbd9c" />
        <Ellipse cx="552" cy="314" rx="21" ry="8" fill="#a6b895" />
        <Path
          d="M46 342 Q29 316 40 298 Q51 314 49 333 Q55 308 69 310 Q71 330 46 342Z M536 356 Q525 334 535 324 Q549 337 542 350 Q554 330 566 338 Q560 355 536 356Z"
          fill="#7d9a6c"
        />
        <Circle cx="93" cy="352" r="3" fill="#f1e5b3" />
        <Circle cx="499" cy="356" r="3" fill="#f1e5b3" />
        <Path
          d="M160 101 Q166 96 171 101 M174 94 Q181 89 186 94"
          stroke="#a5b597"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
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
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              {
                translateY: bob.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                }),
              },
              {
                rotate: bob.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-1deg", "1deg"],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox={frame}>
          <Capy
            accessory={accessory}
            blink={pose?.eyesClosed ?? (motion && blink)}
            turn={pose?.turn}
            sip={pose?.sip}
            tilt={pose?.tilt}
            water={pose?.water ?? remainingWater.current}
          />
        </Svg>
      </Animated.View>
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
      {!!celebration && motion && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: hearts.interpolate({
                inputRange: [0, 0.15, 0.65, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateY: hearts.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, -65],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg width="100%" height="100%" viewBox={frame}>
            {[
              [210, 139, 1],
              [359, 124, 1.2],
              [320, 95, 0.7],
            ].map(([x, y, scale]) => (
              <Path
                key={x}
                d="M0 6 C-17 -5 -13 -17 -5 -15 Q0 -15 0 -10 Q5 -20 13 -14 Q24 -5 0 6Z"
                fill="#d99484"
                transform={`translate(${x} ${y}) scale(${scale})`}
              />
            ))}
            <Path
              d="M193 181 V169 M187 175 H199 M399 163 V151 M393 157 H405"
              stroke="#edbc65"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="预览喝水动画"
        disabled={!!pose || paused}
        onPress={(event) => {
          event.stopPropagation();
          setPreviewRun((value) => value + 1);
        }}
        style={sceneStyles.previewButton}
      >
        <Text style={sceneStyles.previewText}>
          {pose ? "卡皮在喝水…" : "▶ 看卡皮喝水"}
        </Text>
      </Pressable>
      {pose?.greeting && (
        <View pointerEvents="none" style={sceneStyles.greeting}>
          <Text
            accessibilityLiveRegion="polite"
            style={sceneStyles.greetingText}
          >
            {GREETING}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
const sceneStyles = StyleSheet.create({
  previewButton: {
    position: "absolute",
    right: 12,
    bottom: 36,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fffdf4",
  },
  previewText: { fontSize: 11, color: "#476343", fontWeight: "600" },
  greeting: {
    position: "absolute",
    alignSelf: "center",
    bottom: "12%",
    maxWidth: "90%",
    borderRadius: 18,
    backgroundColor: "#fffdf4",
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#476343",
    textAlign: "center",
  },
  stage: { width: "100%", aspectRatio: 600 / 390 },
});
