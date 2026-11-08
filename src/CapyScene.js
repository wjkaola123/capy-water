import React, { useEffect, useRef } from "react";
import { turtleMotion, turtleFootPose, scheduleTurtleTrips, createTurtleTrip } from "./turtleMotion";
import {
  Animated,
  AppState,
  Easing,
  Pressable,
  StyleSheet,
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

// 杯底落在左前方池沿的同一接触点；杯口是举杯与倾斜的共同锚点。
function cupGeometry(beverage) {
  const scale = beverage === "coffee" ? 0.82 : beverage === "juice" ? 0.72 : 1;
  const base = beverage === "coffee" ? 295 : beverage === "juice" ? 306 : 285;
  return {
    scale,
    restX: 174 - (316 + (290 - 316) * scale),
    restY: 336 - (251 + (base - 251) * scale),
  };
}
const APPROACH_X = -86;
const APPROACH_Y = 20;
const WATER_PER_SIP = 0.25;
const CUP_HANDLE = "M275 259 C264 253 248 251 247 263 C246 274 259 280 279 274";
const BIRD_FLAP_PHASES = Array.from({ length: 37 }, (_, index) => index / 36);
const BIRD_WING_SCALE = BIRD_FLAP_PHASES.map((_, index) =>
  index % 2 === 0 ? 1 : 0.35,
);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TURTLE_ROUTE_PHASES = Array.from({ length: 193 }, (_, index) => index / 192);
const TURTLE_ROUTE = TURTLE_ROUTE_PHASES.map(turtleMotion);

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

function SceneryLayer({ frame, wide, origin, opacity, transform, children, overlay }) {
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
      {overlay}
    </Animated.View>
  );
}

function LeafLadybug({ frame, wide, motion, paused, active }) {
  const crawl = useRef(new Animated.Value(0)).current;
  const [step, setStep] = React.useState(0);
  useEffect(() => {
    if (!motion || paused || !active) {
      crawl.setValue(0);
      setStep(0);
      return;
    }
    const animation = Animated.loop(Animated.timing(crawl, {
      toValue: 1,
      duration: 36000,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== "web",
      isInteraction: false,
    }));
    animation.start();
    // 低频更新 SVG 足部，位移与转身仍由原生动画驱动。
    const feet = setInterval(() => setStep((value) => (value + 1) % 300), 120);
    return () => {
      animation.stop();
      clearInterval(feet);
    };
  }, [motion, paused, active, crawl]);
  const phases = [0, .45, .5, .95, 1];
  // 交替三足步态：左前、右中、左后与另一组三足错半周期。
  const stride = Math.sin(step * Math.PI / 5);
  const legs = [-1, 1].flatMap((side) => [-3.5, 0, 3.5].map((y, row) => {
    const swing = stride * (row % 2 === 0 ? side : -side) * 2.6;
    return `M${side * 4} ${y} L${side * 6.5} ${y + swing * .5} L${side * 9} ${y + swing + 1}`;
  })).join(" ");
  return (
    <SceneryLayer frame={frame} wide={wide} origin={[548, 223]} transform={[
      { translateX: crawl.interpolate({ inputRange: phases, outputRange: [0, 4, 4, 0, 0] }) },
      { translateY: crawl.interpolate({ inputRange: phases, outputRange: [0, -6, -6, 0, 0] }) },
      { rotate: crawl.interpolate({ inputRange: phases, outputRange: ["35deg", "35deg", "215deg", "215deg", "395deg"] }) },
    ]}>
      <G transform="translate(548 223) scale(.7)">
        <Ellipse cx="0" cy="2" rx="8" ry="9" fill="#54764f" opacity=".2" />
        <Path d={legs} stroke="#815d41" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <G transform={`translate(0 ${Math.abs(stride) * -.45})`}>
        <Path d="M-2 -8 L-4 -11 M2 -8 L4 -11" stroke="#815d41" strokeWidth="1.2" strokeLinecap="round" />
        <Circle cy="-6" r="3.5" fill="#815d41" />
        <Ellipse rx="6.5" ry="7.5" fill="#d99484" />
        <Path d="M0 -5 V7" stroke="#815d41" strokeWidth=".8" fill="none" />
        {/* 中间一枚、左右鞘翅各三枚，合计七颗斑点。 */}
        {[[0, -5], [-3, -2], [3, -2], [-3.5, 1.5], [3.5, 1.5], [-2.5, 5], [2.5, 5]].map(([cx, cy], index) => (
          <Circle key={index} cx={cx} cy={cy} r="1.15" fill="#815d41" />
        ))}
        <Ellipse cx="-2.5" cy="-3.8" rx="1" ry="1.6" fill="#fffdf1" opacity=".55" />
        </G>
      </G>
    </SceneryLayer>
  );
}

