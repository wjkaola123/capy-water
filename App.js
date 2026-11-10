import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Feather from "@expo/vector-icons/Feather";
import Svg, { Circle, Path, Defs, ClipPath, Ellipse, LinearGradient, Stop, Rect, RadialGradient } from "react-native-svg";
import * as Haptics from "expo-haptics";
import CapyScene, { CapyAvatar, CapyEffectIcon, CapyBeverageIcon, CapyStartupIllustration } from "./src/CapyScene";
import {
  companionDays,
  createEntry,
  entriesForDay,
  reminderSlots,
  totalForDay,
  validAmount,
  waterGardenData,
  weeklyWaterGarden,
  dayKey,
} from "./src/hydration";
import { useHydration } from "./src/useHydration";
import { applyReminders, reminderPermission } from "./src/reminders";
import { C, s } from "./src/styles";

const MotionContext = React.createContext(true);
const STARTUP_MIN_DURATION_MS = 1800;
const WATER_TOPICS = [
  "今天，也要好好喝水",
  "喝一口水，歇一小会儿",
  "让清水陪你慢下来",
  "给忙碌留一口水的时间",
  "把水杯放在手边",
  "口渴了，就喝一点水",
  "一杯温水，暖暖日常",
  "和卡皮一起，慢慢喝水",
  "小口慢饮，刚刚好",
  "工作间隙，喝口清水",
  "出门前，带上水杯",
  "每一口水，都有被记住",
];
const NAV = [
  { key: "home", icon: "sun", label: "喝水小院" },
  { key: "journal", icon: "bar-chart-2", label: "饮水手记" },
  { key: "garden", icon: "feather", label: "卡皮花园" },
  { key: "settings", icon: "sliders", label: "偏好设置" },
];
const REPLIES = [
  "这一杯，是给自己的小小关心。",
  "咕嘟咕嘟，今天的你也很棒。",
  "水喝下去了，烦恼就先放一边吧。",
  "不用急着变好，我们慢慢来。",
  "你照顾自己，我就很开心。",
];
const PET_REPLIES = [
  "摸摸收到啦，送你一颗小爱心。",
  "今天也辛苦啦，在这里歇一会儿吧。",
  "我在呢。陪你发一小会儿呆。",
  "生活有点忙，但你可以慢一点。",
];
const Icon = ({ name, size = 20, color = C.green }) => (
  <Feather name={name} size={size} color={color} />
);
const time = (date) =>
  new Date(date).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

