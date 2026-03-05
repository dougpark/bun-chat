// src/client/modules/icons.js
var ICONS = {
  sun: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  cloudrain: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-rain-icon lucide-cloud-rain"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`,
  cloudlightning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-lightning-icon lucide-cloud-lightning"><path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/></svg>`,
  wind: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tornado-icon lucide-tornado"><path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/><path d="M16 16h-6"/><path d="M11 20H9"/></svg>`,
  home: `<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>`,
  back: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>`,
  send: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>`,
  users: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`,
  zones: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>`,
  admin: `<svg class= "h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" > <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> `,
  thumbsup: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-up-icon lucide-thumbs-up"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/></svg>`,
  thumbsdown: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-down-icon lucide-thumbs-down"><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/><path d="M17 14V2"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`,
  grab: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand-grab-icon lucide-hand-grab"><path d="M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4"/><path d="M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5"/><path d="M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert-icon lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
  bell: `<svg class="h-6 w-6" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24" > <path stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg > `
};

// src/client/modules/constants.js
var ZONE_LEVELS = {
  1: {
    label: "Clear",
    color: "emerald",
    hex: "#10b981",
    description: "Conditions are normal"
  },
  2: {
    label: "Caution",
    color: "amber",
    hex: "#f59e0b",
    description: "Minor issues, proceed with care"
  },
  3: {
    label: "Warning",
    color: "orange",
    hex: "#f97316",
    description: "Significant disruption"
  },
  4: {
    label: "Danger",
    color: "red",
    hex: "#ef4444",
    description: "Life safety threat"
  }
};
var WEATHER_LEVELS = {
  1: {
    name: "Fair",
    description: "No action needed.",
    severity: 1,
    icon: "sun"
  },
  2: {
    name: "Inclement",
    description: "Rain, light snow, or wind; requires caution.",
    severity: 2,
    icon: "cloud-rain"
  },
  3: {
    name: "Severe",
    description: "Thunderstorms, heavy snow, or high winds.",
    severity: 3,
    icon: "cloud-lightning"
  },
  4: {
    name: "Extreme",
    description: "Tornado, Flash Flood, or Life-Threatening.",
    severity: 4,
    icon: "wind"
  }
};
var USER_LEVELS = {
  0: {
    label: "Unverified",
    description: "New account, restricted access.",
    power: 0,
    badge: "bg-slate-100 text-slate-500"
  },
  1: {
    label: "Verified",
    description: "Confirmed neighbor; can check-in and chat.",
    power: 1,
    badge: "bg-emerald-100 text-emerald-700"
  },
  2: {
    label: "Zone Admin",
    description: "Can manage status and alerts for zones.",
    power: 2,
    badge: "bg-blue-100 text-blue-700"
  },
  3: {
    label: "System Admin",
    description: "Full system control and user management.",
    power: 3,
    badge: "bg-purple-100 text-purple-700"
  }
};