function TurtleBody({ route, feet, response, limbs, enabled, walking }) {
  const values = useRef({ route: 0, feet: 0, response: 0, limbs: 0 });
  const [pose, setPose] = React.useState(values.current);
  useEffect(() => {
    const subscriptions = [route, feet, response, limbs].map((value, index) => {
      const key = ["route", "feet", "response", "limbs"][index];
      return value.addListener(({ value: next }) => { values.current[key] = next; });
    });
    if (!enabled) setPose({ route: 0, feet: 0, response: 0, limbs: 0 });
    // 只对矢量姿态做低频重绘，整段爬行的位置继续由 native driver 驱动。
    const timer = enabled ? setInterval(() => setPose({ ...values.current }), 50) : null;
    return () => {
      [route, feet, response, limbs].forEach((value, index) => value.removeListener(subscriptions[index]));
      if (timer) clearInterval(timer);
    };
  }, [route, feet, response, limbs, enabled]);
  const { angle: bodyAngle, turning } = turtleMotion(pose.route);
  const headAngle = bodyAngle + (turning ? .08 * Math.abs(Math.sin(bodyAngle)) : 0) + .12 * Math.sin(pose.response * Math.PI * 4);
  const direction = Math.cos(bodyAngle);
  const front = Math.abs(Math.sin(bodyAngle));
  const headFront = Math.abs(Math.sin(headAngle));
  const center = 43.5;
  const shellWidth = 23 - 3 * front;
  const headX = center + 25 * (1 - pose.response) * Math.cos(headAngle);
  const headY = 35 + 9 * (1 - pose.response) * Math.sin(headAngle) - 4 * pose.response;
  const tailExtension = 1 - .8 * pose.limbs;
  const tailSway = walking ? Math.sin(pose.feet * Math.PI * 2) * .3 : 0;
  const tailPoint = (back, lift) => `${center - back * tailExtension * direction} ${36 - back * tailExtension * .25 * Math.sin(bodyAngle) + lift * tailExtension}`;
  const drawFeet = (side) => [-1, 1].map((end) => {
    const foot = walking ? turtleFootPose(pose.feet, side, end, turning) : { offset: 0, lift: 0 };
    const x = center + end * (side === -1 ? 24 : 17) * direction + side * 12 * front;
    const y = (side === -1 ? 37 : 43) + end * 3 * Math.sin(bodyAngle);
    const toeX = x + foot.offset * direction;
    const toeY = y + 7 - foot.lift;
    const scale = 1 - .75 * pose.limbs;
    return <G key={`${side}-${end}`} opacity={1 - pose.limbs} transform={`translate(${center} 33) scale(${scale}) translate(${-center} -33)`}>
      <Path d={`M${x - 3} ${y - 3} Q${toeX - 9} ${toeY + 1} ${toeX} ${toeY} Q${toeX + 7} ${toeY} ${x + 5} ${y - 2}Z`} fill={side === -1 ? "#789b70" : "#8fab7d"} stroke="#54764f" strokeWidth=".8" />
      <Path d={`M${toeX - 3} ${toeY - 2} L${toeX - 3} ${toeY} M${toeX} ${toeY - 2} V${toeY}`} fill="none" stroke="#54764f" strokeWidth=".8" strokeLinecap="round" />
    </G>;
  });
  const face = Math.max(0, 1 + Math.min(0, Math.sin(headAngle)) * 2);
  const head = <G opacity={1 - pose.response} transform={`translate(${headX} ${headY}) scale(${1 - .7 * pose.response}) translate(${-headX} ${-headY})`}>
    <Ellipse cx={headX} cy={headY} rx={13 - 3 * headFront} ry="10" fill="#8fab7d" />
    <G opacity={face}>
      <Circle cx={headX + 6 * Math.cos(headAngle) - 4 * headFront} cy={headY - 3} r="1.8" fill="#815d41" />
      <Circle cx={headX + 6 * Math.cos(headAngle) + 4 * headFront} cy={headY - 3} r="1.8" fill="#815d41" opacity={headFront} />
      <Path d={`M${headX - 3 + 3 * Math.cos(headAngle)} ${headY + 4} Q${headX + 3 * Math.cos(headAngle)} ${headY + 7} ${headX + 3 + 3 * Math.cos(headAngle)} ${headY + 4}`} stroke="#54764f" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </G>
  </G>;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 87 56" style={StyleSheet.absoluteFill} accessible={false}>
      <G>
        <Path
          d={`M${tailPoint(19, 1)} Q${tailPoint(28, 5)} ${tailPoint(35, 6 + tailSway)} Q${tailPoint(28, 9)} ${tailPoint(18, 6)}Z`}
          fill="#789b70" fillOpacity={1} stroke="#54764f" strokeOpacity={1} strokeWidth="1.5" strokeLinejoin="round"
        />
        <Path d={`M${tailPoint(22, 4)} Q${tailPoint(27, 6)} ${tailPoint(31, 6.5 + tailSway * .5)}`} fill="none" stroke="#a7c598" strokeWidth="1" strokeLinecap="round" />
      </G>
      {head}
      {drawFeet(-1)}
      <Path d={`M${center - shellWidth} 41 Q${center - shellWidth - 2} ${17 - front * 3} ${center} ${17 - front * 3} Q${center + shellWidth} ${17 - front * 3} ${center + shellWidth + 2} 41 Q${center} ${49 + front} ${center - shellWidth} 41Z`} fill="#789b70" />
      <Path d={`M${center - shellWidth + 2} 39 Q${center} 44 ${center + shellWidth} 39 M${center} 19 L${center - 6 * direction} 30 L${center} 41 M${center - 6 * direction} 30 L${center - shellWidth + 3} 28 M${center - 6 * direction} 30 L${center + 9 * direction} 29 L${center + 17 * direction} 21 M${center + 9 * direction} 29 L${center + 14 * direction} 41`} fill="none" stroke="#a7c598" strokeWidth="1.6" strokeLinecap="round" />
      {drawFeet(1)}
      <G transform={`translate(${center - 4 * direction} ${17 - front * 3}) rotate(${-10 * Math.sin(bodyAngle)})`}>
        <Path d="M0 1 Q-2 -12 14 -10 Q17 1 0 1Z" fill="#8fab7d" />
        <Path d="M-1 2 L10 -7" fill="none" stroke="#54764f" strokeWidth="1.2" strokeLinecap="round" />
      </G>
      <G opacity={Math.max(0, Math.min(1, Math.sin(headAngle) * 4))}>{head}</G>
    </Svg>
  );
}

