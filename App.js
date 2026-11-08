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
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Feather from "@expo/vector-icons/Feather";
import Svg, { Circle, Path } from "react-native-svg";
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
  dayKey,
} from "./src/hydration";
import { useHydration } from "./src/useHydration";
import { createGardenDemo } from "./src/gardenDemo";
import { applyReminders, reminderPermission } from "./src/reminders";
import { C, s } from "./src/styles";

const MotionContext = React.createContext(true);
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

function WaterGarden({ entries, now }) {
  const [range, setRange] = useState(7);
  const [selectedKey, setSelectedKey] = useState(null);
  const [demo, setDemo] = useState(() => __DEV__ && Platform.OS === "web" && new URLSearchParams(window.location.search).get("gardenDemo") === "1");
  const demoEntries = React.useMemo(() => __DEV__ ? createGardenDemo(now) : [], [dayKey(now)]);
  const data = waterGardenData(demo ? demoEntries : entries, range, now);
  const selected = data.days.find((day) => day.key === selectedKey) || data.days.at(-1);
  const todayKey = dayKey(now);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const cells = [ ...Array(data.days[0].date.getDay()).fill(null), ...data.days ];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  const renderDay = (day, compact = false, index = 0) => day ? (
    <Pressable
      key={day.key}
      accessibilityRole="button"
      accessibilityLabel={`${day.key}，${day.cups ? `${day.amount}毫升，${day.cups}杯` : "未记录"}${day.key === todayKey ? "，今天" : ""}`}
      accessibilityState={{ selected: day.key === selected.key }}
      aria-pressed={day.key === selected.key}
      onPress={() => setSelectedKey(day.key)}
      style={[s.gardenDay, compact && s.gardenDayCompact, day.cups > 0 && s.gardenDayRecorded, day.key === selected.key && s.gardenDaySelected]}
    >
      {day.key === todayKey ? <Icon name="sun" size={compact ? 12 : 18} color="#eea342" />
        : day.cups > 0 ? <Icon name="feather" size={compact ? 11 : 17} color={C.green} />
        : <View style={s.gardenSoil} />}
      {!compact && <Text style={s.gardenDate}>{day.date.getDate()}</Text>}
    </Pressable>
  ) : <View key={`blank-${index}`} style={[s.gardenDay, compact && s.gardenDayCompact, { backgroundColor: "transparent" }]} />;
  return (
    <View style={s.card}>
      <SectionTitle title="卡皮的水分花园" icon="feather" />
      <Text style={s.beverageHint}>每一口水，都在这里留下小小的绿意。</Text>
      {__DEV__ && (
        <View style={s.gardenDemoBanner}>
          <Text style={s.gardenDemoText}>{demo ? "正在预览 90 天演示数据，仅用于这块花园，不计入真实记录。" : "想看看花园长满后的样子？"}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setDemo((value) => !value); setSelectedKey(null); }} style={s.gardenDemoButton}>
            <Text style={s.gardenDemoButtonText}>{demo ? "查看真实数据" : "预览演示数据"}</Text>
          </Pressable>
        </View>
      )}
      <View style={s.gardenRanges} accessibilityRole="radiogroup" accessibilityLabel="统计时间范围">
        {[7, 30, 90].map((value) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`近${value}天`} accessibilityState={{ checked: range === value }} aria-checked={range === value}
            onPress={() => { setRange(value); setSelectedKey(null); }} style={[s.gardenRange, range === value && s.gardenRangeActive]}>
            <Text style={[s.gardenRangeText, range === value && { color: C.green, fontWeight: "700" }]}>近 {value} 天</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.gardenPeriod}>{data.days[0].key.replaceAll("-", ".")} — {data.days.at(-1).key.replaceAll("-", ".")}</Text>
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
      ) : range === 30 ? (
        <View style={{ gap: 5 }}>
          <View style={s.gardenCalendarRow}>{weekdays.map((label) => <Text key={label} style={s.gardenWeekday}>{label}</Text>)}</View>
          {weeks.map((week, index) => <View key={index} style={s.gardenCalendarRow}>{week.map((day, dayIndex) => renderDay(day, false, dayIndex))}</View>)}
        </View>
      ) : (
        <View style={s.gardenQuarter}>
          <View style={s.gardenWeekAxis}>{weekdays.map((label) => <Text key={label} style={s.gardenAxisLabel}>{label}</Text>)}</View>
          {weeks.map((week, index) => <View key={index} style={s.gardenWeekColumn}>{week.map((day, dayIndex) => renderDay(day, true, dayIndex))}</View>)}
        </View>
      )}
      <View style={s.gardenLegend}>
        <Icon name="feather" size={12} /><Text style={s.tiny}>有记录</Text>
        <View style={s.gardenSoil} /><Text style={s.tiny}>未记录</Text>
        <Icon name="sun" size={12} color="#eea342" /><Text style={s.tiny}>今天</Text>
      </View>
      {range === 90 && <Text style={s.gardenFootnote}>每列是一周，从左往右读。点一点，看看那一天。</Text>}
      <View style={s.gardenDetail} accessibilityLiveRegion="polite">
        <Text style={s.gardenDetailDate}>{selected.key}</Text>
        <Text style={s.gardenDetailText}>{selected.cups ? `${selected.amount.toLocaleString()} ml · ${selected.cups} 杯` : "这一天还没有记录"}</Text>
      </View>
      <View style={s.gardenSummary}>
        {[[`${data.total.toLocaleString()} ml`, "累计记录水量"], [`${data.recordedDays} 天`, "有记录的日子"], [`${data.average.toLocaleString()} ml`, "记录日平均"]].map(([value, label]) => (
          <View key={label} style={s.gardenSummaryItem}>
            <Text style={s.gardenSummaryValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
            <Text style={s.gardenSummaryLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={s.gardenFootnote}>未记录不代表没有喝水。慢慢来，随时都能继续。</Text>
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

function StartupScreen() {
  return (
    <SafeAreaView style={s.loading}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.startupContent}>
        <View style={s.startupMain}>
          <Text style={s.startupTitle} accessibilityRole="header">卡皮补水站</Text>
          <Text style={s.startupTagline}>喝一口水，歇一小会儿</Text>
          <View style={s.startupArt} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <CapyStartupIllustration />
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel="正在读取饮水记录" accessibilityState={{ busy: true }} style={s.startupStatus}>
            <View style={s.startupDrop} />
            <Text style={s.startupStatusText}>正在翻开你的饮水手记…</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  const windowSize = useWindowDimensions();
  const mobilePreview = __DEV__ && Platform.OS === "web";
  const width = mobilePreview ? Math.min(windowSize.width, 390) : windowSize.width;
  const desktop = width >= 1040,
    columns = width >= 760;
  const [page, setPage] = useState("home"),
    [selected, setSelected] = useState(250),
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
    motion = state.motion && (previewMotion || !reduceMotion);
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
  if (!ready || previewStartup) return <StartupScreen />;
  return (
    <MotionContext.Provider value={motion}>
      <SafeAreaView
        style={[
          s.safe,
          mobilePreview && {
            width: "100%",
            maxWidth: 390,
            maxHeight: 844,
            alignSelf: "center",
          },
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
                  <View style={s.row}>
                    <Text style={s.dateLabel}>
                      {now.getMonth() + 1} 月 {now.getDate()} 日，星期
                      {["日", "一", "二", "三", "四", "五", "六"][now.getDay()]}
                    </Text>
                  </View>
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
                    <View style={s.speech}>
                      <View style={s.speechTriangle} />
                      <Icon name="message-circle" size={18} color="#93a27e" />
                      <Text
                        accessibilityLiveRegion="polite"
                        style={s.speechText}
                      >
                        {speech}
                      </Text>
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
                          <Pressable
                            accessibilityRole="button"
                            onPress={openGoal}
                          >
                            <Text style={s.link}>调整目标</Text>
                          </Pressable>
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
                        {total >= state.goal && (
                          <Text style={s.tiny}>已达标，按口渴感喝水就好。</Text>
                        )}
                      </View>
                    )}
                    <View style={s.drinkCard}>
                      <SectionTitle
                        title="来，喝一杯吧"
                        action="自定义水量"
                        onAction={openCustom}
                      />
                      <View style={s.cupOptions}>
                        {[150, 250, 350, 500].map((amount, i) => (
                          <Pressable
                            key={amount}
                            accessibilityRole="radio"
                            accessibilityLabel={`${amount} 毫升`}
                            accessibilityState={{
                              checked: selected === amount,
                            }}
                            aria-checked={selected === amount}
                            onPress={() => setSelected(amount)}
                            style={[
                              s.cupOption,
                              selected === amount && s.cupSelected,
                            ]}
                          >
                            <Cup
                              size={28 + i * 2}
                              level={0.35 + i * 0.18}
                              fill={selected === amount ? "#a9c28d" : "#d8e2cc"}
                            />
                            <Text
                              style={[
                                s.cupAmount,
                                selected === amount && { color: C.green },
                              ]}
                            >
                              {amount}
                              <Text style={s.cupUnit}> ml</Text>
                            </Text>
                            {selected === amount && (
                              <View style={s.cupCheck}>
                                <Icon name="check" size={9} color="#fff" />
                              </View>
                            )}
                          </Pressable>
                        ))}
                      </View>
                      <Button
                        label={`喝好了，记录 ${selected} ml`}
                        onPress={() => addWater(selected)}
                        disabled={!canSave}
                        testID="add-water"
                        style={s.drinkButton}
                      >
                        <View style={s.row}>
                          <Icon name="plus" size={20} color="#fff" />
                          <Text style={s.buttonText}>
                            喝好了，记录 {selected} ml
                          </Text>
                        </View>
                        <Icon name="droplet" size={18} color="#cfddbd" />
                      </Button>
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
                          action="调整目标"
                          onAction={openGoal}
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
                    <View style={s.rowBetween}>
                      <View style={s.flex}>
                        <Text style={s.gardenHeading}>卡皮的温泉小院</Text>
                      </View>
                      <View style={s.gardenBadge}>
                        <Icon name="feather" size={16} />
                        <Text style={s.link}>
                          {state.entries.length} 份关心
                        </Text>
                      </View>
                    </View>
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
                    <View style={s.gardenSpeech}>
                      <Text
                        accessibilityLiveRegion="polite"
                        style={s.speechText}
                      >
                        {speech}
                      </Text>
                    </View>
                  </View>
                  <View style={s.card}>
                    <SectionTitle title="陪卡皮喝点什么" icon="coffee" />
                    <Text style={s.beverageHint}>挑一杯喜欢的，陪卡皮坐一会儿。</Text>
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
                          <Text style={s.beverageCaption}>{cup}</Text>
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
                    <View
                      style={[
                        s.accessories,
                        width < 480 && { flexDirection: "column" },
                      ]}
                    >
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
                            <CapyAvatar size={85} accessory={item.id} />
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
                  <View style={s.card}>
                    <SectionTitle title="让陪伴更舒服" icon="heart" />
                    <View style={s.settingsRow}>
                      <View style={s.flex}>
                        <Text style={s.settingTitle}>小院动画</Text>
                      </View>
                      <Switch
                        accessibilityLabel="小院动画"
                        value={state.motion}
                        onValueChange={(value) =>
                          setState((previous) => ({
                            ...previous,
                            motion: value,
                          }))
                        }
                        trackColor={{ false: "#dce2d4", true: "#8ba478" }}
                        thumbColor="#ffffff"
                      />
                    </View>
                    {state.motion && (previewMotion || reduceMotion) && (
                      <Text style={s.settingFootnote}>
                        {previewMotion ? "正在预览动画" : "系统已开启减少动态效果"}
                      </Text>
                    )}
                  </View>
                  <View style={s.privacyCard}>
                    <View style={s.row}>
                      <Icon name="lock" size={20} />
                      <Text style={s.cardTitle}>你的日常，只留在这里</Text>
                    </View>
                    <Text style={s.privacyText}>
                      记录和偏好仅保存在当前设备。卸载 App 或清除浏览器数据会移除记录。
                    </Text>
                  </View>
                  <View style={s.about}>
                    <CapyAvatar size={50} />
                    <Text style={s.aboutTitle}>卡皮补水站</Text>
                    <Text style={s.tiny}>v1.0</Text>
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
                  <>
                    <View style={s.amountInputRow}>
                      <TextInput
                        autoFocus
                        accessibilityLabel="每日饮水目标"
                        keyboardType="number-pad"
                        value={goalInput}
                        onChangeText={setGoalInput}
                        style={s.amountInput}
                        maxLength={4}
                        onSubmitEditing={saveGoal}
                      />
                      <Text style={s.amountUnit}>ml / 天</Text>
                    </View>
                    <View style={s.presetRow}>
                      {[1500, 2000, 2500].map((value) => (
                        <Button
                          key={value}
                          label={`${value} ml`}
                          quiet
                          onPress={() => setGoalInput(String(value))}
                          style={s.preset}
                        />
                      ))}
                    </View>
                    <Text style={s.inputHelp}>
                      可设置 500–5000
                      ml。按个人需要调整；如有医生给定的饮水量，请以其建议为准。
                    </Text>
                  </>
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