function Button({
  children,
  label,
  onPress,
  style,
  disabled,
  testID,
  quiet = false,
}) {
  const motionEnabled = React.useContext(MotionContext);
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (value) => {
    if (!motionEnabled) return;
    Animated.spring(scale, {
      toValue: value,
      friction: 5,
      tension: 190,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };
  return (
    <Animated.View
      style={{ transform: [{ scale }], opacity: disabled ? 0.45 : 1 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animate(0.96)}
        onPressOut={() => animate(1)}
        style={({ hovered, pressed }) => [
          s.button,
          quiet && s.quietButton,
          style,
          (hovered || pressed) && { opacity: 0.86 },
        ]}
      >
        {children || (
          <Text style={quiet ? s.quietButtonText : s.buttonText}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
function SectionTitle({ title, icon, action, onAction }) {
  return (
    <View style={s.sectionTitle}>
      <View style={s.row}>
        {icon && <Icon name={icon} size={18} />}
        <Text accessibilityRole="header" style={s.cardTitle}>
          {title}
        </Text>
      </View>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={s.inlineAction}
        >
          <Text style={s.link}>{action}</Text>
          <Icon name="chevron-right" size={14} color={C.muted} />
        </Pressable>
      )}
    </View>
  );
}
function Cup({ size = 30, fill = "#c5d5b6", level = 0.65 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 44">
      <Path
        d="M9 8 H29 L27 34 Q20 39 12 34Z"
        fill="#fff"
        stroke="#97aa8d"
        strokeWidth="1.8"
      />
      <Path
        d={`M11 ${32 - 22 * level} Q20 ${35 - 22 * level} 28 ${32 - 22 * level} L26 33 Q20 37 13 33Z`}
        fill={fill}
      />
      <Path
        d="M30 13 Q40 12 36 24 Q35 27 29 26"
        stroke="#97aa8d"
        strokeWidth="1.8"
        fill="none"
      />
      <Path
        d="M15 13 L16 28"
        stroke="#fff"
        strokeWidth="2"
        opacity=".7"
        strokeLinecap="round"
      />
    </Svg>
  );
}
function ProgressRing({ total, goal, motion }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = useState(0);
  useEffect(() => {
    const listener = progress.addListener(({ value }) =>
      setDisplayProgress(value),
    );
    return () => progress.removeListener(listener);
  }, [progress]);
  const ratio = Math.min(total / goal, 1),
    circumference = 2 * Math.PI * 79;
  useEffect(() => {
    const a = Animated.timing(progress, {
      toValue: ratio,
      duration: motion ? 900 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [ratio, motion, progress]);
  return (
    <View
      style={s.ring}
      accessibilityLabel={`今天已喝 ${total} 毫升，目标 ${goal} 毫升，完成 ${Math.round((total / goal) * 100)}%`}
    >
      <Svg width={192} height={192} viewBox="0 0 192 192">
        <Circle
          cx="96"
          cy="96"
          r="79"
          fill="none"
          stroke="#edf1e6"
          strokeWidth="12"
        />
        <Circle
          cx="96"
          cy="96"
          r="79"
          fill="none"
          stroke="#8fa976"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - displayProgress)}
          transform="rotate(-90 96 96)"
        />
        <Circle cx="96" cy="96" r="63" fill="#fafbf7" />
      </Svg>
      <View style={s.ringInside}>
        <Icon
          name={total >= goal ? "check" : "droplet"}
          size={20}
          color="#91a57c"
        />
        <Text testID="today-total" style={s.ringNumber}>
          {total.toLocaleString()}
        </Text>
        <Text style={s.ringCaption}>/ {goal.toLocaleString()} ml</Text>
      </View>
    </View>
  );
}
function GardenPlant({ height = 44, size = 32 }) {
  return (
    <Svg width={size} height={height} viewBox="0 0 40 80" aria-hidden={true}>
      <Path d="M20 76 V23" stroke="#789b70" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M20 48 C0 49 0 28 5 28 C17 28 20 38 20 48Z" fill="#b9cfae" />
      <Path d="M20 35 C20 18 32 14 37 18 C38 30 30 37 20 35Z" fill="#789b70" />
      <Path d="M20 63 C23 48 33 45 38 49 C37 61 30 66 20 63Z" fill="#b9cfae" />
      <Path d="M6 77 Q20 73 34 77" stroke="#cddcc2" strokeWidth="4" strokeLinecap="round" fill="none" />
    </Svg>
  );
}



const AnimatedPondWater = Animated.createAnimatedComponent(Path);

function WeeklyWalk({ entries, now, selectedKey, onSelect }) {
  const motion = React.useContext(MotionContext);
  const weeks = weeklyWaterGarden(entries, now);
  const selected = Math.max(0, weeks.findIndex((week) => week.days.some((day) => day.key === selectedKey)));
  const position = useRef(new Animated.Value(selected)).current;
  const step = useRef(new Animated.Value(0)).current;
  const stride = useRef(new Animated.Value(0)).current;
  const tide = useRef(new Animated.Value(0)).current;
  const currentPosition = useRef(selected);
  const [mapWidth, setMapWidth] = useState(0);
  const [facing, setFacing] = useState(1);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useEffect(() => {
    tide.setValue(0);
    if (!motion || !foreground) return;
    // 四个水塘共用慢时钟；SVG 路径形变使用 JS driver。
    const ripples = Animated.loop(Animated.timing(tide, {
      toValue: 1, duration: 6200, easing: Easing.linear,
      useNativeDriver: false, isInteraction: false,
    }));
    ripples.start();
    return () => ripples.stop();
  }, [motion, foreground, tide]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => setForeground(state === "active"));
    const id = position.addListener(({ value }) => { currentPosition.current = value; });
    return () => { listener.remove(); position.removeListener(id); };
  }, [position]);
  useEffect(() => {
    position.stopAnimation();
    step.stopAnimation();
    stride.stopAnimation();
    step.setValue(0);
    const distance = Math.abs(selected - currentPosition.current);
    if (!motion || !foreground || distance < .01) {
      stride.setValue(0);
      position.setValue(selected);
      return;
    }
    setFacing(selected > currentPosition.current ? 1 : -1);
    const driver = Platform.OS !== "web";
    const footsteps = Animated.loop(Animated.timing(step, { toValue: 1, duration: 440, easing: Easing.linear, useNativeDriver: driver, isInteraction: false }));
    Animated.timing(stride, { toValue: 1, duration: 120, useNativeDriver: driver, isInteraction: false }).start();
    const walk = Animated.timing(position, { toValue: selected, duration: 450 + distance * 430, easing: Easing.inOut(Easing.sin), useNativeDriver: driver, isInteraction: false });
    footsteps.start();
    walk.start(({ finished }) => {
      if (!finished) return;
      Animated.timing(stride, { toValue: 0, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: driver, isInteraction: false }).start(({ finished: settled }) => {
        if (settled) { footsteps.stop(); step.setValue(0); }
      });
    });
    return () => { walk.stop(); footsteps.stop(); step.stopAnimation(); stride.stopAnimation(); };
  }, [selected, motion, foreground, position, step, stride]);
  const ceiling = Math.max(500, Math.ceil(Math.max(...weeks.map((week) => week.average)) / 500) * 500);
  const shortDate = (day) => `${day.date.getMonth() + 1}.${day.date.getDate()}`;
  return (
    <View style={{ marginTop: 16 }}>
      <SectionTitle title="卡皮的补水散步图" icon="map" />
      <View style={s.walkMap} onLayout={(event) => setMapWidth(event.nativeEvent.layout.width)}>
        <View pointerEvents="none" style={s.walkTrail} />
        <Animated.View pointerEvents="none" accessible={false} style={[s.walkCapy, {
          transform: [{ translateX: position.interpolate({ inputRange: [0, 3], outputRange: [mapWidth / 8 - 20, mapWidth * 7 / 8 - 20] }) }],
        }]}>
          <Animated.View style={{ width: 40, height: 40, transform: [{ scaleX: facing }] }}>
            {[{ x: 21, front: false, far: true }, { x: 45, front: true, far: true }, { x: 16, front: false, far: false }, { x: 40, front: true, far: false }].map(({ x, front, far }) => {
              // 同侧前后脚反相，对角脚同相；向前摆腿时抬脚，落地后向后蹬。
              const opposite = front === far;
              const swing = Animated.multiply(stride, step.interpolate({ inputRange: [0, .25, .5, .75, 1], outputRange: opposite ? [0, 28, 0, -28, 0] : [0, -28, 0, 28, 0] }));
              const lift = Animated.multiply(stride, step.interpolate({ inputRange: [0, .125, .25, .375, .5, .625, .75, .875, 1], outputRange: opposite ? [0, 0, 0, 0, 0, -1.4, -2, -1.4, 0] : [0, -1.4, -2, -1.4, 0, 0, 0, 0, 0] }));
              return <Animated.View key={x} style={{ position: "absolute", left: 0, top: 0, width: 40, height: 40, transformOrigin: [x * 40 / 64, 44 * 40 / 64, 0], transform: [{ translateY: lift }, { rotate: swing.interpolate({ inputRange: [-28, 28], outputRange: ["-28deg", "28deg"] }) }] }}>
                <Svg width={40} height={40} viewBox="0 0 64 64" aria-hidden={true}>
                  <Path d={`M${x} 43 Q${x - 1} 48 ${x} 53 L${x + 5} 54`} stroke={far ? "#815d41" : "#ad7d54"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </Animated.View>;
            })}
            <Animated.View style={{ transform: [{ translateY: Animated.multiply(stride, step.interpolate({ inputRange: [0, .25, .5, .75, 1], outputRange: [0, -1.1, 0, -1.1, 0] })) }] }}>
            <Svg width={40} height={40} viewBox="0 0 64 64" aria-hidden={true}>
              <Ellipse cx="28" cy="36" rx="23" ry="16" fill="#cca074" />
              <Path d="M32 21 Q42 14 51 23 L60 30 Q64 40 55 43 L37 43 Q27 37 32 21Z" fill="#cca074" />
              <Circle cx="37" cy="21" r="5" fill="#ad7d54" /><Circle cx="37" cy="21" r="2.5" fill="#e7b9ae" />
              <Circle cx="50" cy="29" r="1.8" fill="#815d41" />
              <Path d="M59 34 h2 M53 39 q4 2 7 -1" fill="none" stroke="#815d41" strokeWidth="1.5" strokeLinecap="round" />
              <Path d="M37 6 Q33 8 32 13 Q31 20 40 20 Q49 20 48 13 Q47 8 43 6Z" fill="#edbc65" stroke="#d89034" strokeWidth="1" />
              <Path d="M35 12 Q35 9 38 9" fill="none" stroke="#f5e5b3" strokeWidth="2" strokeLinecap="round" />
              <Path d="M40 6 Q40 3 42 2" fill="none" stroke="#647c46" strokeWidth="1.5" strokeLinecap="round" />
            </Svg>
            </Animated.View>
          </Animated.View>
        </Animated.View>
        <View style={s.walkPonds}>
          {weeks.map((item, index) => {
            const clip = `weekly-pond-${index}`;
            const level = 60 - item.average / ceiling * 45;
            const waterPath = (phase) => {
              const bend = motion && foreground ? Math.sin(phase * Math.PI * 2 + index * .8) * 2.4 : 0;
              return `M0 ${level} C13 ${level + bend} 27 ${level + bend} 40 ${level} C53 ${level - bend} 67 ${level - bend} 80 ${level} V70 H0Z`;
            };
            return (
              <Pressable key={item.days[0].key} accessibilityRole="button"
                accessibilityLabel={`${shortDate(item.days[0])}至${shortDate(item.days[6])}，日均记录${item.average}毫升，记录${item.recordedDays}天`}
                accessibilityState={{ selected: selected === index }} aria-pressed={selected === index}
                onPress={() => onSelect(item.days[6].key)} style={[s.walkPond, selected === index && s.walkPondSelected]}>
                <Text style={s.walkWeek}>{index === 3 ? "最近一周" : `第 ${index + 1} 周`}</Text>
                <Svg width="100%" height={75} viewBox="0 0 80 80" aria-hidden={true}>
                  <Defs><ClipPath id={clip}><Ellipse cx="40" cy="38" rx="34" ry="25" /></ClipPath></Defs>
                  <Ellipse cx="40" cy="38" rx="34" ry="25" fill="#f7f8f2" stroke={selected === index ? "#54764f" : "#cddcc2"} strokeWidth="2" />
                  {!!item.recordedDays && <AnimatedPondWater clipPath={`url(#${clip})`} d={tide.interpolate({
                    inputRange: Array.from({ length: 17 }, (_, frame) => frame / 16),
                    outputRange: Array.from({ length: 17 }, (_, frame) => waterPath(frame / 16)),
                  })} fill="#83b39d" />}
                  <Path d="M53 20 Q57 10 69 15 Q66 25 53 20Z" fill="#54764f" />
                  <Path d="M54 20 L65 16" stroke="#8fab7d" strokeWidth=".9" strokeLinecap="round" />
                  {Array.from({ length: item.recordedDays }, (_, flower) => {
                    const x = 12 + flower * 9;
                    return <React.Fragment key={flower}>
                      <Path d={`M${x} 76 v-6`} stroke="#54764f" strokeWidth="1.2" />
                      <Circle cx={x - 2} cy="69" r="2.4" fill="#e7b9ae" /><Circle cx={x + 2} cy="69" r="2.4" fill="#e7b9ae" /><Circle cx={x} cy="66" r="2.4" fill="#e7b9ae" /><Circle cx={x} cy="69" r="1.5" fill="#eea342" />
                    </React.Fragment>;
                  })}
                </Svg>
                <Text style={s.walkAmount}>{item.recordedDays ? item.average.toLocaleString() : "—"}</Text>
                <Text style={s.walkSmall}>日均 ml</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

    </View>
  );
}

function WaterGarden({ entries, now }) {
  const [rangeValue, setRange] = useState(7);
  const range = rangeValue === 28 || rangeValue === 30 ? 28 : 7;
  const [selectedKey, setSelectedKey] = useState(null);
  const data = waterGardenData(entries, range, now);
  const selected = data.days.find((day) => day.key === selectedKey) || data.days.at(-1);
  const todayKey = dayKey(now);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return (
    <View style={s.card}>
      <SectionTitle title="卡皮的水分花园" icon="feather" />
      <View style={s.gardenRanges} accessibilityRole="radiogroup" accessibilityLabel="统计时间范围">
        {[7, 28].map((value) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityLabel={value === 28 ? "近4周" : "近7天"} accessibilityState={{ checked: range === value }} aria-checked={range === value}
            onPress={() => { setRange(value); setSelectedKey(null); }} style={[s.gardenRange, range === value && s.gardenRangeActive]}>
            <Text style={[s.gardenRangeText, range === value && { color: C.green, fontWeight: "700" }]}>{value === 28 ? "近 4 周" : "近 7 天"}</Text>
          </Pressable>
        ))}
      </View>
      {range === 7 ? (
        <View style={s.gardenWeek}>
          {data.days.map((day) => (
            <Pressable key={day.key} accessibilityRole="button" accessibilityLabel={`${day.key}，${day.cups ? `${day.amount}毫升，${day.cups}杯` : "未记录"}`}
              accessibilityState={{ selected: day.key === selected.key }} aria-pressed={day.key === selected.key} onPress={() => setSelectedKey(day.key)} style={[s.gardenPlantColumn, day.key === selected.key && s.gardenPlantSelected]}>
              <Text style={s.gardenWeekAmount}>{day.cups ? day.amount.toLocaleString() : "—"}</Text>
              <View style={s.gardenPlantBed}>
                {day.cups > 0 ? <GardenPlant height={35 + Math.min(day.amount / 2000, 1) * 45} /> : <View style={s.gardenSoil} />}
              </View>
              <Text style={s.gardenDate}>{day.key === todayKey ? "今天" : weekdays[day.date.getDay()]}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <WeeklyWalk entries={entries} now={now} selectedKey={selected.key} onSelect={setSelectedKey} />
      )}
      {range === 7 && <View style={s.gardenDetail} accessibilityLiveRegion="polite">
        <Text style={s.gardenDetailDate}>{selected.key}</Text>
        <Text style={s.gardenDetailText}>{selected.cups ? `${selected.amount.toLocaleString()} ml · ${selected.cups} 杯` : "这一天还没有记录"}</Text>
      </View>}
    </View>
  );
}

function ToastMessage({ toast, motion, desktop, onUndo, onDismiss }) {
  const progress = useRef(new Animated.Value(0)).current;
  const dismiss = React.useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: motion ? 160 : 0,
      easing: Easing.in(Easing.quad),
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }, [motion, onDismiss, progress]);
  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: motion ? 220 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
    const timer = setTimeout(dismiss, toast.id ? 2400 : toast.message.length > 22 ? 3500 : 2000);
    return () => {
      clearTimeout(timer);
      progress.stopAnimation();
    };
  }, [toast, motion, dismiss, progress]);
  return (
    <Animated.View
      style={[s.toast, !desktop && { bottom: 82 }, {
        opacity: progress,
        transform: [{ translateY: motion ? progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) : 0 }],
      }]}
      accessibilityLiveRegion="polite"
    >
      <Icon name="check-circle" color="#d4e4bd" size={16} />
      <Text style={s.toastText}>{toast.message}</Text>
      {toast.id ? (
        <Pressable accessibilityRole="button" accessibilityLabel="撤销刚刚的饮水记录" onPress={() => onUndo(toast.id)} style={s.toastUndo}>
          <Text style={s.toastUndoText}>撤销</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="关闭提示" onPress={dismiss} style={s.toastClose}>
          <Icon name="x" size={17} color="#d4e4bd" />
        </Pressable>
      )}
    </Animated.View>
  );
}

function StartupScreen({ ready = false, motion = false, mobilePreview = false }) {
  const backdropId = `startup-${React.useId().replace(/:/g, "")}`;
  const [allowMotion, setAllowMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (mounted) setAllowMotion(!reduced);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (reduced) => setAllowMotion(!reduced));
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  const previewMotion = __DEV__ && Platform.OS === "web" &&
    new URLSearchParams(window.location.search).get("previewMotion") === "1";
  return (
    <SafeAreaView style={[s.loading, mobilePreview && s.mobilePreviewFrame]}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`${backdropId}-wash`} x1="0" y1="0" x2="0.8" y2="1">
              <Stop offset="0" stopColor="#e8eeda" stopOpacity="0.6" />
              <Stop offset="0.48" stopColor="#f7f8f2" stopOpacity="0" />
              <Stop offset="1" stopColor="#e8eeda" stopOpacity="0.45" />
            </LinearGradient>
            <RadialGradient id={`${backdropId}-light`} cx="0.16" cy="0.12" rx="0.72" ry="0.36">
              <Stop offset="0" stopColor="#eea342" stopOpacity="0.09" />
              <Stop offset="1" stopColor="#eea342" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="390" height="844" fill={`url(#${backdropId}-wash)`} />
          <Rect width="390" height="844" fill={`url(#${backdropId}-light)`} />
          <Path d="M0 638 C92 588 191 713 390 620 L390 844 H0Z" fill="#e8eeda" opacity="0.6" />
          <Path d="M0 746 C127 664 233 795 390 707 L390 844 H0Z" fill="#83b39d" opacity="0.1" />
          <Path d="M0 760 C128 681 240 806 390 724" fill="none" stroke="#f7f8f2" strokeWidth="1.5" opacity="0.7" />
        </Svg>
      </View>
      <ScrollView contentContainerStyle={s.startupContent}>
        <View style={s.startupMain} accessibilityRole="progressbar" accessibilityLabel={ready ? "正在进入喝水小院" : "正在读取饮水记录"} accessibilityState={{ busy: true }}>
          <View style={s.startupArt} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <CapyStartupIllustration motion={ready && motion && (allowMotion || previewMotion)} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalSlider({ value, onChange }) {
  const [width, setWidth] = useState(0);
  const origin = useRef(0);
  const fraction = (value - 500) / 4500;
  const change = (next) => onChange(String(Math.max(500, Math.min(5000, next))));
  const fromPosition = (x) => {
    if (width > 32) change(500 + Math.round(Math.max(0, Math.min(1, (x - 16) / (width - 32))) * 90) * 50);
  };
  return <View style={{ marginVertical: 16 }}>
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
      <Text style={s.amountInput}>{value}</Text>
      <Text style={s.amountUnit}>ml / 天</Text>
    </View>
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="每日饮水目标"
      accessibilityValue={{ min: 500, max: 5000, now: value, text: `${value} 毫升` }}
      accessibilityActions={[{ name: "increment", label: "增加50毫升" }, { name: "decrement", label: "减少50毫升" }]}
      onAccessibilityAction={({ nativeEvent }) => change(value + (nativeEvent.actionName === "increment" ? 50 : -50))}
      {...(Platform.OS === "web" ? { tabIndex: 0, "aria-valuemin": 500, "aria-valuemax": 5000, "aria-valuenow": value, "aria-valuetext": `${value} 毫升`, onKeyDown: (event) => {
        const delta = { ArrowRight: 50, ArrowUp: 50, ArrowLeft: -50, ArrowDown: -50, PageUp: 500, PageDown: -500 }[event.key];
        if (delta !== undefined || event.key === "Home" || event.key === "End") {
          event.preventDefault();
          change(event.key === "Home" ? 500 : event.key === "End" ? 5000 : value + delta);
        }
      } } : {})}
      onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={({ nativeEvent }) => {
        origin.current = nativeEvent.pageX - nativeEvent.locationX;
        fromPosition(nativeEvent.locationX);
      }}
      onResponderMove={({ nativeEvent }) => fromPosition(nativeEvent.pageX - origin.current)}
      style={{ height: 48, justifyContent: "center", ...(Platform.OS === "web" ? { touchAction: "none", cursor: "pointer" } : {}) }}
    >
      <View pointerEvents="none" style={{ height: 8, marginHorizontal: 16, borderRadius: 4, backgroundColor: "#e8eeda" }}>
        <View style={{ width: `${fraction * 100}%`, height: 8, borderRadius: 4, backgroundColor: C.green }} />
      </View>
      <View pointerEvents="none" style={{ position: "absolute", left: Math.max(0, width - 32) * fraction, width: 32, height: 32, borderRadius: 16, backgroundColor: C.green, borderWidth: 4, borderColor: "#ffffff" }} />
    </View>
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={s.tiny}>500 ml</Text><Text style={s.tiny}>5000 ml</Text>
    </View>
  </View>;
}

function AppContent() {
  const {
    state,
    setState,
    ready,
    storageError,
    retry,
    canSave,
    now,
    refreshTime,
  } = useHydration();
  const [startupElapsed, setStartupElapsed] = useState(false);
  useEffect(() => {
    // 与存储读取并行，只在本次启动计时；切页、恢复前台和重试不重新等待。
    const timer = setTimeout(() => setStartupElapsed(true), STARTUP_MIN_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);
  const windowSize = useWindowDimensions();
  const mobilePreview = __DEV__ && Platform.OS === "web";
  const width = mobilePreview ? Math.min(windowSize.width, 390) : windowSize.width;
  const desktop = width >= 1040,
    columns = width >= 760;
  const [page, setPage] = useState("home"),
    [modal, setModal] = useState(null);
  const [topicIndex, setTopicIndex] = useState(0);
  const [drinkRun, setDrinkRun] = useState(0);
  const [customAmount, setCustomAmount] = useState(""),
    [goalInput, setGoalInput] = useState("2000");
  const [reminderDraft, setReminderDraft] = useState(state.reminder),
    [formError, setFormError] = useState(""),
    [busy, setBusy] = useState(false);
  const [speech, setSpeech] = useState("你来啦！一起喝杯水，发会儿呆吧。"),
    [celebration, setCelebration] = useState(0),
    [toast, setToast] = useState(null),
    [reduceMotion, setReduceMotion] = useState(false);
  const scroll = useRef(null),
    petCount = useRef(0),
    lastWebReminder = useRef("");
  const previewMotion =
    __DEV__ &&
    Platform.OS === "web" &&
    new URLSearchParams(window.location.search).get("previewMotion") === "1";
  const total = totalForDay(state.entries, now),
    today = entriesForDay(state.entries, now),
    days = companionDays(state.entries),
    motion = previewMotion || !reduceMotion;
  const showToast = (message, id = null) => {
    setToast({ message, id });
  };
  const dismissToast = React.useCallback(() => setToast(null), []);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [page]);
  useEffect(() => {
    if (page !== "home" || modal) return;
    const timer = setInterval(() => {
      if (AppState.currentState !== "active") return;
      setTopicIndex((index) => (index + 1) % WATER_TOPICS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [page, modal]);
  useEffect(() => {
    if (!ready || Platform.OS !== "web" || !state.reminder.enabled) return;
    const hit = reminderSlots(state.reminder).some(
      (slot) =>
        slot.hour === now.getHours() && slot.minute === now.getMinutes(),
    );
    const key = `${now.toDateString()}-${now.getHours()}-${now.getMinutes()}`;
    if (hit && lastWebReminder.current !== key) {
      lastWebReminder.current = key;
      setSpeech("给自己一个小休息，喝口水吧。");
      showToast("卡皮的喝水邀请：休息一下，喝口水吧。");
    }
  }, [now, ready, state.reminder]);
  useEffect(() => {
    if (!ready || Platform.OS === "web") return;
    const check = () => {
      if (state.reminder.enabled)
        reminderPermission()
          .then((granted) => {
            if (!granted) showToast("提醒权限已关闭，请到系统设置中开启。");
          })
          .catch(() => {});
    };
    check();
    const sub = AppState.addEventListener("change", (status) => {
      if (status === "active") check();
    });
    return () => sub.remove();
  }, [ready, state.reminder.enabled]);
  const addWater = (amount) => {
    if (!canSave || !validAmount(amount)) return;
    const entry = createEntry(amount);
    setState((previous) => ({
      ...previous,
      entries: [...previous.entries, entry],
    }));
    refreshTime();
    setSpeech(
      total < state.goal && total + amount >= state.goal
        ? "今天的小目标完成啦，接下来按口渴的感觉喝水吧。"
        : REPLIES[state.entries.length % REPLIES.length],
    );
    setCelebration((n) => n + 1);
    setDrinkRun((n) => n + 1);
    if (page === "home" || page === "garden") {
      scroll.current?.scrollTo({ y: 0, animated: motion });
    }
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    setModal(null);
    showToast(`已记录 ${amount} ml`, entry.id);
  };
  const undo = (id) => {
    setState((previous) => ({
      ...previous,
      entries: previous.entries.filter((e) => e.id !== id),
    }));
    showToast("已撤销记录");
  };
  const pet = () => {
    setSpeech(PET_REPLIES[petCount.current++ % PET_REPLIES.length]);
    setCelebration((n) => n + 1);
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
  };
  const openReminder = () => {
    setReminderDraft({ ...state.reminder });
    setFormError("");
    setModal("reminder");
  };
  const saveReminder = async () => {
    if (!reminderSlots(reminderDraft).length) {
      setFormError("结束时间需要晚于开始时间。");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      await applyReminders(reminderDraft);
      setState((previous) => ({ ...previous, reminder: reminderDraft }));
      setModal(null);
      showToast(
        reminderDraft.enabled
          ? Platform.OS === "web"
            ? "已开启页面内提醒，保持页面打开即可收到。"
            : "提醒已安排好，卡皮会准时来陪你。"
          : "提醒已关闭，想喝水时随时回来。",
      );
    } catch (error) {
      setFormError(error.message || "提醒保存失败，请重试。");
    } finally {
      setBusy(false);
    }
  };
  const openGoal = () => {
    setGoalInput(String(state.goal));
    setFormError("");
    setModal("goal");
  };
  const saveGoal = () => {
    const value = Number(goalInput);
    if (!Number.isInteger(value) || value < 500 || value > 5000) {
      setFormError("请设置 500–5000 ml 之间的整数。");
      return;
    }
    setState((previous) => ({ ...previous, goal: value }));
    setModal(null);
    showToast("目标已更新，找到适合自己的节奏就好。");
  };
  const openCustom = () => {
    setCustomAmount("");
    setFormError("");
    setModal("water");
  };
  const navigation = (mobile) => (
    <View style={mobile ? s.mobileNav : s.nav}>
      {NAV.map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="tab"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: page === item.key }}
          aria-selected={page === item.key}
          onPress={() => setPage(item.key)}
          style={({ hovered }) => [
            mobile ? s.mobileNavItem : s.navItem,
            page === item.key && (mobile ? s.mobileNavActive : s.navActive),
            hovered && { backgroundColor: "#e9eee1" },
          ]}
        >
          <Icon
            name={item.icon}
            size={mobile ? 21 : 20}
            color={page === item.key ? C.green : "#969b8c"}
          />
          <Text
            style={[
              mobile ? s.mobileNavText : s.navText,
              page === item.key && s.navTextActive,
            ]}
          >
            {item.label}
          </Text>
          {!mobile && page === item.key && <View style={s.navDot} />}
        </Pressable>
      ))}
    </View>
  );
  const recordList = (items, all = false) =>
    items.length ? (
      <View>
        {items.slice(0, all ? items.length : 3).map((entry) => (
          <View key={entry.id} style={s.recordRow}>
            <View style={s.recordIcon}>
              <Icon name="droplet" size={17} color="#88a279" />
            </View>
            <View style={s.flex}>
              <Text style={s.recordTitle}>给自己补一点水</Text>
              <Text style={s.tiny}>{time(entry.at)}</Text>
            </View>
            <Text style={s.recordAmount}>
              +{entry.amount}
              <Text style={s.tiny}> ml</Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`撤销 ${time(entry.at)} 的 ${entry.amount} 毫升记录`}
              onPress={() => undo(entry.id)}
              style={s.undoIcon}
            >
              <Icon name="rotate-ccw" size={14} color={C.muted} />
            </Pressable>
          </View>
        ))}
        {!all && items.length > 3 && (
          <Text style={[s.tiny, { marginTop: 12 }]}>
            另有 {items.length - 3} 条记录
          </Text>
        )}
      </View>
    ) : (
      <View style={s.emptyRecords}>
        <View style={s.emptyCup}>
          <Cup size={38} level={0.25} />
        </View>
        <View style={s.flex}>
          <Text style={s.recordTitle}>今天的第一杯，随时开始</Text>
        </View>
      </View>
    );
  const previewStartup = __DEV__ && Platform.OS === "web" &&
    new URLSearchParams(window.location.search).get("previewStartup") === "1";
  // 读取失败时优先展示主页的错误提示和重试入口。
  if (!ready || (!startupElapsed && !storageError) || previewStartup) {
    return <StartupScreen ready={ready && !storageError} motion={motion} mobilePreview={mobilePreview} />;
  }
  return (
    <MotionContext.Provider value={motion}>
      <SafeAreaView
        style={[
          s.safe,
          mobilePreview && s.mobilePreviewFrame,
        ]}
        edges={["top", "bottom"]}
      >
        <StatusBar style="dark" />
        <View style={s.app}>
          {desktop && (
            <View style={s.sidebar}>
              <Pressable
                onPress={() => setPage("home")}
                accessibilityRole="button"
                accessibilityLabel="卡皮补水站首页"
                style={s.brand}
              >
                <CapyAvatar size={49} />
                <View>
                  <Text style={s.brandName}>卡皮补水站</Text>
                </View>
              </Pressable>
              {navigation(false)}
            </View>
          )}
          <View style={s.workspace}>
            {!desktop && (
              <View style={s.mobileHeader}>
                <View style={s.row}>
                  <CapyAvatar size={34} />
                  <Text style={s.mobileBrand}>卡皮补水站</Text>
                </View>
                <Button
                  label="提醒设置"
                  onPress={openReminder}
                  quiet
                  style={s.iconButton}
                >
                  <Icon name="bell" size={20} />
                </Button>
              </View>
            )}
            <ScrollView
              ref={scroll}
              showsVerticalScrollIndicator={false}
              style={s.scroll}
              contentContainerStyle={[s.content, !desktop && s.contentSmall]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={s.pageHeader}>
                <View style={s.flex}>
                  <Text
                    accessibilityRole="header"
                    style={[s.pageTitle, !desktop && { fontSize: 26 }]}
                  >
                    {
                      {
                        home: WATER_TOPICS[topicIndex],
                        journal: "每一小口，都有被记住",
                        garden: "把小日子，养成小花园",
                        settings: "找到舒服的生活节奏",
                      }[page]
                    }
                  </Text>
                </View>
                {desktop && (
                  <View style={s.headerRight}>
                    <View style={s.dayBadge}>
                      <Icon name="sun" size={17} color="#b09258" />
                      <Text style={s.dayBadgeText}>
                        陪伴的第 {Math.max(days, 1)} 天
                      </Text>
                    </View>
                    <Button
                      label="提醒设置"
                      onPress={openReminder}
                      quiet
                      style={s.headerBell}
                    >
                      <Icon name="bell" size={19} />
                    </Button>
                  </View>
                )}
              </View>
              {!!storageError && (
                <Pressable
                  accessibilityRole="button"
                  onPress={retry}
                  style={s.errorBanner}
                >
                  <Text accessibilityRole="alert" style={s.errorText}>
                    {storageError} 点击重试
                  </Text>
                </Pressable>
              )}
              {page === "home" && (
                <View style={[s.dashboard, !columns && s.stack]}>
                  <View style={s.mainColumn}>
                    <View style={[s.hero, width < 480 && { height: 342 }]}>
                      <View
                        style={[
                          s.heroScene,
                          !columns && {
                            transform: [{ scale: 1.12 }],
                            transformOrigin: "center bottom",
                          },
                        ]}
                      >
                        <CapyScene
                          paused={!!modal}
                          wide={columns}
                          motion={motion}
                          accessory={state.accessory}
                          beverage={state.beverage}
                          effect={state.effect}
                          celebration={celebration}
                          drinkRequest={drinkRun}
                          onPet={pet}
                        />
                      </View>
                    </View>
                    {!columns && (
                      <View style={s.mobileProgress}>
                        <View style={s.rowBetween}>
                          <View style={s.row}>
                            <Icon name="droplet" size={17} />
                            <Text style={s.cardTitle}>今日水分</Text>
                            <Text testID="today-total" style={s.mobileTotal}>
                              {total.toLocaleString()}
                            </Text>
                            <Text style={s.tiny}>
                              / {state.goal.toLocaleString()} ml
                            </Text>
                          </View>
                        </View>
                        <View style={s.mobileTrack}>
                          <View
                            style={[
                              s.mobileFill,
                              {
                                width: `${Math.min((total / state.goal) * 100, 100)}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}
                    <View style={s.drinkCard}>
                      <View style={s.cupOptions}>
                        {[150, 250, 350, 500].map((amount, i) => (
                          <Pressable
                            key={amount}
                            accessibilityRole="button"
                            accessibilityLabel={`记录 ${amount} 毫升饮水`}
                            accessibilityState={{ disabled: !canSave }}
                            disabled={!canSave}
                            onPress={() => addWater(amount)}
                            style={({ pressed }) => [s.cupOption, pressed && s.cupSelected, !canSave && { opacity: .45 }]}
                          >
                            <Cup
                              size={36}
                              level={0.35 + i * 0.18}
                              fill="#a9c28d"
                            />
                            <Text
                              style={s.cupAmount}
                            >
                              {amount}
                              <Text style={s.cupUnit}> ml</Text>
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={s.card}>
                      <SectionTitle
                        title="今日的小小足迹"
                        icon="clock"
                      />
                      {recordList(today)}
                    </View>
                  </View>
                  {columns && <View style={s.sideColumn}>
                    {columns && (
                      <View style={s.progressCard}>
                        <SectionTitle
                          title="今日水分"
                        />
                        <ProgressRing
                          total={total}
                          goal={state.goal}
                          motion={motion}
                        />
                        <View style={s.progressSummary}>
                          <Text style={s.percent}>
                            {Math.round((total / state.goal) * 100)}%
                            <Text style={s.percentSmall}> 已完成</Text>
                          </Text>
                          {total >= state.goal && (
                            <Text style={s.tiny}>按口渴感喝水就好。</Text>
                          )}
                        </View>
                        <View style={s.progressDivider} />
                        <View style={s.progressBottom}>
                          <View style={s.row}>
                            <Icon name="coffee" size={16} color="#8e9a7d" />
                            <Text style={s.tiny}>
                              今天喝了{" "}
                              <Text style={s.boldGreen}>{today.length}</Text> 杯
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>}
                </View>
              )}
              {page === "journal" && (
                <View style={s.pageStack}>
                  <View style={s.statRow}>
                    {[
                      [`${total.toLocaleString()}`, "今日饮水", "droplet", "ml"],
                      [`${days}`, "记录天数", "sun", "天"],
                      [`${state.entries.length}`, "累计杯数", "coffee", "杯"],
                    ].map(([value, label, icon, unit]) => (
                      <View key={label} style={s.statCard} accessible accessibilityLabel={`${label}，${value}${unit === "ml" ? "毫升" : unit}`}>
                        <View style={s.rowBetween}>
                          <Icon name={icon} size={20} color="#91a57b" />
                          <Text style={s.statUnit}>{unit}</Text>
                        </View>
                        <Text style={s.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{value}</Text>
                        <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
                      </View>
                    ))}
                  </View>
                  <WaterGarden entries={state.entries} now={now} />
                  <View style={s.card}>
                    <SectionTitle
                      title="饮水手记"
                      icon="book-open"
                      action="记录一杯"
                      onAction={openCustom}
                    />
                    {state.entries.length
                      ? [...new Set(state.entries.map((e) => dayKey(e.at)))]
                          .sort()
                          .reverse()
                          .map((date) => {
                            const entries = entriesForDay(state.entries, `${date}T12:00:00`);
                            return (
                            <View key={date} style={{ marginTop: 20 }}>
                              <Text style={s.journalDate}>{date}</Text>
                              {recordList(entries, true)}
                            </View>
                            );
                          })
                      : recordList([])}
                  </View>
                </View>
              )}
              {page === "garden" && (
                <View style={s.pageStack}>
                  <View style={s.gardenHero}>
                    <View style={s.gardenScene}>
                      <CapyScene
                        paused={!!modal}
                        motion={motion}
                        accessory={state.accessory}
                        beverage={state.beverage}
                        effect={state.effect}
                        celebration={celebration}
                        drinkRequest={drinkRun}
                        onPet={pet}
                        garden={state.entries.length > 0}
                        growth={
                          state.entries.length >= 12
                            ? 3
                            : state.entries.length >= 5
                              ? 2
                              : 1
                        }
                      />
                    </View>
                  </View>
                  <View style={s.card}>
                    <SectionTitle title="陪卡皮喝点什么" icon="coffee" />
                    <View style={s.effectOptions} accessibilityRole="radiogroup" accessibilityLabel="卡皮的饮料">
                      {[
                        ["tea", "茶", "矮口陶杯"],
                        ["coffee", "咖啡", "圆柄马克杯"],
                        ["juice", "果汁", "高身玻璃杯"],
                      ].map(([id, title, cup]) => (
                        <Pressable
                          key={id}
                          accessibilityRole="radio"
                          accessibilityLabel={`${title}，${cup}`}
                          accessibilityState={{ checked: state.beverage === id }}
                          aria-checked={state.beverage === id}
                          onPress={() => {
                            setState((previous) => ({ ...previous, beverage: id }));
                            setSpeech(`给卡皮准备了一杯${title}，一起慢慢享用吧。`);
                          }}
                          style={[s.effectOption, s.beverageOption, state.beverage === id && s.cupSelected]}
                        >
                          <CapyBeverageIcon beverage={id} />
                          <Text style={s.effectLabel}>{title}</Text>
                          {state.beverage === id && (
                            <View style={s.cupCheck}>
                              <Icon name="check" size={9} color="#fff" />
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={s.card}>
                    <SectionTitle title="给快乐加点特效" icon="sun" />
                    <View style={s.effectOptions} accessibilityRole="radiogroup" accessibilityLabel="卡皮互动特效">
                      {[
                        ["hearts", "爱心泡泡"],
                        ["stars", "星光闪闪"],
                        ["petals", "花瓣轻舞"],
                      ].map(([id, title]) => (
                        <Pressable
                          key={id}
                          accessibilityRole="radio"
                          accessibilityLabel={title}
                          accessibilityState={{ checked: state.effect === id }}
                          aria-checked={state.effect === id}
                          onPress={() => {
                            setState((previous) => ({ ...previous, effect: id }));
                            setCelebration((count) => count + 1);
                            scroll.current?.scrollTo({ y: 0, animated: motion });
                          }}
                          style={[
                            s.effectOption,
                            state.effect === id && s.cupSelected,
                          ]}
                        >
                          <CapyEffectIcon effect={id} />
                          <Text style={s.effectLabel}>{title}</Text>
                          {state.effect === id && (
                            <View style={s.cupCheck}>
                              <Icon name="check" size={9} color="#fff" />
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View style={s.card}>
                    <SectionTitle title="给卡皮换个小装扮" icon="smile" />
                    <View style={s.accessories}>
                      {[
                        {
                          id: "orange",
                          title: "一颗小橘子",
                          need: 0,
                          note: "初次见面的礼物",
                        },
                        {
                          id: "flower",
                          title: "春日小花环",
                          need: 5,
                          note: "累计记录 5 杯解锁",
                        },
                        {
                          id: "towel",
                          title: "温泉小毛巾",
                          need: 12,
                          note: "累计记录 12 杯解锁",
                        },
                        {
                          id: "leaf",
                          title: "清凉小叶帽",
                          need: 20,
                          note: "累计记录 20 杯解锁",
                        },
                      ].map((item) => {
                        const unlocked = state.entries.length >= item.need;
                        return (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`${item.title}${unlocked ? "，点击穿戴" : `，${item.note}`}`}
                            accessibilityState={{
                              selected: state.accessory === item.id,
                            }}
                            aria-pressed={state.accessory === item.id}
                            key={item.id}
                            onPress={() => {
                              if (!unlocked) {
                                showToast(
                                  `还差 ${item.need - state.entries.length} 杯真实记录，就能解锁啦。`,
                                );
                                return;
                              }
                              setState((previous) => ({
                                ...previous,
                                accessory: item.id,
                              }));
                              setCelebration((n) => n + 1);
                              showToast(`已戴上${item.title}，卡皮很喜欢。`);
                            }}
                            style={[
                              s.accessory,
                              state.accessory === item.id && s.accessoryActive,
                              !unlocked && { opacity: 0.65 },
                            ]}
                          >
                            <CapyAvatar size={72} accessory={item.id} />
                            <Text style={s.accessoryTitle}>{item.title}</Text>
                            <View style={s.accessoryPill}>
                              <Icon
                                name={
                                  !unlocked
                                    ? "lock"
                                    : state.accessory === item.id
                                      ? "check"
                                      : "plus"
                                }
                                size={13}
                              />
                              <Text style={s.link}>
                                {!unlocked
                                  ? `${state.entries.length}/${item.need} 杯`
                                  : state.accessory === item.id
                                    ? "正在穿戴"
                                    : "戴上试试"}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}
              {page === "settings" && (
                <View style={[s.pageStack, { maxWidth: 820 }]}>
                  <View style={s.card}>
                    <SectionTitle title="喝水这件小事" icon="droplet" />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="修改每日饮水目标"
                      onPress={openGoal}
                      style={s.settingsRow}
                    >
                      <View style={s.flex}>
                        <Text style={s.settingTitle}>每日饮水目标</Text>
                      </View>
                      <Text style={s.settingValue}>{state.goal} ml</Text>
                      <Icon name="chevron-right" size={17} color={C.muted} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="修改温柔提醒"
                      onPress={openReminder}
                      style={s.settingsRow}
                    >
                      <View style={s.flex}>
                        <Text style={s.settingTitle}>温柔提醒</Text>
                        {state.reminder.enabled && (
                          <Text style={s.settingDescription}>
                            {`${state.reminder.start}:00–${state.reminder.end}:00，每 ${state.reminder.interval} 分钟`}
                          </Text>
                        )}
                      </View>
                      <Text style={s.settingValue}>
                        {state.reminder.enabled ? "已开启" : "未开启"}
                      </Text>
                      <Icon name="chevron-right" size={17} color={C.muted} />
                    </Pressable>
                  </View>
                  <View style={s.about}>
                    <CapyAvatar size={50} />
                    <Text style={s.aboutTitle}>卡皮补水站</Text>
                  </View>
                </View>
              )}
            </ScrollView>
            {!desktop && navigation(true)}
            {toast && (
              <ToastMessage toast={toast} motion={motion} desktop={desktop} onUndo={undo} onDismiss={dismissToast} />
            )}
          </View>
        </View>
        <Modal
          visible={!!modal}
          transparent
          animationType={motion ? "fade" : "none"}
          onRequestClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={s.modalOverlay}
          >
            <Pressable
              style={s.modalBackdrop}
              accessibilityLabel="关闭弹窗背景"
              onPress={() => {
                if (!busy) setModal(null);
              }}
            />
            <View style={s.modalPanel} accessibilityViewIsModal>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={s.modalTop}>
                  <View style={s.modalIcon}>
                    <Icon
                      name={
                        modal === "reminder"
                          ? "bell"
                          : modal === "goal"
                            ? "flag"
                            : "droplet"
                      }
                      size={24}
                    />
                  </View>
                  <Button
                    label="关闭弹窗"
                    disabled={busy}
                    onPress={() => setModal(null)}
                    quiet
                    style={s.iconButton}
                  >
                    <Icon name="x" size={21} color={C.muted} />
                  </Button>
                </View>
                <Text accessibilityRole="header" style={s.modalTitle}>
                  {modal === "reminder"
                    ? "让提醒温柔一点"
                    : modal === "goal"
                      ? "自己的节奏，自己定"
                      : "记录一杯小小关心"}
                </Text>
                {modal === "water" && (
                  <>
                    <View style={s.amountInputRow}>
                      <TextInput
                        autoFocus
                        accessibilityLabel="自定义饮水量"
                        placeholder="250"
                        placeholderTextColor="#c0c9b5"
                        keyboardType="number-pad"
                        value={customAmount}
                        onChangeText={setCustomAmount}
                        style={s.amountInput}
                        maxLength={4}
                        onSubmitEditing={() => {
                          if (validAmount(Number(customAmount)))
                            addWater(Number(customAmount));
                          else setFormError("请输入 50–1500 ml 之间的整数。");
                        }}
                      />
                      <Text style={s.amountUnit}>ml</Text>
                    </View>
                    <Text style={s.inputHelp}>
                      50–1500 ml
                    </Text>
                    <View style={s.presetRow}>
                      {[150, 250, 350, 500].map((amount) => (
                        <Button
                          key={amount}
                          label={`${amount} ml`}
                          quiet
                          onPress={() => setCustomAmount(String(amount))}
                          style={s.preset}
                        />
                      ))}
                    </View>
                  </>
                )}
                {modal === "goal" && (
                  <GoalSlider value={Number(goalInput)} onChange={setGoalInput} />
                )}
                {modal === "reminder" && (
                  <>
                    <View style={s.reminderToggle}>
                      <View>
                        <Text style={s.settingTitle}>开启温柔提醒</Text>
                        <Text style={s.settingDescription}>
                          {Platform.OS === "web"
                            ? "网页打开时，在页面内提醒"
                            : "通过系统本地通知提醒"}
                        </Text>
                      </View>
                      <Switch
                        accessibilityLabel="开启温柔提醒"
                        value={reminderDraft.enabled}
                        onValueChange={(enabled) =>
                          setReminderDraft((previous) => ({
                            ...previous,
                            enabled,
                          }))
                        }
                        trackColor={{ false: "#dce2d4", true: "#8ba478" }}
                        thumbColor="#fff"
                      />
                    </View>
                    {[
                      {
                        field: "interval",
                        title: "提醒间隔",
                        values: [60, 90, 120],
                        suffix: " 分钟",
                      },
                      {
                        field: "start",
                        title: "从几点开始",
                        values: [7, 8, 9, 10],
                        suffix: ":00",
                      },
                      {
                        field: "end",
                        title: "几点之后不再打扰",
                        values: [20, 21, 22, 23],
                        suffix: ":00",
                      },
                    ].map((group) => (
                      <View key={group.field}>
                        <Text style={s.fieldLabel}>{group.title}</Text>
                        <View style={s.presetRow}>
                          {group.values.map((value) => (
                            <Button
                              key={value}
                              label={`${value}${group.suffix}`}
                              quiet
                              onPress={() =>
                                setReminderDraft((previous) => ({
                                  ...previous,
                                  [group.field]: value,
                                }))
                              }
                              style={[
                                s.preset,
                                reminderDraft[group.field] === value &&
                                  s.presetSelected,
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                    ))}
                    <View style={s.reminderPreview}>
                      <Icon name="moon" size={16} color="#93a180" />
                      <Text
                        style={s.reminderPreviewText}
                      >{`休息时段 ${reminderDraft.end}:00 至次日 ${reminderDraft.start}:00`}</Text>
                    </View>
                  </>
                )}
                {!!formError && (
                  <Text accessibilityRole="alert" style={s.formError}>
                    {formError}
                  </Text>
                )}
                <Button
                  label={
                    busy
                      ? "正在安排…"
                      : modal === "water"
                        ? "记录这杯水"
                        : "保存设置"
                  }
                  disabled={busy || !canSave}
                  onPress={
                    modal === "reminder"
                      ? saveReminder
                      : modal === "goal"
                        ? saveGoal
                        : () => {
                            if (!validAmount(Number(customAmount)))
                              setFormError("请输入 50–1500 ml 之间的整数。");
                            else addWater(Number(customAmount));
                          }
                  }
                  style={{ marginTop: 24 }}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </MotionContext.Provider>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