// 与场景使用同一坐标系，宽屏时也留在池沿下方；互动不触发摸头。
function PondNeighbor({ kind, wide, motion, paused, active }) {
  const idle = useRef(new Animated.Value(0)).current;
  const feet = useRef(new Animated.Value(0)).current;
  const [layoutWidth, setLayoutWidth] = React.useState(0);
  const [walking, setWalking] = React.useState(false);
  const response = useRef(new Animated.Value(0)).current;
  const limbs = useRef(new Animated.Value(0)).current;
  const journey = useRef(null);
  const sheltered = useRef(false);
  const responseRun = useRef(null);
  const turtle = kind === "turtle";
  const peck = kind === "peck";
  const x = turtle ? 111 : peck ? 434 : 477;
  const y = turtle ? 367 : peck ? 372 : 365;
  const width = turtle ? 87 : 47;
  const height = turtle ? 56 : 55;
  const enabled = motion && !paused && active;
  useEffect(() => {
    sheltered.current = false;
    setWalking(false);
    if (!enabled) {
      idle.setValue(0);
      responseRun.current?.stop();
      response.setValue(0);
      limbs.setValue(0);
      return;
    }
    if (turtle) {
      idle.setValue(0);
      const cancel = scheduleTurtleTrips({ startTrip: (done) => {
        idle.setValue(0);
        const trip = createTurtleTrip({
          initiallyHeld: sheltered.current,
          onWalking: setWalking,
          stop: (save) => idle.stopAnimation(save),
          move: (from, duration, finished) => {
            idle.setValue(from);
            Animated.timing(idle, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: Platform.OS !== "web", isInteraction: false }).start(({ finished: complete }) => finished(complete));
          },
          onComplete: (finished) => {
            journey.current = null;
            idle.setValue(0);
            done(finished);
          },
        });
        journey.current = trip;
        return () => { trip.dispose(); journey.current = null; };
      } });
      return () => {
        cancel();
        responseRun.current?.stop();
      };
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(peck ? 2600 : 10500),
      Animated.timing(idle, {
        toValue: 1,
        duration: peck ? 2200 : 1600,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
      }),
      Animated.timing(idle, { toValue: 0, duration: 0, useNativeDriver: Platform.OS !== "web", isInteraction: false }),
    ]));
    animation.start();
    return () => {
      animation.stop();
      responseRun.current?.stop();
    };
  }, [enabled, turtle, peck, idle, response, limbs]);
  useEffect(() => {
    if (!enabled || !turtle || !walking) {
      feet.setValue(0);
      return;
    }
    const gait = Animated.loop(Animated.timing(feet, {
      toValue: 1,
      duration: 2200,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== "web",
      isInteraction: false,
    }));
    gait.start();
    return () => gait.stop();
  }, [enabled, turtle, feet, walking]);
  // 以实际显示宽度换算场景坐标，终点落在池前中央 x=300。
  const sceneScale = layoutWidth / 87;
  const react = (event) => {
    event.stopPropagation();
    if (!enabled) return;
    responseRun.current?.stop();
    if (turtle) {
      sheltered.current = true;
      journey.current?.pause();
      const retract = (value, toValue, duration) => Animated.timing(value, { toValue, duration, useNativeDriver: Platform.OS !== "web", isInteraction: false });
      responseRun.current = Animated.sequence([
        Animated.parallel([retract(response, 1, 240), retract(limbs, 1, 240)]),
        Animated.delay(1800),
        retract(response, .22, 600),
        Animated.delay(900),
        retract(response, .12, 500),
        Animated.parallel([retract(response, 0, 600), retract(limbs, 0, 750)]),
      ]);
      responseRun.current.start(({ finished }) => {
        if (!finished) return;
        sheltered.current = false;
        journey.current?.resume();
      });
      return;
    }
    response.setValue(0);
    responseRun.current = Animated.sequence([
      Animated.timing(response, { toValue: 1, duration: 220, useNativeDriver: Platform.OS !== "web" }),
      Animated.delay(450),
      Animated.timing(response, { toValue: 0, duration: 400, useNativeDriver: Platform.OS !== "web" }),
    ]);
    responseRun.current.start();
  };
  const peckPhases = [0, .12, .28, .34, .5, .62, .76, .82, 1];
  const headTurn = Animated.add(
    idle.interpolate({
      inputRange: peck ? peckPhases : [0, .2, .4, .6, .8, 1],
      // 面向左侧，以颈部为轴逆时针低头，让喙接近脚边的地面。
      outputRange: peck ? [0, -12, -58, -58, 0, -12, -58, -58, 0] : [0, 0, -12, 0, 0, 0],
    }),
    response.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }),
  ).interpolate({ inputRange: [-90, 30], outputRange: ["-90deg", "30deg"] });
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={turtle ? "看看池边的小乌龟" : peck ? "看看啄草籽的小麻雀" : "看看歪头的小麻雀"}
      onPress={react}
      onLayout={turtle ? (event) => setLayoutWidth(event.nativeEvent.layout.width) : undefined}
      style={{
        position: "absolute",
        left: `${((x + (wide ? 100 : 0)) / (wide ? 800 : 600)) * 100}%`,
        top: `${((y + (wide ? 0 : 80)) / (wide ? 440 : 520)) * 100}%`,
        width: `${(width / (wide ? 800 : 600)) * 100}%`,
        height: `${(height / (wide ? 440 : 520)) * 100}%`,
        transform: [
          { translateX: turtle ? idle.interpolate({ inputRange: TURTLE_ROUTE_PHASES, outputRange: TURTLE_ROUTE.map((point) => point.x * sceneScale) }) : 0 },
          { translateY: turtle ? idle.interpolate({ inputRange: TURTLE_ROUTE_PHASES, outputRange: TURTLE_ROUTE.map((point) => point.y * sceneScale) }) : 0 },
        ],
      }}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} accessible={false}>
        <Ellipse cx={turtle ? 40 : 23} cy={height - 6} rx={turtle ? 32 : 16} ry="3" fill="#a6b895" opacity=".55" />
      </Svg>
      {turtle ? <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <TurtleBody route={idle} feet={feet} response={response} limbs={limbs} enabled={enabled} walking={walking} />
      </View> : <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
        transform: [
          { translateY: peck ? 0 : idle.interpolate({ inputRange: [0, .2, .35, .5, .65, 1], outputRange: [0, 0, -5, 0, -3, 0] }) },
        ],
      }]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} accessible={false}>
            <Path d="M19 43 L18 49 M28 43 L29 49 M15 49 H21 M26 49 H32" fill="none" stroke="#815d41" strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M32 31 L44 23 L40 37 L30 39Z" fill="#815d41" />
            <Ellipse cx="23" cy="33" rx="15" ry="13" fill="#cca074" />
            <Ellipse cx="19" cy="36" rx="10" ry="9" fill="#e3dec5" />
            <Path d="M25 28 Q39 29 33 39 Q26 40 23 34" fill="#815d41" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, {
          transformOrigin: peck ? "49% 60%" : "40% 50%",
          transform: [
            { translateY: peck ? idle.interpolate({ inputRange: peckPhases, outputRange: [0, .3, 1.5, 1.5, 0, .3, 1.5, 1.5, 0] }) : 0 },
            { rotate: headTurn },
          ],
        }]}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} accessible={false}>
              <Circle cx="17" cy="21" r="11" fill="#cca074" />
              <Path d="M7 19 Q7 8 17 10 Q26 10 28 20 Q17 16 7 19Z" fill="#815d41" />
              <Ellipse cx="13" cy="25" rx="7" ry="5" fill="#e3dec5" />
              <Path d="M7 22 L1 25 L8 27Z" fill="#edab4a" />
              <Circle cx="12" cy="20" r="1.6" fill="#815d41" />
              <Circle cx="17" cy="26" r="1.8" fill="#e7b9ae" />
          </Svg>
        </Animated.View>
      </Animated.View>}
    </AnimatedPressable>
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

