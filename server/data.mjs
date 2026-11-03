// src/lib/data.ts
var STORAGE_KEY = "moyu-master-office-v1";
var pad = (value) => String(value).padStart(2, "0");
function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function toMonthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}
function formatChineseDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);
}
function contestId(date, period) {
  return `${date}-${period}`;
}
var periodMeta = {
  morning: { label: "\u4E0A\u5348\u573A", time: "09:00\u201412:00", start: 9 * 60, end: 12 * 60 },
  afternoon: { label: "\u4E0B\u5348\u573A", time: "14:00\u201418:00", start: 14 * 60, end: 18 * 60 }
};
function getContestState(contest, now = /* @__PURE__ */ new Date()) {
  if (contest.winnerId) return "settled";
  const deadline = Date.parse(contest.customDeadline ?? contest.deadlineOverride ?? contest.date + "T" + (contest.period === "morning" ? "12:00" : "18:00") + ":00+08:00");
  if (now.getTime() >= deadline) return "closed";
  const start = Date.parse(contest.date + "T" + (contest.period === "morning" ? "09:00" : "14:00") + ":00+08:00");
  return now.getTime() < start ? "upcoming" : "live";
}
var stateLabels = {
  live: "\u6295\u7968\u8FDB\u884C\u4E2D",
  upcoming: "\u5C1A\u672A\u5F00\u59CB",
  closed: "\u7B49\u5F85\u63ED\u6653",
  settled: "\u5DF2\u63ED\u6653"
};
var sampleProfiles = [
  {
    id: "p1",
    nickname: "\u5317\u51A5\u6709\u9C7C",
    code: "demo2026",
    timeSlots: ["09:30\u201410:00", "15:00\u201415:30"],
    locations: ["\u8336\u6C34\u95F4", "\u5929\u53F0"],
    bestSpot: "\u5929\u53F0\u5165\u53E3\u7B2C\u4E8C\u5F20\u85E4\u6905\uFF0C\u4FE1\u53F7\u597D\u4E14\u89C6\u91CE\u5F00\u9614\u3002",
    avoidanceTip: "\u62B1\u7740\u7B14\u8BB0\u672C\u7535\u8111\u5FEB\u8D70\uFF0C\u4EFB\u4F55\u5730\u65B9\u90FD\u50CF\u4E34\u65F6\u529E\u516C\u70B9\u3002",
    motto: "\u4E0D\u662F\u5728\u5DE5\u4F5C\uFF0C\u5C31\u662F\u5728\u5BFB\u627E\u5DE5\u4F5C\u7684\u8DEF\u4E0A\u3002",
    color: "#aa8576",
    stars: 8,
    starMonth: toMonthKey(/* @__PURE__ */ new Date()),
    wins: 8,
    joinedAt: "2026-09-01"
  },
  {
    id: "p2",
    nickname: "\u5DE5\u4F4D\u5FCD\u8005",
    code: "local-only",
    timeSlots: ["10:30\u201411:00", "16:00\u201416:30"],
    locations: ["\u6D88\u9632\u901A\u9053", "\u6253\u5370\u533A"],
    bestSpot: "\u4E09\u697C\u6253\u5370\u533A\u6700\u91CC\u9762\uFF0C\u7EB8\u58F0\u80FD\u63A9\u76D6\u4E00\u5207\u3002",
    avoidanceTip: "\u5C4F\u5E55\u6C38\u8FDC\u505C\u7559\u5728\u8868\u683C\uFF0CAlt + Tab \u6BD4\u5FC3\u8DF3\u8FD8\u719F\u3002",
    motto: "\u771F\u6B63\u7684\u9AD8\u624B\uFF0C\u8FDE\u6905\u5B50\u90FD\u4E0D\u4F1A\u54CD\u3002",
    color: "#8799a5",
    stars: 6,
    starMonth: toMonthKey(/* @__PURE__ */ new Date()),
    wins: 6,
    joinedAt: "2026-09-02"
  },
  {
    id: "p3",
    nickname: "\u5496\u5561\u7EED\u547D\u4FA0",
    code: "local-only",
    timeSlots: ["09:00\u201409:30", "14:30\u201415:00"],
    locations: ["\u5496\u5561\u673A\u65C1", "\u4FBF\u5229\u5E97"],
    bestSpot: "\u697C\u4E0B\u4FBF\u5229\u5E97\u9760\u7A97\u4F4D\uFF0C\u4E70\u676F\u5496\u5561\u5C31\u80FD\u83B7\u5F97\u534A\u5C0F\u65F6\u81EA\u7531\u3002",
    avoidanceTip: "\u624B\u62FF\u7A7A\u676F\uFF0C\u9047\u89C1\u9886\u5BFC\u5C31\u81EA\u7136\u5730\u8BF4\u201C\u521A\u5F00\u5B8C\u4F1A\uFF0C\u7EED\u676F\u201D\u3002",
    motto: "\u5496\u5561\u4F1A\u559D\u5B8C\uFF0C\u81EA\u7531\u4E0D\u4F1A\u3002",
    color: "#b6a17b",
    stars: 7,
    starMonth: toMonthKey(/* @__PURE__ */ new Date()),
    wins: 7,
    joinedAt: "2026-09-03"
  },
  {
    id: "p4",
    nickname: "\u76C6\u683D\u89C2\u5BDF\u5458",
    code: "local-only",
    timeSlots: ["11:00\u201411:30", "16:30\u201417:00"],
    locations: ["\u7EFF\u690D\u89D2", "\u4F11\u606F\u533A"],
    bestSpot: "\u4F11\u606F\u533A\u9F9F\u80CC\u7AF9\u540E\u9762\uFF0C\u53F6\u7247\u662F\u6700\u5929\u7136\u7684\u5C4F\u98CE\u3002",
    avoidanceTip: "\u62FF\u624B\u673A\u62CD\u53F6\u5B50\uFF0C\u522B\u4EBA\u53EA\u4F1A\u4EE5\u4E3A\u4F60\u5728\u8BB0\u5F55\u516C\u53F8\u7EFF\u5316\u3002",
    motto: "\u6BCF\u4E00\u7247\u65B0\u53F6\uFF0C\u90FD\u503C\u5F97\u8BA4\u771F\u6B23\u8D4F\u3002",
    color: "#84988a",
    stars: 4,
    starMonth: toMonthKey(/* @__PURE__ */ new Date()),
    wins: 4,
    joinedAt: "2026-09-04"
  },
  {
    id: "p5",
    nickname: "\u4F1A\u8BAE\u5BA4\u5E7D\u7075",
    code: "local-only",
    timeSlots: ["10:00\u201410:30", "15:30\u201416:00"],
    locations: ["\u7A7A\u4F1A\u8BAE\u5BA4", "\u697C\u68AF\u8F6C\u89D2"],
    bestSpot: "\u6CA1\u6709\u7A97\u6237\u7684\u5C0F\u4F1A\u8BAE\u5BA4\uFF0C\u8BB0\u5F97\u5148\u786E\u8BA4\u5F53\u5929\u6CA1\u6709\u9884\u8BA2\u3002",
    avoidanceTip: "\u63D0\u524D\u5728\u65E5\u5386\u5EFA\u4E00\u4E2A\u201C\u4E2A\u4EBA\u4E13\u6CE8\u65F6\u95F4\u201D\uFF0C\u8BA9\u5FD9\u788C\u6709\u636E\u53EF\u67E5\u3002",
    motto: "\u795E\u51FA\u9B3C\u6CA1\uFF0C\u4F46\u65E5\u62A5\u4ECE\u4E0D\u8FDF\u5230\u3002",
    color: "#a094a8",
    stars: 5,
    starMonth: toMonthKey(/* @__PURE__ */ new Date()),
    wins: 5,
    joinedAt: "2026-09-05"
  }
];
function makeSeedContests(now) {
  const today = toDateKey(now);
  const morning = {
    id: contestId(today, "morning"),
    date: today,
    period: "morning",
    title: "\u65E9\u95F4\u9690\u8EAB\u672F\u5927\u8D4F",
    votes: { p2: "p1", p3: "p1", p4: "p2", p5: "p1" },
    winnerId: "p1",
    createdBy: "p3"
  };
  const afternoon = {
    id: contestId(today, "afternoon"),
    date: today,
    period: "afternoon",
    title: "\u5348\u540E\u5931\u8E2A\u4EBA\u53E3\u666E\u67E5",
    votes: { p2: "p3", p4: "p3", p5: "p2" },
    createdBy: "p1"
  };
  const historyWinners = ["p3", "p2", "p1", "p4", "p5", "p3", "p1", "p2", "p3", "p5", "p1", "p4"];
  const history = historyWinners.map((winnerId, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - Math.floor(index / 2) - 1);
    const key = toDateKey(date);
    const period = index % 2 === 0 ? "afternoon" : "morning";
    const voter = sampleProfiles.find((profile) => profile.id !== winnerId)?.id ?? "p1";
    return {
      id: contestId(key, period),
      date: key,
      period,
      title: period === "morning" ? "\u65E9\u95F4\u9690\u8EAB\u672F\u5927\u8D4F" : "\u5348\u540E\u5931\u8E2A\u4EBA\u53E3\u666E\u67E5",
      votes: { [voter]: winnerId },
      winnerId,
      createdBy: "p1"
    };
  });
  return [morning, afternoon, ...history];
}
function createDefaultBuilding() {
  return {
    name: "\u4E91\u6816\u4E2D\u5FC3 A \u5EA7",
    floors: 12,
    companyFloor: 6,
    spots: [
      { id: "pantry", name: "\u8336\u6C34\u95F4", floor: 3, zone: "\u4E1C\u4FA7\u8336\u6C34\u533A", description: "\u5496\u5561\u673A\u4E0E\u996E\u6C34\u673A\u4E4B\u95F4\uFF0C\u52A8\u7EBF\u81EA\u7136\uFF0C\u9002\u5408\u77ED\u6682\u6362\u6362\u8111\u5B50\u3002", tip: "\u624B\u91CC\u62FF\u7740\u676F\u5B50\uFF0C\u6765\u56DE\u90FD\u50CF\u4E00\u6B21\u6B63\u5E38\u8865\u7ED9\u3002", status: "quiet", x: 1.8, z: -0.7 },
      { id: "rooftop", name: "\u5929\u53F0\u85E4\u6905", floor: 12, zone: "\u5929\u53F0\u897F\u4FA7", description: "\u89C6\u91CE\u5F00\u9614\u3001\u98CE\u58F0\u81EA\u7531\uFF0C\u662F\u5317\u51A5\u6709\u9C7C\u516C\u5F00\u7684\u5FC3\u5934\u597D\u3002", tip: "\u6CE8\u610F\u5929\u6C14\u548C\u5929\u53F0\u5F00\u653E\u65F6\u95F4\uFF0C\u4E0D\u8981\u4E45\u5230\u88AB\u60E6\u8BB0\u3002", status: "quiet", x: -1.6, z: -0.6 },
      { id: "stairs", name: "\u6D88\u9632\u901A\u9053", floor: 6, zone: "\u897F\u5317\u89D2", description: "\u4EBA\u5C11\u5B89\u9759\uFF0C\u9002\u5408\u77ED\u6682\u900F\u6C14\uFF0C\u4F46\u5FC5\u987B\u4FDD\u6301\u901A\u9053\u7545\u901A\u3002", tip: "\u4E0D\u5806\u653E\u7269\u54C1\uFF0C\u4E5F\u4E0D\u963B\u6321\u6D88\u9632\u8BBE\u65BD\u3002", status: "risk", x: -2.1, z: 0.8 },
      { id: "print", name: "\u6253\u5370\u533A", floor: 6, zone: "\u516C\u53F8\u524D\u5385\u540E\u65B9", description: "\u6253\u5370\u673A\u58F0\u97F3\u5929\u7136\u63A9\u76D6\u811A\u6B65\uFF0C\u53D6\u6587\u4EF6\u65F6\u987A\u4FBF\u653E\u677E\u4E24\u5206\u949F\u3002", tip: "\u522B\u771F\u7684\u6253\u5370\u7A7A\u767D\u7EB8\uFF0C\u73AF\u4FDD\u4E5F\u662F\u5927\u5E08\u4FEE\u517B\u3002", status: "busy", x: 1.2, z: 0.9 },
      { id: "coffee", name: "\u5496\u5561\u673A\u65C1", floor: 3, zone: "\u4E1C\u4FA7\u8336\u6C34\u533A", description: "\u5496\u5561\u9999\u8986\u76D6\u4E00\u5207\u75B2\u60EB\uFF0C\u6392\u961F\u4E5F\u80FD\u6210\u4E3A\u5408\u7406\u7684\u505C\u7559\u7406\u7531\u3002", tip: "\u8BB0\u5F97\u63A7\u5236\u5496\u5561\u56E0\uFF0C\u4E0B\u5348\u592A\u665A\u5C31\u6362\u6E29\u6C34\u3002", status: "busy", x: 2.1, z: 0.6 },
      { id: "store", name: "\u697C\u4E0B\u4FBF\u5229\u5E97", floor: 1, zone: "\u4E00\u5C42\u5546\u4E1A\u914D\u5957", description: "\u9760\u7A97\u4F4D\u7F6E\u53EF\u4EE5\u89C2\u5BDF\u4EBA\u6D41\uFF0C\u4E70\u676F\u996E\u6599\u5C31\u80FD\u83B7\u5F97\u77ED\u6682\u81EA\u7531\u3002", tip: "\u5916\u52E4\u7406\u7531\u8981\u771F\u5B9E\uFF0C\u522B\u628A\u5341\u5206\u949F\u53D8\u6210\u4E00\u4E0B\u5348\u3002", status: "quiet", x: 0.4, z: -0.8 },
      { id: "plants", name: "\u7EFF\u690D\u89D2", floor: 6, zone: "\u516C\u53F8\u5357\u4FA7\u7A97\u8FB9", description: "\u9F9F\u80CC\u7AF9\u5F62\u6210\u5929\u7136\u5C4F\u98CE\uFF0C\u9633\u5149\u548C\u53F6\u7247\u8D1F\u8D23\u6539\u5584\u5FC3\u60C5\u3002", tip: "\u89C2\u5BDF\u65B0\u53F6\u53EF\u4EE5\uFF0C\u522B\u628A\u516C\u53F8\u7684\u690D\u7269\u8585\u79C3\u3002", status: "quiet", x: -0.7, z: 1.1 },
      { id: "lounge", name: "\u4F11\u606F\u533A", floor: 5, zone: "\u5171\u4EAB\u697C\u5C42\u5357\u4FA7", description: "\u6C99\u53D1\u8212\u9002\u3001\u4EBA\u6765\u4EBA\u5F80\uFF0C\u9002\u5408\u6062\u590D\u7CBE\u529B\u540E\u7EE7\u7EED\u5DE5\u4F5C\u3002", tip: "\u516C\u5171\u4F11\u606F\u533A\u5148\u5230\u5148\u5F97\uFF0C\u4E0D\u8981\u957F\u671F\u5360\u4F4D\u3002", status: "busy", x: 1.6, z: 0.7 },
      { id: "meeting", name: "\u7A7A\u4F1A\u8BAE\u5BA4", floor: 8, zone: "\u4E2D\u90E8\u4F1A\u8BAE\u533A", description: "\u77ED\u6682\u72EC\u5904\u7684\u70ED\u95E8\u9009\u62E9\uFF0C\u5173\u95E8\u4E4B\u524D\u52A1\u5FC5\u786E\u8BA4\u5F53\u5929\u9884\u8BA2\u3002", tip: "\u4F18\u5148\u4F7F\u7528\u771F\u6B63\u7A7A\u95F2\u7684\u4F1A\u8BAE\u5BA4\uFF0C\u968F\u65F6\u8BA9\u7ED9\u6709\u4F1A\u7684\u540C\u4E8B\u3002", status: "risk", x: -1.4, z: -0.5 },
      { id: "corner", name: "\u697C\u68AF\u8F6C\u89D2", floor: 7, zone: "\u4E1C\u4FA7\u6B65\u884C\u697C\u68AF", description: "\u4E0A\u4E0B\u697C\u4E4B\u95F4\u7684\u77ED\u6682\u505C\u9760\u70B9\uFF0C\u9002\u5408\u4F38\u5C55\u548C\u770B\u770B\u8FDC\u5904\u3002", tip: "\u9760\u4FA7\u7AD9\u7ACB\uFF0C\u4E0D\u5F71\u54CD\u6B63\u5E38\u901A\u884C\u3002", status: "quiet", x: 2, z: -0.5 }
    ]
  };
}
function createSeedData() {
  const now = /* @__PURE__ */ new Date();
  return {
    profiles: sampleProfiles.map((profile) => ({ ...profile, starMonth: toMonthKey(now) })),
    contests: makeSeedContests(now),
    currentUserId: null,
    building: createDefaultBuilding()
  };
}
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedData();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.profiles) || !Array.isArray(parsed.contests)) return createSeedData();
    const fallback = createDefaultBuilding();
    const building = parsed.building?.spots?.length ? parsed.building : fallback;
    return { ...parsed, building };
  } catch {
    return createSeedData();
  }
}
function ensureTodayContests(data, now = /* @__PURE__ */ new Date()) {
  const today = toDateKey(now);
  const month = toMonthKey(now);
  let changed = false;
  const profiles = data.profiles.map((profile) => {
    if (profile.starMonth === month) return profile;
    changed = true;
    return { ...profile, stars: 0, starMonth: month };
  });
  const contests = [...data.contests];
  ["morning", "afternoon"].forEach((period) => {
    if (!contests.some((contest) => contest.id === contestId(today, period))) {
      changed = true;
      contests.unshift({
        id: contestId(today, period),
        date: today,
        period,
        title: period === "morning" ? "\u65E9\u95F4\u9690\u8EAB\u672F\u5927\u8D4F" : "\u5348\u540E\u5931\u8E2A\u4EBA\u53E3\u666E\u67E5",
        votes: {},
        createdBy: data.currentUserId ?? "p1"
      });
    }
  });
  return changed ? { ...data, profiles, contests } : data;
}
function voteCount(contest, profileId) {
  return Object.values(contest.votes).filter((id) => id === profileId).length;
}
function leaderFor(contest) {
  const counts = /* @__PURE__ */ new Map();
  Object.values(contest.votes).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}
function contestDeadline(contest) {
  if (contest.customDeadline || contest.deadlineOverride) return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(contest.customDeadline ?? contest.deadlineOverride)) + (contest.customDeadline ? " \u622A\u6B62" : " \u622A\u6B62\uFF08\u4E34\u65F6\u6D4B\u8BD5\uFF09");
  return (contest.period === "morning" ? "12:00" : "18:00") + " \u622A\u6B62";
}
function totalReceivedVotes(contests, userId) {
  return contests.reduce((total, contest) => total + Object.values(contest.votes).filter((id) => id === userId).length, 0);
}
export {
  STORAGE_KEY,
  contestDeadline,
  contestId,
  createDefaultBuilding,
  createSeedData,
  ensureTodayContests,
  formatChineseDate,
  getContestState,
  leaderFor,
  loadData,
  pad,
  periodMeta,
  stateLabels,
  toDateKey,
  toMonthKey,
  totalReceivedVotes,
  voteCount
};