// src/client/script.ts
document.addEventListener("DOMContentLoaded", () => {
  const messageContainer = document.getElementById("message-container");
  const postForm = document.getElementById("post-form");
  const postContent = document.getElementById("post-content");
  const activeTagName = document.getElementById("active-tag-name");
  const connectionStatus = document.getElementById("connection-status");
  const zoneList = document.getElementById("zone-list");
  const viewHome = document.getElementById("view-home");
  const viewChat = document.getElementById("view-chat");
  const viewSettings = document.getElementById("view-settings");
  const viewProfile = document.getElementById("view-profile");
  const viewAdmin = document.getElementById("view-admin");
  const viewAdminNav = document.getElementById("view-admin-nav");
  const viewAdminZones = document.getElementById("view-admin-zones");
  const viewZoneEdit = document.getElementById("view-zone-edit");
  const viewUserEdit = document.getElementById("view-user-edit");
  const viewAnnouncements = document.getElementById("view-announcements");
  const viewMembers = document.getElementById("view-members");
  const viewCheckIn = document.getElementById("view-checkin");
  const viewCheckInHistory = document.getElementById("view-checkin-history");
  const viewAuth = document.getElementById("view-auth");
  const chatHeader = document.getElementById("chat-header");
  const hazardBar = document.getElementById("hazard-bar");
  const navAdmin = document.getElementById("nav-admin");
  const adminUserList = document.getElementById("admin-user-list");
  const adminUserFilter = document.getElementById("admin-user-filter");
  const adminZoneList = document.getElementById("admin-zone-list");
  const adminZoneFilter = document.getElementById("admin-zone-filter");
  const membersList = document.getElementById("members-list");
  const membersFilter = document.getElementById("members-filter");
  const membersFilterHelpBtn = document.getElementById("members-filter-help");
  let showOnlyHelpNeeded = false;
  const zoneEditForm = document.getElementById("zone-edit-form");
  const userEditForm = document.getElementById("user-edit-form");
  const checkinForm = document.getElementById("checkin-form");
  const checkinStatus = document.getElementById("checkin-status");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const authError = document.getElementById("auth-error");
  const profileForm = document.getElementById("profile-form");
  const profileMessage = document.getElementById("profile-message");
  const initIcons = () => {
    const inject = (selector, iconHtml) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.innerHTML = iconHtml;
      });
    };
    inject(".icon-shield", ICONS.shield);
    inject(".icon-back", ICONS.back);
    inject(".icon-send", ICONS.send);
    inject(".icon-home", ICONS.home);
    inject(".icon-bell", ICONS.bell);
    inject(".icon-users", ICONS.users);
    inject(".icon-settings", ICONS.settings);
    inject(".icon-admin", ICONS.admin);
    inject(".icon-zones", ICONS.zones);
  };
  initIcons();
  const initLevelDropdowns = () => {
    const zoneLevelSelect = document.getElementById("zone-level-input");
    const userLevelSelect = document.getElementById("user-level-input");
    [zoneLevelSelect, userLevelSelect].forEach((select) => {
      if (select) {
        select.innerHTML = "";
        Object.keys(USER_LEVELS).forEach((level) => {
          const option = document.createElement("option");
          option.value = level;
          option.textContent = `${level} ${USER_LEVELS[parseInt(level)].label}`;
          select.appendChild(option);
        });
      }
    });
  };
  const initHazardDropdown = () => {
    const hazardSelect = document.getElementById("zone-hazard-level-id-input");
    if (!hazardSelect)
      return;
    hazardSelect.innerHTML = "";
    Object.keys(ZONE_LEVELS).forEach((levelId) => {
      const option = document.createElement("option");
      option.value = levelId;
      option.textContent = `${levelId} ${ZONE_LEVELS[parseInt(levelId)].label}`;
      hazardSelect.appendChild(option);
    });
  };
  const initWeatherDropdown = () => {
    const weatherSelect = document.getElementById("zone-weather-id-input");
    if (!weatherSelect)
      return;
    weatherSelect.innerHTML = "";
    Object.keys(WEATHER_LEVELS).forEach((weatherId) => {
      const option = document.createElement("option");
      option.value = weatherId;
      option.textContent = `${weatherId} ${WEATHER_LEVELS[parseInt(weatherId)].name}`;
      weatherSelect.appendChild(option);
    });
  };
  const initAnnouncementHazardDropdown = () => {
    const hazardSelect = document.getElementById("announcement-hazard-level-input");
    if (!hazardSelect)
      return;
    hazardSelect.innerHTML = "";
    Object.keys(ZONE_LEVELS).forEach((levelId) => {
      const option = document.createElement("option");
      option.value = levelId;
      option.textContent = `${ZONE_LEVELS[parseInt(levelId)].label}`;
      hazardSelect.appendChild(option);
    });
  };
  initLevelDropdowns();
  initHazardDropdown();
  initWeatherDropdown();
  initAnnouncementHazardDropdown();
  function updateDashboard(data) {
    const dash = document.getElementById("dashboard");
    if (!dash)
      return;
    const totalOnline = Number(data.total_online ?? data.members_count ?? 0);
    const recentlyOk = Number(data.recently_ok ?? 0);
    const helpAlerts = Number(data.help_alerts ?? data.help_count ?? 0);
    const zoneAlerts = Number(data.zone_alerts ?? data.non_green_count ?? 0);
    const statOkEl = document.getElementById("stat-ok");
    const membersEl = document.getElementById("stat-members");
    const helpEl = document.getElementById("stat-help");
    const alertsEl = document.getElementById("stat-alerts");
    if (statOkEl) {
      statOkEl.textContent = String(recentlyOk);
      if (totalOnline > 0 && recentlyOk < totalOnline * 0.2) {
        statOkEl.className = "text-lg font-black text-vsdark-active5 dark:vsdark-active5";
      } else {
        statOkEl.className = "text-lg font-black text-green-600 dark:text-green-400";
      }
    }
    statOkEl.className = "text-lg font-black text-slate-100 dark:text-vsdark-text";
    if (membersEl)
      membersEl.textContent = String(totalOnline);
    if (helpEl)
      helpEl.textContent = String(helpAlerts);
    if (alertsEl)
      alertsEl.textContent = String(zoneAlerts);
    const highestSeverity = Number(data.highest_severity ?? 1);
    const zoneLevel = ZONE_LEVELS[highestSeverity] || ZONE_LEVELS[1];
    const borderHex = zoneLevel.hex;
    const stateClasses = [
      "bg-emerald-50/50",
      "bg-amber-50/50",
      "bg-red-50/80",
      "border-emerald-500",
      "border-amber-500",
      "border-red-600",
      "dark:bg-emerald-950/20",
      "dark:bg-amber-950/20",
      "dark:bg-red-900/30",
      "dark:border-emerald-500",
      "dark:border-amber-500",
      "dark:border-red-500"
    ];
    stateClasses.forEach((cls) => dash.classList.remove(cls));
    dash.classList.remove("animate-pulse");
    dash.style.borderColor = borderHex;
    if (highestSeverity === 4) {
      dash.classList.add("bg-red-50/80", "dark:bg-red-900/30");
      if (helpAlerts > 0) {
        dash.classList.add("animate-pulse");
      }
    } else if (highestSeverity === 3) {
      dash.classList.add("bg-amber-50/50", "dark:bg-amber-950/20");
    } else if (highestSeverity === 2) {
      dash.classList.add("bg-amber-50/50", "dark:bg-amber-950/20");
    } else {
      dash.classList.add("bg-emerald-50/50", "dark:bg-emerald-950/20");
    }
    if (data.announcement !== undefined) {
      displayAnnouncement(data.announcement);
    }
  }
  function displayAnnouncement(announcement) {
    const announcementContainer = document.getElementById("announcement-container");
    const announcementDisplay = document.getElementById("announcement-display");
    const announcementText = document.getElementById("announcement-text");
    const announcementLevelBadge = document.getElementById("announcement-level-badge");
    const announcementMeta = document.getElementById("announcement-meta");
    if (!announcement || !announcement.is_active) {
      announcementContainer.classList.add("hidden");
      return;
    }
    announcementContainer.classList.remove("hidden");
    announcementText.textContent = announcement.announcement_text;
    const hazardLevel = ZONE_LEVELS[announcement.hazard_level_id] || ZONE_LEVELS[1];
    const borderColor = hazardLevel.hex;
    const bgColor = hazardLevel.bg;
    announcementDisplay.style.borderColor = borderColor;
    announcementDisplay.style.backgroundColor = bgColor + "20";
    let timestamp = announcement.created_at;
    if (typeof timestamp === "string" && !timestamp.includes("Z") && !timestamp.includes("+")) {
      timestamp = timestamp.replace(" ", "T") + "Z";
    }
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    announcementMeta.textContent = `Posted by ${announcement.created_by_user_name} on ${dateStr} at ${timeStr}`;
  }
  async function fetchAndDisplayAnnouncement() {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const announcement = await res.json();
        displayAnnouncement(announcement);
      }
    } catch (err) {
      console.error("Error fetching announcement:", err);
    }
  }
  fetchAndDisplayAnnouncement();
  const navigationStack = [];
  const views = {
    home: { el: viewHome },
    chat: { el: viewChat },
    settings: { el: viewSettings },
    profile: { el: viewProfile },
    admin: { el: viewAdmin },
    adminNav: { el: viewAdminNav },
    adminZones: { el: viewAdminZones },
    announcements: { el: viewAnnouncements },
    zoneEdit: { el: viewZoneEdit },
    userEdit: { el: viewUserEdit },
    members: { el: viewMembers },
    checkin: { el: viewCheckIn },
    checkinHistory: { el: viewCheckInHistory }
  };
  function navigateTo(viewName, options = {}) {
    const current = navigationStack[navigationStack.length - 1];
    if (current === "chat" && viewName !== "chat" && currentTag) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "openTag", tag: currentTag }));
      }
    }
    if (current && views[current]) {
      const currentEl = views[current].el;
      if (currentEl) {
        currentEl.classList.add("translate-x-full");
        currentEl.classList.remove("translate-x-0");
      }
    }
    if (views[viewName]) {
      const newEl = views[viewName].el;
      if (newEl) {
        newEl.classList.remove("translate-x-full");
        newEl.classList.add("translate-x-0");
      }
    }
    navigationStack.push(viewName);
    updateNavButtonStates(viewName);
    if (options.onNavigate) {
      options.onNavigate();
    }
  }
  function goBack() {
    if (navigationStack.length > 1) {
      const current = navigationStack[navigationStack.length - 1];
      if (current === "chat" && currentTag) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "openTag", tag: currentTag }));
        }
      }
      navigationStack.pop();
      const previous = navigationStack[navigationStack.length - 1];
      Object.values(views).forEach((view) => {
        if (view.el) {
          view.el.classList.add("translate-x-full");
          view.el.classList.remove("translate-x-0");
        }
      });
      if (views[previous]) {
        const prevEl = views[previous].el;
        if (prevEl) {
          prevEl.classList.remove("translate-x-full");
          prevEl.classList.add("translate-x-0");
        }
      }
      updateNavButtonStates(previous);
    }
  }
  navigationStack.push("home");
  const navButtonMap = {
    home: "nav-home",
    checkin: "nav-checkin",
    members: "nav-members",
    settings: "nav-settings",
    admin: "nav-admin"
  };
  function updateNavButtonStates(currentView) {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("text-orange-500", "dark:text-vsdark-text");
      btn.classList.add("text-slate-400", "dark:text-vsdark-text-secondary");
    });
    const activeButtonId = navButtonMap[currentView];
    if (activeButtonId) {
      const activeBtn = document.getElementById(activeButtonId);
      if (activeBtn) {
        activeBtn.classList.remove("text-slate-400", "dark:text-vsdark-text-secondary");
        activeBtn.classList.add("text-orange-500", "dark:text-vsdark-text");
      }
    }
  }
  let currentTag = "#general";
  let allTags = [];
  let currentUserLevel = 0;
  let currentUserName = "";
  let allZones = [];
  let currentEditingZoneId = null;
  let allUsers = [];
  let currentEditingUserId = null;
  let allMembers = [];
  async function checkAuth() {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        viewAuth.classList.add("hidden");
        const user = await res.json();
        currentUserLevel = user.user_level || 0;
        currentUserName = user.name || "Admin";
        if ((user.user_level || 0) >= 2) {
          navAdmin.classList.remove("hidden");
        } else {
          navAdmin.classList.add("hidden");
        }
        initWebSocket();
      } else {
        viewAuth.classList.remove("hidden");
      }
    } catch (e) {
      console.error("Auth check failed:", e);
      viewAuth.classList.remove("hidden");
    }
  }
  checkAuth();
  updateNavButtonStates("home");
  window.toggleAuthMode = (mode) => {
    authError.classList.add("hidden");
    authError.textContent = "";
    if (mode === "register") {
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
    } else {
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    }
  };
  async function handleAuthSubmit(e, url) {
    e.preventDefault();
    authError.classList.add("hidden");
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        viewAuth.classList.add("hidden");
        initWebSocket();
        e.target.reset();
      } else {
        const result = await res.json();
        authError.textContent = result.error || "Authentication failed";
        authError.classList.remove("hidden");
      }
    } catch (err) {
      authError.textContent = "Network error occurred";
      authError.classList.remove("hidden");
    }
  }
  loginForm.addEventListener("submit", (e) => handleAuthSubmit(e, "/api/login"));
  registerForm.addEventListener("submit", (e) => handleAuthSubmit(e, "/api/register"));
  window.openProfile = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const user = await res.json();
        const form = document.getElementById("profile-form");
        form.elements.namedItem("full_name").value = user.full_name || "";
        form.elements.namedItem("email").value = user.email || "";
        form.elements.namedItem("phone_number").value = user.phone_number || "";
        form.elements.namedItem("physical_address").value = user.physical_address || "";
        const levelDisplay = document.getElementById("profile-level-display");
        if (levelDisplay) {
          const level = user.user_level || 0;
          const levelLabel = USER_LEVELS[level]?.label || "Unknown";
          levelDisplay.textContent = `${level} - ${levelLabel}`;
        }
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    }
    navigateTo("profile");
  };
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    profileMessage.classList.add("hidden");
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        profileMessage.textContent = "Profile updated successfully!";
        profileMessage.className = "text-center text-sm mt-2 text-green-600 dark:text-green-400";
        profileMessage.classList.remove("hidden");
      } else {
        const result = await res.json();
        profileMessage.textContent = result.error || "Update failed";
        profileMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        profileMessage.classList.remove("hidden");
      }
    } catch (err) {
      profileMessage.textContent = "Network error";
      profileMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
      profileMessage.classList.remove("hidden");
    }
  });
  const html = document.documentElement;
  function applyTheme(isDark) {
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || !savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    applyTheme(true);
  } else {
    applyTheme(false);
  }
  window.toggleTheme = () => {
    const isDark = html.classList.contains("dark");
    applyTheme(!isDark);
  };
  let ws;
  function initWebSocket() {
    if (ws)
      return;
    ws = new WebSocket(`ws://${window.location.host}/ws`);
    ws.onopen = () => {
      console.log("WebSocket connection established.");
      updateConnectionStatus(true);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "newPost") {
        if (data.post.tagName === currentTag) {
          addMessageToChat(data.post);
        }
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "requestTags" }));
        }
      } else if (data.type === "postUpdate") {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "requestTags" }));
        }
      } else if (data.type === "history") {
        messageContainer.innerHTML = "";
        data.posts.forEach((post) => addMessageToChat(post));
      } else if (data.type === "error") {
        alert(data.message);
      } else if (data.type === "tags") {
        allTags = data.tags;
        renderZoneList(data.tags);
        if (currentTag) {
          const tag = allTags.find((t) => t.name === currentTag);
          if (tag)
            updateHeaderStyle(tag.hazard_level_id);
        }
      } else if (data.type === "DASHBOARD_UPDATE") {
        updateDashboard(data);
      }
    };
    ws.onclose = () => {
      console.log("WebSocket connection closed.");
      updateConnectionStatus(false);
      ws = null;
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      updateConnectionStatus(false);
    };
  }
  window.openZone = (tagName) => {
    currentTag = tagName;
    activeTagName.textContent = tagName;
    const tag = allTags.find((t) => t.name === tagName);
    if (tag)
      updateHeaderStyle(tag.hazard_level_id);
    messageContainer.innerHTML = "";
    navigateTo("chat");
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "openTag", tag: tagName }));
      ws.send(JSON.stringify({ type: "requestTags" }));
      ws.send(JSON.stringify({ type: "subscribe", tag: tagName }));
    }
  };
  window.goHome = () => {
    navigateTo("home", {
      onNavigate: () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "requestTags" }));
        }
      }
    });
  };
  window.openSettings = () => {
    navigateTo("settings");
  };
  window.openMembers = async () => {
    navigateTo("members", {
      onNavigate: async () => {
        try {
          const res = await fetch("/api/members");
          if (res.ok) {
            const members = await res.json();
            allMembers = members;
            applyMembersFilters();
          } else {
            alert("Failed to fetch members");
          }
        } catch (e) {
          console.error("Error fetching members:", e);
        }
      }
    });
  };
  function renderMembersList(members) {
    membersList.innerHTML = "";
    members.forEach((member) => {
      const div = document.createElement("div");
      div.className = "p-3 bg-white dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light";
      const memberLevel = USER_LEVELS[member.user_level]?.label ? `${member.user_level} ${USER_LEVELS[member.user_level].label}` : `${member.user_level} Unknown`;
      let checkinHTML = "";
      if (member.timestamp) {
        let timestamp = member.timestamp;
        if (typeof timestamp === "string" && !timestamp.includes("Z") && !timestamp.includes("+")) {
          timestamp = timestamp.replace(" ", "T") + "Z";
        }
        const checkinDate = new Date(timestamp);
        const dateStr = checkinDate.toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "2-digit" });
        const timeStr = checkinDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const now = new Date;
        const diffMs = now - checkinDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        let relativeTime;
        if (diffHours > 0) {
          relativeTime = `${diffHours}h ${diffMins % 60}m ago`;
        } else {
          relativeTime = `${diffMins}m ago`;
        }
        const statusBadgeClass = member.status_id === 0 ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
        const statusText = member.status_id === 0 ? "OK" : "Help";
        checkinHTML = `
                    <div class="mt-3 pt-3 border-t border-slate-300 dark:border-vsdark-border-light">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeClass}">${statusText}</span>
                                <span class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${dateStr} ${timeStr}</span>
                                <span class="text-xs text-slate-400 dark:text-vsdark-text-muted">(${relativeTime})</span>
                            </div>
                            <button type="button" onclick="window.viewCheckInHistory(${member.id}, '${(member.full_name || "").replace(/'/g, "\\'")}')"
                                class="px-2 py-0.5 bg-vsdark-active5 text-white rounded text-xs font-semibold hover:bg-vsdark-active1 transition-colors whitespace-nowrap">
                                History
                            </button>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-vsdark-text-dim">${member.status || ""}</p>
                    </div>
                `;
      }
      div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <p class="font-bold text-slate-800 dark:text-vsdark-text">${member.full_name}</p>
                    <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-vsdark-input text-slate-800 dark:text-vsdark-text">${memberLevel}</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mb-1">${member.email}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${member.phone_number || "N/A"}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mt-1">${member.physical_address || "N/A"}</p>
                ${checkinHTML}
            `;
      membersList.appendChild(div);
    });
  }
  window.toggleHelpFilter = () => {
    showOnlyHelpNeeded = !showOnlyHelpNeeded;
    membersFilterHelpBtn.classList.toggle("bg-red-100");
    membersFilterHelpBtn.classList.toggle("dark:bg-red-800");
    applyMembersFilters();
  };
  function applyMembersFilters() {
    if (!membersFilter) {
      renderMembersList(allMembers);
      return;
    }
    const term = (membersFilter.value || "").toLowerCase().trim();
    const filtered = allMembers.filter((m) => {
      const fullName = String(m.full_name ?? "").toLowerCase();
      const email = String(m.email ?? "").toLowerCase();
      const matchesSearch = !term || fullName.includes(term) || email.includes(term);
      const matchesHelpStatus = !showOnlyHelpNeeded || Number(m.status_id) === 1;
      return matchesSearch && matchesHelpStatus;
    });
    renderMembersList(filtered);
  }
  if (membersFilter) {
    membersFilter.addEventListener("input", () => applyMembersFilters());
  }
  let currentViewingUserId = null;
  let currentViewingUserLatestCheckin = null;
  window.viewCheckInHistory = async (userId, memberName) => {
    currentViewingUserId = userId;
    currentViewingUserLatestCheckin = null;
    document.getElementById("checkin-history-name").textContent = memberName;
    const feedbackPanel = document.getElementById("admin-feedback-panel");
    const feedbackText = document.getElementById("admin-feedback-text");
    const feedbackMessage = document.getElementById("feedback-message");
    if (feedbackPanel) {
      if (currentUserLevel >= 2) {
        feedbackPanel.classList.remove("hidden");
        feedbackText.value = "";
        feedbackMessage.classList.add("hidden");
      } else {
        feedbackPanel.classList.add("hidden");
      }
    }
    try {
      const res = await fetch(`/api/user/${userId}/checkins`);
      if (res.ok) {
        const checkins = await res.json();
        if (checkins.length > 0) {
          currentViewingUserLatestCheckin = checkins[0];
        }
        renderCheckInHistory(checkins);
      } else {
        document.getElementById("checkin-history-list").innerHTML = '<p class="text-red-600 dark:text-red-400">Failed to load check-in history</p>';
      }
    } catch (err) {
      console.error("Error fetching check-in history:", err);
      document.getElementById("checkin-history-list").innerHTML = '<p class="text-red-600 dark:text-red-400">Error loading check-in history</p>';
    }
    navigateTo("checkinHistory");
  };
  function renderCheckInHistory(checkins) {
    const historyList = document.getElementById("checkin-history-list");
    historyList.innerHTML = "";
    if (checkins.length === 0) {
      historyList.innerHTML = '<p class="text-slate-500 dark:text-vsdark-text-secondary text-center">No check-in history</p>';
      return;
    }
    checkins.forEach((checkin) => {
      const div = createCheckInHistoryEntry(checkin);
      historyList.appendChild(div);
    });
  }
  function createCheckInHistoryEntry(checkin) {
    const div = document.createElement("div");
    div.className = "p-3 bg-slate-100 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light";
    let timestamp = checkin.timestamp;
    if (typeof timestamp === "string" && !timestamp.includes("Z") && !timestamp.includes("+")) {
      timestamp = timestamp.replace(" ", "T") + "Z";
    }
    const checkinDate = new Date(timestamp);
    const dateStr = checkinDate.toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "2-digit" });
    const timeStr = checkinDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const statusBadgeClass = checkin.status_id === 0 ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
    const statusText = checkin.status_id === 0 ? "OK" : "Help";
    div.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeClass}">${statusText}</span>
                <span class="text-xs text-slate-600 dark:text-vsdark-text-dim">${dateStr} ${timeStr}</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-vsdark-text-dim">${checkin.status || "(No message)"}</p>
        `;
    return div;
  }
  function prependAdminFeedbackEntry(feedbackText, statusId) {
    const historyList = document.getElementById("checkin-history-list");
    const now = new Date;
    const fakeCheckin = {
      id: "admin-" + Date.now(),
      status_id: statusId,
      timestamp: now.toISOString(),
      status: `[${currentUserName}] ${feedbackText}`
    };
    const div = createCheckInHistoryEntry(fakeCheckin);
    historyList.insertBefore(div, historyList.firstChild);
  }
  const feedbackSubmitBtn = document.getElementById("btn-feedback-submit");
  const feedbackCloseBtn = document.getElementById("btn-feedback-close");
  if (feedbackSubmitBtn) {
    feedbackSubmitBtn.addEventListener("click", async () => {
      const feedbackText = document.getElementById("admin-feedback-text").value.trim();
      const feedbackMessage = document.getElementById("feedback-message");
      if (!feedbackText) {
        feedbackMessage.classList.remove("hidden");
        feedbackMessage.textContent = "Please enter feedback text";
        feedbackMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        return;
      }
      if (!currentViewingUserLatestCheckin) {
        feedbackMessage.classList.remove("hidden");
        feedbackMessage.textContent = "Error: No check-in data available";
        feedbackMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        return;
      }
      try {
        feedbackSubmitBtn.disabled = true;
        feedbackCloseBtn.disabled = true;
        const res = await fetch(`/api/admin/checkins/${currentViewingUserLatestCheckin.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: feedbackText,
            status_id: currentViewingUserLatestCheckin.status_id
          })
        });
        if (res.ok) {
          feedbackMessage.classList.remove("hidden");
          feedbackMessage.textContent = "Feedback submitted successfully";
          feedbackMessage.className = "text-center text-sm mt-2 text-green-600 dark:text-green-400";
          prependAdminFeedbackEntry(feedbackText, currentViewingUserLatestCheckin.status_id);
          document.getElementById("admin-feedback-text").value = "";
        } else {
          feedbackMessage.classList.remove("hidden");
          feedbackMessage.textContent = "Failed to submit feedback";
          feedbackMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        }
      } catch (err) {
        console.error("Error submitting feedback:", err);
        feedbackMessage.classList.remove("hidden");
        feedbackMessage.textContent = "Error: " + err.message;
        feedbackMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
      } finally {
        feedbackSubmitBtn.disabled = false;
        feedbackCloseBtn.disabled = false;
      }
    });
  }
  if (feedbackCloseBtn) {
    feedbackCloseBtn.addEventListener("click", async () => {
      const feedbackText = document.getElementById("admin-feedback-text").value.trim();
      const feedbackMessage = document.getElementById("feedback-message");
      if (!feedbackText) {
        feedbackMessage.classList.remove("hidden");
        feedbackMessage.textContent = "Please enter feedback text";
        feedbackMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        return;
      }
      if (!currentViewingUserLatestCheckin) {
        feedbackMessage.classList.remove("hidden");
        feedbackMessage.textContent = "Error: No check-in data available";
        feedbackMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        return;
      }
      try {
        feedbackSubmitBtn.disabled = true;
        feedbackCloseBtn.disabled = true;
        const res = await fetch(`/api/admin/checkins/${currentViewingUserLatestCheckin.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: feedbackText,
            status_id: 0
          })
        });
        if (res.ok) {
          feedbackMessage.classList.remove("hidden");
          feedbackMessage.textContent = "Help request closed and feedback submitted";
          feedbackMessage.className = "text-center text-sm mt-2 text-green-600 dark:text-green-400";
          prependAdminFeedbackEntry(feedbackText, 0);
          document.getElementById("admin-feedback-text").value = "";
        } else {
          feedbackMessage.classList.remove("hidden");
          feedbackMessage.textContent = "Failed to close help request";
          feedbackMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        }
      } catch (err) {
        console.error("Error closing help request:", err);
        feedbackMessage.classList.remove("hidden");
        feedbackMessage.textContent = "Error: " + err.message;
        feedbackMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
      } finally {
        feedbackSubmitBtn.disabled = false;
        feedbackCloseBtn.disabled = false;
      }
    });
  }
  window.openCheckIn = () => {
    navigateTo("checkin");
    checkinStatus.value = "";
    const messageDiv = document.getElementById("checkin-message");
    messageDiv.textContent = "";
    messageDiv.className = "text-center text-sm font-medium p-3 rounded hidden";
  };
  window.submitCheckIn = async (statusType) => {
    const status = checkinStatus.value.trim();
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_id: statusType === "ok" ? 0 : 1,
          status
        })
      });
      if (res.ok) {
        const previousText = statusType === "ok" ? "OK" : "Help";
        const messageDiv = document.getElementById("checkin-message");
        messageDiv.textContent = `Check-in submitted: ${previousText}`;
        messageDiv.className = "text-center text-sm font-medium p-3 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        checkinStatus.value = "";
        setTimeout(() => {
          window.goHome();
        }, 1500);
      } else {
        const result = await res.json();
        const messageDiv = document.getElementById("checkin-message");
        messageDiv.textContent = result.error || "Check-in failed";
        messageDiv.className = "text-center text-sm font-medium p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      }
    } catch (err) {
      console.error("Error submitting check-in:", err);
      const messageDiv = document.getElementById("checkin-message");
      messageDiv.textContent = "Network error occurred";
      messageDiv.className = "text-center text-sm font-medium p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
  };
  postForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const content = postContent.value.trim();
    if (content && ws) {
      const message = { type: "post", content, tag: currentTag };
      ws.send(JSON.stringify(message));
      postContent.value = "";
    }
  });
  function addMessageToChat(post) {
    if (post.tagName && post.tagName !== currentTag)
      return;
    const messageDiv = document.createElement("div");
    messageDiv.className = "bg-white dark:bg-vsdark-surface p-3 rounded-lg shadow-sm border border-slate-200 dark:border-vsdark-border self-start max-w-[85%] animate-fade-in-up";
    let timestamp = post.timestamp;
    if (typeof timestamp === "string" && !timestamp.includes("Z") && !timestamp.includes("+")) {
      timestamp = timestamp.replace(" ", "T") + "Z";
    }
    const dateObj = new Date(timestamp);
    const timeString = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateString = dateObj.toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "2-digit" });
    messageDiv.innerHTML = `
            <p class="text-xs font-bold text-orange-600 dark:text-vsdark-active1 mb-1">${post.userName}</p>
            <p class="text-slate-800 dark:text-vsdark-text">${post.content}</p>
            <p class="text-[10px] text-slate-400 dark:text-vsdark-text-muted mt-1">${dateString} ${timeString}</p>
        `;
    messageContainer.appendChild(messageDiv);
    scrollToBottom();
  }
  function scrollToBottom() {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
  function updateConnectionStatus(isOnline) {
    if (!connectionStatus)
      return;
    if (isOnline) {
      connectionStatus.classList.remove("bg-red-500");
      connectionStatus.classList.add("bg-emerald-400", "animate-pulse");
    } else {
      connectionStatus.classList.remove("bg-emerald-400", "animate-pulse");
      connectionStatus.classList.add("bg-red-500");
    }
  }
  function renderZoneList(tags) {
    if (!zoneList)
      return;
    zoneList.innerHTML = "";
    tags.forEach((tag) => {
      const button = document.createElement("button");
      const zoneLevel = ZONE_LEVELS[tag.hazard_level_id] || ZONE_LEVELS[1];
      let nameClass = "font-bold text-orange-600 dark:text-vsdark-active1";
      if (zoneLevel.color === "emerald") {
        nameClass = "font-bold text-green-600 dark:text-green-400";
      } else if (zoneLevel.color === "red") {
        nameClass = "font-bold text-red-600 dark:text-red-400";
      } else if (zoneLevel.color === "amber") {
        nameClass = "font-bold text-amber-600 dark:text-amber-400";
      } else if (zoneLevel.color === "orange") {
        nameClass = "font-bold text-orange-600 dark:text-orange-400";
      }
      button.className = "w-full text-left p-4 bg-white dark:bg-vsdark-surface rounded-lg shadow-sm border border-slate-200 dark:border-vsdark-border hover:bg-slate-50 dark:hover:bg-vsdark-input transition-colors mb-2";
      button.onclick = () => window.openZone(tag.name);
      const unreadBadge = (tag.unread_count || 0) > 0 ? `<span class="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ">${tag.unread_count}</span>` : "";
      button.innerHTML = `
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                        <span class="${nameClass}">${tag.name}</span>
                        <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${tag.description || ""}</p>
                    </div>
                    ${unreadBadge}
                </div>
            `;
      zoneList.appendChild(button);
    });
  }
  function updateHeaderStyle(levelId) {
    if (!chatHeader || !hazardBar)
      return;
    const zoneLevel = ZONE_LEVELS[Number(levelId)] || ZONE_LEVELS[1];
    const headerColors = [
      "bg-green-700",
      "dark:bg-green-800",
      "bg-indigo-700",
      "bg-red-700",
      "bg-orange-600",
      "bg-amber-500",
      "bg-emerald-600",
      "bg-slate-700",
      "dark:bg-indigo-900",
      "dark:bg-red-900",
      "dark:bg-orange-800",
      "dark:bg-amber-600",
      "dark:bg-emerald-800",
      "dark:bg-vsdark-surface"
    ];
    chatHeader.classList.remove(...headerColors);
    let headerBg, headerBgDark, barBg, barBorder, barText;
    if (zoneLevel.color === "red") {
      headerBg = "bg-red-700";
      headerBgDark = "dark:bg-red-900";
      barBg = "bg-white/20";
      barBorder = "border-white/30";
    } else if (zoneLevel.color === "orange") {
      headerBg = "bg-orange-600";
      headerBgDark = "dark:bg-orange-800";
      barBg = "bg-white/20";
      barBorder = "border-white/30";
    } else if (zoneLevel.color === "amber") {
      headerBg = "bg-amber-500";
      headerBgDark = "dark:bg-amber-600";
      barBg = "bg-black/10";
      barBorder = "border-black/20";
    } else {
      headerBg = "bg-green-700";
      headerBgDark = "dark:bg-green-800";
      barBg = "bg-emerald-500/20";
      barBorder = "border-emerald-500/30";
    }
    barText = `Hazard Level: ${zoneLevel.label}`;
    chatHeader.classList.add(headerBg, headerBgDark);
    hazardBar.className = `mt-2 text-xs p-1 rounded text-center border ${barBg} ${barBorder}`;
    hazardBar.textContent = barText;
  }
  window.logout = () => {
    document.cookie = "session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "session_id_sig=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    if (ws) {
      ws.close();
      ws = null;
    }
    viewAuth.classList.remove("hidden");
    window.goHome();
  };
  window.openAdmin = () => {
    navigateTo("adminNav");
  };
  window.openAdminSection = async (section) => {
    if (section === "users") {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const users = await res.json();
          allUsers = users;
          renderAdminUserList(users);
        } else {
          alert("Failed to fetch users");
        }
      } catch (e) {
        console.error("Error fetching users:", e);
      }
      navigateTo("admin");
    } else if (section === "zones") {
      try {
        const res = await fetch("/api/admin/tags");
        if (res.ok) {
          const zones = await res.json();
          allZones = zones;
          renderAdminZoneList(zones);
        } else {
          alert("Failed to fetch zones");
        }
      } catch (e) {
        console.error("Error fetching zones:", e);
      }
      navigateTo("adminZones");
    } else if (section === "announcements") {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const currentAnnouncement = await res.json();
          displayCurrentAnnouncement(currentAnnouncement);
        }
        const historyRes = await fetch("/api/admin/announcements");
        if (historyRes.ok) {
          const history = await historyRes.json();
          renderAnnouncementsHistory(history);
        }
      } catch (e) {
        console.error("Error fetching announcements:", e);
      }
      navigateTo("announcements");
    }
  };
  if (adminUserFilter) {
    adminUserFilter.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allUsers.filter((u) => u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
      renderAdminUserList(filtered);
    });
  }
  function renderAdminUserList(users) {
    adminUserList.innerHTML = "";
    users.forEach((user) => {
      const div = document.createElement("div");
      div.className = "flex items-center justify-between p-3 bg-slate-50 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light cursor-pointer hover:bg-slate-100 dark:hover:bg-vsdark-border-light";
      const userLevel = USER_LEVELS[user.user_level]?.label ? `${user.user_level} ${USER_LEVELS[user.user_level].label}` : `${user.user_level} Unknown`;
      div.innerHTML = `
                <div class="flex-1">
                    <p class="font-bold text-slate-800 dark:text-vsdark-text">${user.full_name}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${user.email}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${user.phone_number || "N/A"}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-vsdark-input text-slate-800 dark:text-vsdark-text">${userLevel}</span>
                    <button onclick="window.openUserEdit(${user.id})" class="px-3 py-1 bg-vsdark-active5 text-white rounded text-xs font-bold hover:bg-vsdark-active1">Edit</button>
                </div>
            `;
      adminUserList.appendChild(div);
    });
  }
  window.updateUserLevel = async (userId, newLevel) => {
    try {
      const res = await fetch("/api/admin/update-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newLevel: parseInt(String(newLevel)) })
      });
      if (!res.ok) {
        alert("Failed to update level");
      }
    } catch (e) {
      console.error("Error updating level:", e);
    }
  };
  window.openUserEdit = async (userId) => {
    currentEditingUserId = userId;
    const user = allUsers.find((u) => u.id === userId);
    if (!user) {
      alert("User not found");
      return;
    }
    document.getElementById("user-fullname-input").value = user.full_name || "";
    document.getElementById("user-email-input").value = user.email || "";
    document.getElementById("user-phone-input").value = user.phone_number || "";
    document.getElementById("user-address-input").value = user.physical_address || "";
    document.getElementById("user-level-input").value = String(user.user_level || "0");
    navigateTo("userEdit");
  };
  window.closeUserEdit = () => {
    goBack();
  };
  if (userEditForm) {
    userEditForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userEditMessage = document.getElementById("user-edit-message");
      userEditMessage.classList.add("hidden");
      if (!currentEditingUserId) {
        alert("No user selected");
        return;
      }
      const data = {
        full_name: document.getElementById("user-fullname-input").value,
        email: document.getElementById("user-email-input").value,
        phone_number: document.getElementById("user-phone-input").value,
        physical_address: document.getElementById("user-address-input").value,
        user_level: parseInt(document.getElementById("user-level-input").value)
      };
      try {
        const res = await fetch(`/api/admin/users/${currentEditingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          userEditMessage.textContent = "User updated successfully!";
          userEditMessage.className = "text-center text-sm mt-2 text-green-600 dark:text-green-400";
          userEditMessage.classList.remove("hidden");
          setTimeout(() => {
            window.closeUserEdit();
            window.openAdminSection("users");
          }, 1500);
        } else {
          const result = await res.json();
          userEditMessage.textContent = result.error || "Update failed";
          userEditMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
          userEditMessage.classList.remove("hidden");
        }
      } catch (err) {
        userEditMessage.textContent = "Network error";
        userEditMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        userEditMessage.classList.remove("hidden");
      }
    });
  }
  if (adminZoneFilter) {
    adminZoneFilter.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allZones.filter((z) => z.name.toLowerCase().includes(term) || z.description && z.description.toLowerCase().includes(term));
      renderAdminZoneList(filtered);
    });
  }
  function renderAdminZoneList(zones) {
    adminZoneList.innerHTML = "";
    zones.forEach((zone) => {
      const div = document.createElement("div");
      div.className = "flex items-center justify-between p-3 bg-slate-50 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light cursor-pointer hover:bg-slate-100 dark:hover:bg-vsdark-border-light";
      const zoneLevel = ZONE_LEVELS[zone.hazard_level_id] || ZONE_LEVELS[1];
      let hazardClass = "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      if (zoneLevel.color === "amber") {
        hazardClass = "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200";
      } else if (zoneLevel.color === "orange") {
        hazardClass = "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200";
      } else if (zoneLevel.color === "red") {
        hazardClass = "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      }
      const weatherName = WEATHER_LEVELS[zone.id]?.name || "Unknown";
      div.innerHTML = `
                <div class="flex-1">
                    <p class="font-bold text-slate-800 dark:text-vsdark-text">${zone.name}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${zone.description || "No description"}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">Weather: ${weatherName}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-semibold ${hazardClass}">${zoneLevel.label}</span>
                    <button onclick="window.openZoneEdit(${zone.id})" class="px-3 py-1 bg-vsdark-active5 text-white rounded text-xs font-bold hover:bg-vsdark-active1">Edit</button>
                </div>
            `;
      adminZoneList.appendChild(div);
    });
  }
  window.openZoneEdit = async (zoneId) => {
    currentEditingZoneId = zoneId;
    const zone = allZones.find((z) => z.id === zoneId);
    if (!zone) {
      alert("Zone not found");
      return;
    }
    document.getElementById("zone-name-input").value = zone.name;
    document.getElementById("zone-description-input").value = zone.description || "";
    document.getElementById("zone-hazard-level-id-input").value = String(zone.hazard_level_id || 1);
    document.getElementById("zone-level-input").value = String(zone.access_level || "0");
    document.getElementById("zone-weather-id-input").value = String(zone.id || 1);
    document.getElementById("zone-person-in-charge-input").value = "";
    navigateTo("zoneEdit");
  };
  window.closeZoneEdit = () => {
    goBack();
  };
  if (zoneEditForm) {
    zoneEditForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const zoneEditMessage = document.getElementById("zone-edit-message");
      zoneEditMessage.classList.add("hidden");
      if (!currentEditingZoneId) {
        alert("No zone selected");
        return;
      }
      const data = {
        name: document.getElementById("zone-name-input").value,
        description: document.getElementById("zone-description-input").value,
        hazard_level_id: parseInt(document.getElementById("zone-hazard-level-id-input").value),
        access_level: parseInt(document.getElementById("zone-level-input").value),
        weather_id: parseInt(document.getElementById("zone-weather-id-input").value),
        person_in_charge: document.getElementById("zone-person-in-charge-input").value
      };
      try {
        const res = await fetch(`/api/admin/tags/${currentEditingZoneId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          zoneEditMessage.textContent = "Zone updated successfully!";
          zoneEditMessage.className = "text-center text-sm mt-2 text-green-600 dark:text-green-400";
          zoneEditMessage.classList.remove("hidden");
          setTimeout(() => {
            window.closeZoneEdit();
            window.openAdminSection("zones");
          }, 1500);
        } else {
          const result = await res.json();
          zoneEditMessage.textContent = result.error || "Update failed";
          zoneEditMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
          zoneEditMessage.classList.remove("hidden");
        }
      } catch (err) {
        zoneEditMessage.textContent = "Network error";
        zoneEditMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        zoneEditMessage.classList.remove("hidden");
      }
    });
  }
  let currentAnnouncementId = null;
  function displayCurrentAnnouncement(announcement) {
    const displayEl = document.getElementById("current-announcement-display");
    const clearBtn = document.getElementById("btn-clear-announcement");
    if (!announcement || !announcement.is_active) {
      displayEl.innerHTML = '<p class="text-sm text-slate-500 dark:text-vsdark-text-secondary text-center">No active announcement</p>';
      clearBtn.disabled = true;
      currentAnnouncementId = null;
      return;
    }
    currentAnnouncementId = announcement.id;
    clearBtn.disabled = false;
    const hazardLevel = ZONE_LEVELS[announcement.hazard_level_id] || ZONE_LEVELS[1];
    let timestamp = announcement.created_at;
    if (typeof timestamp === "string" && !timestamp.includes("Z") && !timestamp.includes("+")) {
      timestamp = timestamp.replace(" ", "T") + "Z";
    }
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    displayEl.innerHTML = `
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-bold" style="background-color: ${hazardLevel.hex}; color: white;">
                        ${hazardLevel.label}
                    </span>
                    <span class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${dateStr} at ${timeStr}</span>
                </div>
                <p class="text-sm font-semibold dark:text-vsdark-text">${announcement.announcement_text}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">By ${announcement.created_by_user_name}</p>
            </div>
        `;
  }
  function renderAnnouncementsHistory(announcements) {
    const historyList = document.getElementById("announcements-history-list");
    historyList.innerHTML = "";
    if (announcements.length === 0) {
      historyList.innerHTML = '<p class="text-sm text-slate-500 dark:text-vsdark-text-secondary text-center">No history</p>';
      return;
    }
    announcements.forEach((ann) => {
      const div = document.createElement("div");
      div.className = "p-3 bg-slate-50 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light";
      const hazardLevel = ZONE_LEVELS[ann.hazard_level_id] || ZONE_LEVELS[1];
      const statusClass = ann.is_active ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
      const statusText = ann.is_active ? "Active" : "Cleared";
      let timestamp = ann.created_at;
      if (typeof timestamp === "string" && !timestamp.includes("Z") && !timestamp.includes("+")) {
        timestamp = timestamp.replace(" ", "T") + "Z";
      }
      const date = new Date(timestamp);
      const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
      const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      let clearedInfo = "";
      if (!ann.is_active && ann.cleared_at) {
        let clearedTimestamp = ann.cleared_at;
        if (typeof clearedTimestamp === "string" && !clearedTimestamp.includes("Z") && !clearedTimestamp.includes("+")) {
          clearedTimestamp = clearedTimestamp.replace(" ", "T") + "Z";
        }
        const clearedDate = new Date(clearedTimestamp);
        const clearedDateStr = clearedDate.toLocaleDateString([], { month: "short", day: "numeric" });
        const clearedTimeStr = clearedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        clearedInfo = `<p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mt-1">Cleared by ${ann.cleared_by_user_name} on ${clearedDateStr} at ${clearedTimeStr}</p>`;
      }
      div.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded text-xs font-bold ${statusClass}">${statusText}</span>
                    <span class="px-2 py-0.5 rounded text-xs font-bold" style="background-color: ${hazardLevel.hex}; color: white;">
                        ${hazardLevel.label}
                    </span>
                    <span class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${dateStr} ${timeStr}</span>
                </div>
                <p class="text-sm dark:text-vsdark-text">${ann.announcement_text}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mt-1">By ${ann.created_by_user_name}</p>
                ${clearedInfo}
            `;
      historyList.appendChild(div);
    });
  }
  window.clearCurrentAnnouncement = async () => {
    if (!currentAnnouncementId)
      return;
    if (!confirm("Are you sure you want to clear the current announcement?")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/announcements/${currentAnnouncementId}/clear`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        displayCurrentAnnouncement(null);
        const historyRes = await fetch("/api/admin/announcements");
        if (historyRes.ok) {
          const history = await historyRes.json();
          renderAnnouncementsHistory(history);
        }
      } else {
        alert("Failed to clear announcement");
      }
    } catch (e) {
      console.error("Error clearing announcement:", e);
      alert("Error clearing announcement");
    }
  };
  const announcementForm = document.getElementById("announcement-form");
  if (announcementForm) {
    announcementForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const announcementMessage = document.getElementById("announcement-message");
      announcementMessage.classList.add("hidden");
      const data = {
        announcement_text: document.getElementById("announcement-text-input").value,
        hazard_level_id: parseInt(document.getElementById("announcement-hazard-level-input").value)
      };
      try {
        const res = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          announcementMessage.textContent = "Announcement published successfully!";
          announcementMessage.className = "text-center text-sm mt-2 text-green-600 dark:text-green-400";
          announcementMessage.classList.remove("hidden");
          announcementForm.reset();
          setTimeout(async () => {
            const currentRes = await fetch("/api/announcements");
            if (currentRes.ok) {
              const current = await currentRes.json();
              displayCurrentAnnouncement(current);
            }
            const historyRes = await fetch("/api/admin/announcements");
            if (historyRes.ok) {
              const history = await historyRes.json();
              renderAnnouncementsHistory(history);
            }
          }, 500);
        } else {
          const result = await res.json();
          announcementMessage.textContent = result.error || "Failed to publish announcement";
          announcementMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
          announcementMessage.classList.remove("hidden");
        }
      } catch (err) {
        announcementMessage.textContent = "Network error";
        announcementMessage.className = "text-center text-sm mt-2 text-red-600 dark:text-red-400";
        announcementMessage.classList.remove("hidden");
      }
    });
  }
});