function Cup({ x = 0, y = 0, tilt = 0, water, beverage = "tea" }) {
  const { scale } = cupGeometry(beverage);
  const waterClip = `cup-water-${React.useId().replace(/:/g, "")}`;
  const coffee = beverage === "coffee";
  const juice = beverage === "juice";
  const bottom = juice ? 306 : coffee ? 294 : 283;
  const vessel = juice
    ? "M264 251 L271 302 Q290 309 309 302 L316 251Z"
    : coffee
      ? "M264 251 L266 283 Q267 295 290 295 Q313 295 314 283 L316 251Z"
      : "M264 253 L272 281 Q292 289 310 281 L316 251Z";
  const liquid = juice ? "#eea342" : coffee ? "#815d41" : "#8eb8a0";
  const cupAngle = 32 * tilt;
  const angle = (cupAngle * Math.PI) / 180;
  const surfaceY = mix(bottom, 256, water);
  const leftWaterY = surfaceY + 26 * Math.tan(angle);
  const rightWaterY = surfaceY - 26 * Math.tan(angle);
  return (
    <G
      transform={`translate(${x} ${y}) rotate(${cupAngle} 316 251) translate(316 251) scale(${scale}) translate(-316 -251)`}
    >
      <Defs>
        <ClipPath id={waterClip}>
          <Path d={vessel} />
        </ClipPath>
      </Defs>
      {!juice && <Path
        d={coffee ? "M265 259 C236 250 238 285 265 280" : CUP_HANDLE}
        fill="none"
        stroke="#8e9676"
        strokeWidth="6"
      />}
      {!juice && <Path
        d={coffee ? "M265 259 C236 250 238 285 265 280" : CUP_HANDLE}
        fill="none"
        stroke="#f7f4e4"
        strokeWidth="2.5"
      />}
      <Path
        d={vessel}
        fill={juice ? "#fffdf1" : coffee ? "#d9b58b" : "#f7f4e4"}
        fillOpacity={juice ? 0.4 : 1}
        stroke="#8e9676"
        strokeWidth="2.5"
      />
      {water > 0 && (
        <G clipPath={`url(#${waterClip})`}>
          <Path
            d={`M263 ${leftWaterY} L317 ${rightWaterY} V${bottom + 8} H263Z`}
            fill={liquid}
            opacity=".78"
          />
          <Path
            d={`M263 ${leftWaterY} L317 ${rightWaterY}`}
            stroke="#d7eee0"
            strokeWidth="2"
          />
        </G>
      )}
      {coffee && (
        <G>
          <Path d="M266 276 Q290 282 314 276 L314 283 Q313 295 290 295 Q267 295 266 283Z" fill="#d9b58b" />
          <Ellipse cx="291" cy="286" rx="5" ry="6" fill="#815d41" transform="rotate(25 291 286)" />
          <Path d="M293 281 Q288 285 290 291" stroke="#d9b58b" strokeWidth="1.3" fill="none" />
        </G>
      )}
      <Ellipse
        cx="290"
        cy="251"
        rx="26"
        ry="7"
        fill="none"
        stroke="#8e9676"
        strokeWidth="2.5"
      />
      <Path
        d={juice ? "M271 260 L275 292" : coffee ? "M271 260 L272 280" : "M270 260 L274 275"}
        stroke="#fffdf3"
        strokeWidth="3"
        opacity=".7"
        strokeLinecap="round"
      />
      {juice && (
        <G>
          <Path d="M302 249 A12 12 0 0 1 326 249Z" fill="#eea342" stroke="#f7c679" strokeWidth="2" />
          <Path d="M314 249 L306 241 M314 249 V238 M314 249 L322 241" stroke="#fffdf1" strokeWidth="1.5" />
        </G>
      )}
    </G>
  );
}

export function CapyBeverageIcon({ beverage }) {
  return (
    <Svg width={66} height={58} viewBox="235 233 96 84" aria-hidden={true}>
      <Cup beverage={beverage} water={0.8} />
    </Svg>
  );
}

function Capy({
  beverage = "tea",
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
  const { scale: cupScale, restX, restY } = cupGeometry(beverage);
  const cupX = mix(restX - APPROACH_X, -26 * sip, lift);
  const cupY = mix(restY - APPROACH_Y, 20 - 41 * sip, lift);
  const cupAngle = 32 * tilt;
  const angle = (cupAngle * Math.PI) / 180;
  // Hand and cup share the same transform, so the wrist stays attached while tilting.
  const handPoint = (x, y) => {
    const dx = (x - 316) * cupScale;
    const dy = (y - 251) * cupScale;
    return `${316 + cupX + dx * Math.cos(angle) - dy * Math.sin(angle)} ${251 + cupY + dx * Math.sin(angle) + dy * Math.cos(angle)}`;
  };
  const elbowY = 278 - 19 * sip;
  const armOutline = beverage === "juice"
    ? `M231 245
    C224 259 230 ${elbowY} ${handPoint(267, 288)}
    Q${handPoint(276, 295)} ${handPoint(284, 289)}
    Q${handPoint(291, 285)} ${handPoint(287, 280)}
    Q${handPoint(285, 277)} ${handPoint(279, 280)}
    L${handPoint(273, 281)}
    Q${handPoint(280, 269)} ${handPoint(274, 267)}
    Q${handPoint(268, 266)} ${handPoint(264, 277)}
    C237 ${elbowY - 8} 246 258 248 250`
    : `M231 245
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
              d="M330 276 Q344 273 350 283 L351 291 Q366 292 365 299 C361 305 340 305 334 300 Q328 295 328 286Z"
              fill="#b58156"
            />
            <Path d="M351 297 Q355 298 355 302" fill="none" />
          </G>
          <G transform={`translate(${nearFoot.x * footBlend} ${nearFoot.y * footBlend})`}>
            <Path
              d="M250 279 Q263 274 275 282 L274 294 Q291 294 291 301 C288 308 263 308 255 302 Q249 297 249 288Z"
              fill="#bb8b62"
            />
            <Path d="M275 302 Q279 303 279 308" fill="none" />
          </G>
        </G>
      )}
      <Path
        d="M218 257 C212 230 225 200 247 189 C272 176 321 178 346 194 C367 208 378 242 368 266 C359 289 335 295 295 295 C256 295 227 285 218 257Z"
        fill="#bb8b62"
        stroke="#815d41"
        strokeWidth="3"
      />
      <Ellipse cx="293" cy="265" rx="49" ry="23" fill="#cda278" opacity=".65" />
      <Path
        d="M222 167 C209 159 207 143 214 137 C223 130 234 138 240 150 Q237 162 222 167Z M325 151 C326 139 333 131 341 133 C351 134 355 144 350 153 Q347 160 340 163 Q329 162 325 151Z"
        fill="#bc8c61"
        stroke="#815d41"
        strokeWidth="3"
      />
      <Path
        d="M219 151 C215 143 222 139 228 146 Q231 150 229 154 Q223 155 219 151Z M333 149 C334 142 340 138 344 142 Q347 146 343 152 Q338 155 333 149Z"
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
            d="M348 245 C356 253 355 266 350 273 Q345 280 338 277 C332 274 337 267 339 261 L340 251"
            fill="#bb8b62"
            stroke="#815d41"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {holdingCup && <Cup x={cupX} y={cupY} tilt={tilt} water={water} beverage={beverage} />}
          {!holdingCup && (
            <Path
              d="M233 246 C227 255 229 270 235 278 Q241 284 248 279 C253 275 247 269 246 263 L245 252"
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
                transform={`translate(${cupX} ${cupY}) rotate(${cupAngle} 316 251) translate(316 251) scale(${cupScale}) translate(-316 -251)`}
              >
                <Path
                  d={beverage === "juice"
                    ? "M274 284 Q280 285 286 282 M274 288 Q279 289 283 286"
                    : "M249 265 Q253 269 257 268 M256 263 L259 265"}
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

// 启动插画保持静态，读取动画偏好前也不会产生非必要动态。
export function CapyStartupIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="90 35 400 330" accessible={false}>
      <Circle cx="290" cy="185" r="140" fill="#e8eeda" />
      <Path d="M167 234 Q133 214 145 191 Q170 197 167 234 M409 232 Q440 205 428 183 Q403 196 409 232" fill="#83b39d" />
      <Ellipse cx="290" cy="287" rx="165" ry="55" fill="#e8eeda" />
      <Ellipse cx="290" cy="278" rx="153" ry="48" fill="#83b39d" />
      <Ellipse cx="290" cy="275" rx="130" ry="35" fill="none" stroke="#f7f8f2" strokeWidth="2" opacity="0.5" />
      <Capy mini blink turn={1} />
      <Path d="M186 260 Q290 309 394 260 Q381 310 290 313 Q199 310 186 260Z" fill="#83b39d" />
      <Path d="M209 284 Q232 291 251 289 M321 289 Q343 291 365 284" fill="none" stroke="#f7f8f2" strokeWidth="3" strokeLinecap="round" />
      <G fill="none" stroke="#54764f" strokeWidth="3" strokeLinecap="round" opacity="0.35">
        <Path d="M190 163 C174 146 200 135 189 118" />
        <Path d="M390 156 C374 139 400 128 389 111" />
      </G>
    </Svg>
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
  beverage = "tea",
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
  const { restX, restY } = cupGeometry(beverage);
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
  useEffect(() => {
    remainingWater.current = 1;
    setPose(null);
  }, [beverage]);
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
  }, [motion, paused, active, previewRun, beverage]);
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
    <View style={[sceneStyles.stage, wide && { aspectRatio: 800 / 440 }]}>
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
          {[
            // 舒展的低云：左侧轻柔，右侧逐渐收窄。
            [245, -32, 0.66,
              "M-57 14 C-68 11 -64 -2 -52 -3 C-52 -18 -33 -23 -22 -13 C-15 -30 10 -28 17 -10 C30 -17 45 -10 46 1 C64 -1 73 11 62 18 C42 24 20 21 0 23 C-24 24 -48 24 -57 14Z"],
            // 圆润的积云：主峰偏左，两侧云团高低不同。
            [375, 4, 0.7,
              "M-54 20 C-69 17 -66 0 -51 -3 C-58 -18 -39 -32 -25 -24 C-22 -44 9 -45 17 -23 C32 -29 48 -17 46 -4 C66 -6 76 11 62 21 C44 29 25 24 5 27 C-18 28 -40 27 -54 20Z"],
            // 轻薄的层云：宽而扁，边缘更平缓。
            [505, -24, 0.68,
              "M-59 14 C-72 10 -65 -2 -51 -1 C-44 -14 -27 -15 -15 -8 C-5 -24 19 -23 29 -9 C44 -13 57 -6 57 4 C76 5 78 17 62 21 C39 23 21 20 0 23 C-23 25 -48 23 -59 14Z"],
          ].map(([x, y, scale, outline]) => (
            <G key={x} transform={`translate(${x} ${y}) scale(${scale})`}>
              <Path
                d={outline}
                fill="#fffdf1"
              />
            </G>
          ))}
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
        overlay={<LeafLadybug frame={frame} wide={wide} motion={motion} paused={paused} active={active} />}
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
              beverage={beverage}
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
            <Ellipse cx="174" cy="337" rx="19" ry="3" fill="#8e9676" opacity=".2" />
            <Cup x={restX} y={restY} water={pose?.water ?? remainingWater.current} beverage={beverage} />
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="摸摸卡皮的头"
        onPress={onPet}
        style={StyleSheet.absoluteFill}
      />
      {["turtle", "peck", "hop"].map((kind) => (
        <PondNeighbor key={kind} kind={kind} wide={wide} motion={motion} paused={paused} active={active} />
      ))}
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
    </View>
  );
}
const sceneStyles = StyleSheet.create({
  stage: { width: "100%", aspectRatio: 600 / 520 },
});
