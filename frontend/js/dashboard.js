document.addEventListener("DOMContentLoaded", async () => {
  // 1. Authentication Guard
  const isLoggedIn = localStorage.getItem("studentLoggedIn") === "true";
  const studentName = localStorage.getItem("studentName") || "";

  if (!isLoggedIn || !studentName) {
    if (window.location.search.includes("id=")) {
      localStorage.setItem("returnUrl", window.location.href);
    }
    window.location.href = "/";
    return;
  }

  if (typeof lucide !== "undefined") lucide.createIcons();

  // 2. DOM Elements Cache
  const body = document.body;
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const userProfileBtn = document.getElementById("userProfileBtn");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeHeader = document.getElementById("welcomeHeader");
  const avatarLetter = document.getElementById("avatarLetter");
  const userNameDisplay = document.getElementById("userNameDisplay");

  const totalNotesStat = document.getElementById("totalNotesStat");
  const favouritesStat = document.getElementById("favouritesStat");
  const downloadsStat = document.getElementById("downloadsStat");
  const notificationBtn = document.getElementById("notificationBtn");
  const notificationBadge = document.getElementById("notificationBadge");

  const searchInput = document.getElementById("searchInput");
  const filterPills = document.querySelectorAll(".filter-pill");
  const subjectSelect = document.getElementById("subjectSelect");
  const semesterSelect = document.getElementById("semesterSelect");
  const sortBySelect = document.getElementById("sortBySelect");
  const notesGrid = document.getElementById("notesGrid");

  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");

  const paginationText = document.getElementById("paginationText");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const paginationNumbers = document.getElementById("paginationNumbers");

  const notificationListKey = "student_notifications";
  const notificationPanel = document.getElementById("notificationPanel");
  const notificationList = document.getElementById("notificationList");
  const markReadBtn = document.getElementById("markReadBtn");

  const getNotifications = () => {
    try {
      const stored = localStorage.getItem(notificationListKey);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.warn("Failed to parse stored notifications:", err);
      return [];
    }
  };

  const saveNotifications = (notifications) => {
    localStorage.setItem(notificationListKey, JSON.stringify(notifications));
  };

  const renderNotificationPanel = () => {
    if (!notificationList) return;
    const notifications = getNotifications();
    if (notifications.length === 0) {
      notificationList.innerHTML = `<div class="notification-empty">No notifications yet.</div>`;
      return;
    }
    notificationList.innerHTML = notifications
      .map(
        (note) => `
          <div class="notification-item ${note.read ? "read" : "unread"}">
            <div class="notification-message">${note.message}</div>
            <div class="notification-time">${new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        `,
      )
      .join("");
  };

  const updateNotificationBadge = () => {
    if (!notificationBadge) return;
    const notifications = getNotifications();
    const unread = notifications.filter((note) => !note.read).length;

    if (unread === 0) {
      notificationBadge.style.display = "none";
      notificationBadge.removeAttribute("data-count");
      return;
    }

    notificationBadge.style.display = "inline-flex";
    notificationBadge.setAttribute(
      "data-count",
      unread > 9 ? "9+" : unread.toString(),
    );
  };

  let notificationAudioContext = null;

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!notificationAudioContext) {
        notificationAudioContext = new AudioCtx();
      }

      notificationAudioContext.resume().then(() => {
        const oscillator = notificationAudioContext.createOscillator();
        const gainNode = notificationAudioContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 950;
        gainNode.gain.value = 0.08;
        oscillator.connect(gainNode);
        gainNode.connect(notificationAudioContext.destination);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          notificationAudioContext.currentTime + 0.12,
        );
        oscillator.stop(notificationAudioContext.currentTime + 0.12);
      });
    } catch (e) {
      console.warn("Notification sound failed:", e);
    }
  };

  const addNotification = (message) => {
    const notifications = getNotifications();
    notifications.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveNotifications(notifications.slice(0, 20));
    updateNotificationBadge();
    renderNotificationPanel();
    playNotificationSound();
    if (notificationBtn) {
      notificationBtn.classList.add("pulse");
      setTimeout(() => notificationBtn.classList.remove("pulse"), 650);
    }
  };

  const markNotificationsRead = () => {
    const notifications = getNotifications().map((note) => ({
      ...note,
      read: true,
    }));
    saveNotifications(notifications);
    updateNotificationBadge();
    renderNotificationPanel();
  };

  const closeNotificationPanel = () => {
    if (notificationPanel) notificationPanel.classList.remove("active");
  };

  if (notificationBtn) {
    notificationBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!notificationPanel) return;
      renderNotificationPanel();
      notificationPanel.classList.toggle("active");
    });
  }

  if (markReadBtn) {
    markReadBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      markNotificationsRead();
    });
  }

  const clearAllNotifBtn = document.getElementById("clearAllNotifBtn");
  if (clearAllNotifBtn) {
    clearAllNotifBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      saveNotifications([]);
      renderNotificationPanel();
      updateNotificationBadge();
    });
  }

  document.addEventListener("click", (event) => {
    if (!notificationPanel || !notificationPanel.classList.contains("active"))
      return;
    if (
      event.target === notificationBtn ||
      notificationPanel.contains(event.target)
    ) {
      return;
    }
    closeNotificationPanel();
  });

  // Helper: escape a value for embedding inside double-quoted HTML onclick attributes.
  // JSON.stringify produces "value" with double quotes that break onclick="..." attributes.
  // Using &quot; lets the browser unescape them correctly when executing the inline JS.
  const escAttr = (val) => JSON.stringify(val).replace(/"/g, "&quot;");

  // ─── FIX #1: Move safeJsonParse to the TOP, before any fetch calls ───────────
  const safeJsonParse = async (response) => {
    const text = await response.text();
    if (!response.ok) {
      console.warn(
        "safeJsonParse: non-ok response",
        response.url,
        response.status,
        response.statusText,
        response.headers.get("content-type"),
      );
    }
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error(
        "Failed to parse JSON response:",
        error,
        "URL=",
        response.url,
        "status=",
        response.status,
        "text=",
        text,
      );
      return null;
    }
  };

  // 3. Theme Toggle
  const themeKey = "theme";

  const root = document.documentElement;

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    root.classList.toggle("dark-theme", isDark);
    if (themeIcon) {
      themeIcon.setAttribute("data-lucide", isDark ? "sun" : "moon");
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
  };

  const currentTheme =
    localStorage.getItem(themeKey) ||
    (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const isDark = !root.classList.contains("dark-theme");
      const newTheme = isDark ? "dark" : "light";
      localStorage.setItem(themeKey, newTheme);
      applyTheme(newTheme);
      showNotification(
        `Switched to ${isDark ? "Dark" : "Light"} theme`,
        "success",
      );
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === themeKey) {
      applyTheme(event.newValue || "light");
    }
  });

  // 4. Welcome & User Info
  const formatName = (str) =>
    str
      .trim()
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const formattedName = formatName(studentName);
  const firstLetter = studentName.trim().charAt(0).toUpperCase();

  if (welcomeHeader)
    welcomeHeader.innerText = `Welcome back, ${formattedName}! 👋`;
  if (avatarLetter) avatarLetter.innerText = firstLetter;
  if (userNameDisplay) userNameDisplay.innerText = formattedName;

  // 5. Profile Dropdown & Logout
  if (userProfileBtn) {
    userProfileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("active");
    });
  }

  document.addEventListener("click", () => {
    if (profileDropdown) profileDropdown.classList.remove("active");
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("studentRollNo");
      localStorage.removeItem("studentName");
      localStorage.removeItem("studentLoggedIn");
      showNotification("Logged out successfully. Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    });
  }

  // 6.5 Profile Modal Functions
  window.showProfileModal = async () => {
    if (profileDropdown) profileDropdown.classList.remove("active");
    const modal = document.getElementById("profileModal");
    if (!modal) return;

    const rollNo = localStorage.getItem("studentRollNo");
    // Fetch profile info using rollNo
    if (!rollNo) return;

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/student/profile/${rollNo}`);
      const data = await safeJsonParse(res);
      if (data && data.success) {
        document.getElementById("profileRollNo").innerText = data.rollno || "N/A";
        document.getElementById("profileName").innerText = data.name || "N/A";
        document.getElementById("profileCourse").innerText = data.course || "Btech(Computer Science)";
        const avatarLetter = document.getElementById("profileAvatarLetter");
        if (avatarLetter && data.name) {
          avatarLetter.innerText = data.name.trim().charAt(0).toUpperCase();
        }
      } else {
        showNotification("Could not load profile data.", "error");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      showNotification("Error loading profile.", "error");
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  window.closeProfileModal = () => {
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.remove("active");
    document.body.style.overflow = "";
  };

  window.showChangePasswordModal = () => {
    if (profileDropdown) profileDropdown.classList.remove("active");
    const modal = document.getElementById("changePasswordModal");
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  };

  window.closeChangePasswordModal = () => {
    const modal = document.getElementById("changePasswordModal");
    if (modal) modal.classList.remove("active");
    document.body.style.overflow = "";
    const form = document.getElementById("changePasswordForm");
    if (form) form.reset();
  };

  const changePasswordForm = document.getElementById("changePasswordForm");
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const rollNo = localStorage.getItem("studentRollNo");
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (!newPassword || newPassword.length < 6) {
        showNotification("Password must be at least 6 characters.", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        showNotification("New passwords do not match.", "error");
        return;
      }

      try {
        const res = await fetch(`${window.API_BASE_URL}/api/student/change-password/${rollNo}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        });
        const data = await safeJsonParse(res);
        if (data && data.success) {
          showNotification(data.message, "success");
          closeChangePasswordModal();
        } else {
          showNotification(data?.error || "Failed to update password.", "error");
        }
      } catch (err) {
        console.error("Error changing password:", err);
        showNotification("Error changing password.", "error");
      }
    });
  }

  // 6. Sidebar Toggle (Mobile)
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () =>
      sidebar.classList.toggle("active"),
    );
  }

  // 6.1 Load & render subject categories into the sidebar <ul id="categoryList">
  let categoryLinks = []; // will hold live NodeList of .sidebar-link[data-category] elements
  let cachedSubjects = []; // Store subjects in memory

  async function fetchSubjects() {
    try {
      console.log("[dashboard] fetchSubjects called");
      const res = await fetch(window.API_BASE_URL + "/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects: " + res.status);
      const data = await res.json();
      console.log("[dashboard] API response:", data);
      if (data.success && Array.isArray(data.subjects)) {
        cachedSubjects = data.subjects; // Cache in memory
        console.log(
          "[dashboard] Fetched",
          data.subjects.length,
          "subjects from API:",
          data.subjects,
        );
        renderCategorySidebar(data.subjects);
        // Also update localStorage for cross-tab sync
        try {
          localStorage.setItem("subjects_cache", JSON.stringify(data.subjects));
          localStorage.setItem("subjects_updated_at", Date.now().toString());
          console.log("[dashboard] Subjects updated in localStorage");
        } catch (e) {
          console.warn("Could not write subjects to localStorage:", e);
        }
      } else {
        console.warn("API returned invalid subjects data:", data);
      }
    } catch (err) {
      console.error("Error fetching subjects from API:", err);
      // Try to load from localStorage as fallback
      try {
        const cached = localStorage.getItem("subjects_cache");
        if (cached) {
          const subjects = JSON.parse(cached);
          if (Array.isArray(subjects)) {
            console.log(
              "[dashboard] Loaded subjects from localStorage fallback:",
              subjects,
            );
            cachedSubjects = subjects;
            renderCategorySidebar(subjects);
          }
        }
      } catch (e) {
        console.warn("Could not load subjects from localStorage:", e);
      }
    }
  }

  function bindCategoryLinks() {
    categoryLinks = document.querySelectorAll(".sidebar-link[data-category]");
    categoryLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        categoryLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        activeCategory = link.dataset.category;
        currentPage = 1;
        if (subjectSelect) subjectSelect.value = activeCategory;
        renderNotes();
        if (window.innerWidth <= 900) sidebar.classList.remove("active");
      });
    });
  }

  function renderCategorySidebar(subjects) {
    console.log(
      "[dashboard] renderCategorySidebar called with",
      subjects?.length || 0,
      "subjects",
    );
    var categoryList = document.getElementById("categoryList");
    if (!categoryList) {
      console.warn("[dashboard] categoryList element not found in DOM");
    }

    if (!Array.isArray(subjects)) {
      console.warn(
        "[dashboard] renderCategorySidebar received invalid subjects:",
        subjects,
      );
      return;
    }

    // Render sidebar categories
    if (categoryList) {
      if (subjects.length > 0) {
        categoryList.innerHTML = subjects
          .map(function (subject) {
            return (
              '<li><a href="#" class="sidebar-link" data-category="' +
              subject.name +
              '"><i data-lucide="' +
              (subject.icon || "book") +
              '"></i><span>' +
              subject.name +
              "</span></a></li>"
            );
          })
          .join("");
      } else {
        categoryList.innerHTML =
          '<li style="padding: 0.75rem; color: var(--text-muted); font-size: 0.9rem;">No subjects available</li>';
      }
    }

    if (typeof lucide !== "undefined") lucide.createIcons();
    // Re-bind click handlers for newly injected links
    bindCategoryLinks();

    // Populate the subject select dropdown
    if (subjectSelect) {
      const options = subjects
        .map(function (s) {
          return '<option value="' + s.name + '">' + s.name + "</option>";
        })
        .join("");

      subjectSelect.innerHTML =
        '<option value="all">All Subjects</option>' + options;
      console.log(
        "[dashboard] Updated subject dropdown with " +
          subjects.length +
          " subjects:",
        subjects.map((s) => s.name),
      );
    } else {
      console.warn("[dashboard] subjectSelect element not found in DOM");
    }
  }

  // Listen for subject updates from other tabs/windows (admin actions)
  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    if (e.key === "subjects_updated_at" || e.key === "subjects_cache") {
      console.log(
        "[dashboard] Storage event detected for subjects - refreshing...",
        e.key,
        "newValue=",
        e.newValue,
      );
      // Re-fetch subjects to ensure the latest server state
      fetchSubjects();
    }
  });

  // Also listen for admin logout to clear cached subjects
  window.addEventListener("storage", (e) => {
    if (e.key === "adminLoggedIn" && !e.newValue) {
      // Admin logged out, subjects might have changed
      console.log(
        "[dashboard] Admin logged out detected - refreshing subjects",
      );
      fetchSubjects();
    }
  });

  // 7. Student roll number
  const studentRollNo = localStorage.getItem("studentRollNo") || "default";

  let userFavs = [];
  let userDownloads = [];

  let uploadedNotesCache = [];
  let uploadedNotesTimestamp = 0;
  const CACHE_DURATION = 5 * 60 * 1000;

  // ─── FIX #2: Consistent ID — always use file.filename as the canonical ID ────
  // This ensures note.id, note.fileName, and the PDF URL all use the same value.
  async function fetchUploadedNotes() {
    try {
      const response = await fetch(window.API_BASE_URL + "/api/uploaded-pdfs");
      const data = await safeJsonParse(response);
      if (data && data.success) {
        return data.files.map((file) => {
          const canonicalId = file.filename;
          return {
            id: canonicalId,
            title: file.title || file.original_name.replace(/\.pdf$/i, ""),
            category: file.category || "Uploaded Notes",
            catClass: file.catClass || "cs",
            author: file.author || "Admin",
            uploaded: file.uploaded,
            recent: true,
            trending: false,
            semester: file.semester || "N/A",
            description:
              file.description ||
              `PDF file (${(file.size / 1024).toFixed(1)} KB)`,
            fileName: canonicalId,
          };
        });
      }
      return [];
    } catch (error) {
      console.error("Error fetching uploaded notes:", error);
      return Date.now() - uploadedNotesTimestamp < CACHE_DURATION
        ? uploadedNotesCache
        : [];
    }
  }

  const getAllNotes = async () => {
    if (
      Date.now() - uploadedNotesTimestamp < CACHE_DURATION &&
      uploadedNotesCache.length > 0
    ) {
      return uploadedNotesCache;
    }
    const fetched = await fetchUploadedNotes();
    uploadedNotesCache = fetched;
    uploadedNotesTimestamp = Date.now();
    return fetched;
  };

  // ─── FIX #3: PDF URL always uses note.id (which equals note.fileName) ────────
  const getUploadedPdfUrl = (fileId) => {
    // encodeURIComponent handles spaces, special chars in filenames correctly
    return `/api/pdf/${encodeURIComponent(fileId)}`;
  };

  // 8. Load student favourites & downloads
  async function loadStudentStats() {
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/student-stats/${studentRollNo}`);
      const data = await safeJsonParse(res);
      if (data && data.success) {
        const statsRes = await fetch(
          `/api/student-stats-full/${studentRollNo}`,
        );
        if (statsRes.ok) {
          const statsData = await safeJsonParse(statsRes);
          if (statsData && statsData.success) {
            userFavs = statsData.favourites || [];
            userDownloads = statsData.downloads || [];
          }
        }
        return {
          favourites_count: data.favourites_count,
          downloads_count: data.downloads_count,
        };
      }
    } catch (e) {
      console.error("Error loading student stats:", e);
    }
    return { favourites_count: 0, downloads_count: 0 };
  }

  // 9. Update Stats Cards
  const updateStats = async () => {
    try {
      if (totalNotesStat) {
        const res = await fetch(window.API_BASE_URL + "/api/total-pdfs-count");
        const data = await safeJsonParse(res);
        totalNotesStat.innerText = data && data.success ? data.total_pdfs : 0;
      }
      const stats = await loadStudentStats();
      if (favouritesStat) favouritesStat.innerText = stats.favourites_count;
      if (downloadsStat) downloadsStat.innerText = stats.downloads_count;
    } catch (e) {
      console.error("Error updating stats:", e);
    }
  };

  await updateStats();
  updateNotificationBadge();

  // 10. Core Interactions
  window.toggleFavorite = async (id) => {
    const notes = await getAllNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const isFav = userFavs.includes(id);
    const action = isFav ? "remove_fav" : "add_fav";

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/student-stats/${studentRollNo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, filename: id }),
      });
      const data = await safeJsonParse(res);
      if (data && data.success) {
        if (isFav) {
          userFavs = userFavs.filter((f) => f !== id);
          showNotification(
            `Removed "${note.title}" from Favourites`,
            "success",
          );
          addNotification(`Removed "${note.title}" from favourites.`);
        } else {
          userFavs.push(id);
          showNotification(`Added "${note.title}" to Favourites`, "success");
          addNotification(`Added "${note.title}" to favourites.`);
        }
        if (favouritesStat) favouritesStat.innerText = data.favourites_count;
      }
    } catch (e) {
      console.error("Error toggling favourite:", e);
    }

    await renderNotes();
  };

  window.triggerDownload = async (id) => {
    const notes = await getAllNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    if (!note.fileName) {
      showNotification(
        "Unable to open this PDF because the file is missing.",
        "error",
      );
      return;
    }

    const wasDownloadedBefore = userDownloads.includes(id);
    if (!wasDownloadedBefore) {
      try {
        const res = await fetch(`${window.API_BASE_URL}/api/student-stats/${studentRollNo}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add_download", filename: id }),
        });
        const data = await safeJsonParse(res);
        if (data && data.success) {
          userDownloads.push(id);
          if (downloadsStat) downloadsStat.innerText = data.downloads_count;
        }
      } catch (e) {
        console.error("Error recording download:", e);
      }
    }

    addNotification(`Downloaded "${note.title}".`);

    // ─── FIX #4: Use note.id directly — it's always the canonical filename ────
    const pdfUrl = getUploadedPdfUrl(note.id) + "?download=true";
    // Attempt to trigger a direct download for same-origin PDF URL.
    try {
      const a = document.createElement("a");
      a.href = pdfUrl;
      // Suggest a filename using the note title, fallback to the canonical id
      a.download = note.title
        ? note.title.replace(/[^a-z0-9\-_\.\s]/gi, "_") + ".pdf"
        : note.id;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showNotification(`Downloading "${note.title}"...`, "success");
    } catch (e) {
      // Fallback: open in new tab if download attribute is not honored
      window.open(pdfUrl, "_blank");
      showNotification(`Opening "${note.title}" PDF...`, "success");
    }
    renderNotes();
  };

  window.shareNote = async (id) => {
    const notes = await getAllNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const shareLink = `${window.location.origin}/Dashboard/AllNotes.html?id=${encodeURIComponent(id)}`;
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        showNotification(
          `Copied share link for "${note.title}" to clipboard!`,
          "success",
        );
      })
      .catch((err) => {
        console.error("Clipboard copy failed: ", err);
        showNotification("Could not copy link automatically.", "error");
      });
  };

  // View Full Page Modal Preview
  window.viewNoteDetails = async (id) => {
    const notes = await getAllNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    // ─── FIX #5: Always derive PDF URL from note.id — single source of truth ──
    const pdfUrl = note.fileName ? getUploadedPdfUrl(note.id) : null;
    const safeId = note.id.replace(/[^a-z0-9]/gi, "_");

    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "previewModal";
    // Increase z-index locally to ensure it covers the header and everything else
    modal.style.zIndex = "99999";
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 100vw; width: 100vw; height: 100vh; max-height: 100vh; margin: 0; padding: 0; border-radius: 0; border: none; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-main);">
        
        <!-- Full Screen Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background-color: var(--bg-card); border-bottom: 1px solid var(--border); box-shadow: 0 2px 10px rgba(0,0,0,0.05); z-index: 10;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button class="btn btn-outline" id="previewBackBtn" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;">
              <i data-lucide="arrow-left" style="width:1.2rem;height:1.2rem;"></i> Back
            </button>
            <div style="display: flex; flex-direction: column; margin-left: 0.5rem;">
              <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0; line-height: 1.2;">${note.title}</h2>
              <span style="font-size: 0.85rem; color: var(--text-muted);">${note.category}  • Uploaded by ${note.author}</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button class="btn btn-outline" id="previewShareBtn">
              <i data-lucide="share-2" style="width:1.2rem;height:1.2rem;"></i> Share
            </button>
            <button class="btn btn-primary" id="previewDownloadBtn">
              <i data-lucide="download" style="width:1.2rem;height:1.2rem;"></i> Download
            </button>
          </div>
        </div>

        <!-- Full Screen PDF Viewer -->
        <div style="flex: 1; width: 100%; position: relative; background: #e2e8f0; display: flex; flex-direction: column;">
          ${
            pdfUrl
              ? `
            <iframe
              src="${pdfUrl}#toolbar=0"
              width="100%"
              height="100%"
              style="border: none; flex: 1; display: block;"
              onerror="this.style.display='none';document.getElementById('pdf-error-${safeId}').style.display='flex';"
            ></iframe>
            <div id="pdf-error-${safeId}" style="display:none; flex: 1; align-items: center; justify-content: center; flex-direction: column; color: var(--text-muted);">
              <i data-lucide="file-x" style="width: 4rem; height: 4rem; margin-bottom: 1rem; color: #94a3b8;"></i>
              <h3 style="margin-bottom: 0.5rem;">Preview Unavailable</h3>
              <p>The PDF file cannot be previewed right now. Please download it to view.</p>
              <button class="btn btn-primary" style="margin-top: 1rem;" id="previewFallbackDownloadBtn">
                <i data-lucide="download" style="width:1.2rem;height:1.2rem;"></i> Download PDF
              </button>
            </div>
            `
              : `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; color: var(--text-muted);">
              <i data-lucide="file-x" style="width: 4rem; height: 4rem; margin-bottom: 1rem; color: #94a3b8;"></i>
              <h3 style="margin-bottom: 0.5rem;">File Missing</h3>
              <p>This note does not have an associated PDF file.</p>
            </div>
            `
          }
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
    if (typeof lucide !== "undefined") lucide.createIcons();

    // Attach event listeners (avoids inline onclick escaping issues)
    document.getElementById("previewBackBtn").addEventListener("click", closePreviewModal);
    document.getElementById("previewShareBtn").addEventListener("click", () => shareNote(note.id));
    document.getElementById("previewDownloadBtn").addEventListener("click", () => triggerDownload(note.id));
    const fallbackBtn = document.getElementById("previewFallbackDownloadBtn");
    if (fallbackBtn) fallbackBtn.addEventListener("click", () => triggerDownload(note.id));
  };

  window.closePreviewModal = () => {
    const modal = document.getElementById("previewModal");
    if (modal) modal.remove();
    document.body.style.overflow = "";
  };

  // 11. Filter State
  let currentPage = 1;
  const cardsPerPage = 8;
  let activeFilterPill = "all";
  let activeCategory = "all";
  let searchQuery = "";
  let activeSemester = "all";

  const getPageContext = () => {
    const path = window.location.pathname;
    if (path.includes("AllNotes")) return "all_notes";
    if (path.includes("MyFav")) return "my_fav";
    if (path.includes("MyDownloads")) return "my_downloads";
    return "home";
  };

  const pageContext = getPageContext();

  sidebarLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (pageContext === "home" && href.includes("dashboard.html"))
      link.classList.add("active");
    else if (pageContext === "all_notes" && href.includes("AllNotes.html"))
      link.classList.add("active");
    else if (pageContext === "my_fav" && href.includes("MyFav.html"))
      link.classList.add("active");
    else if (
      pageContext === "my_downloads" &&
      href.includes("MyDownloads.html")
    )
      link.classList.add("active");
    else link.classList.remove("active");
  });

  // 12. Helper: apply all active filters to a notes array
  const applyFilters = (notes) => {
    let filtered = [...notes];

    if (pageContext === "my_fav") {
      filtered = filtered.filter((n) => userFavs.includes(n.id));
    } else if (pageContext === "my_downloads") {
      filtered = filtered.filter((n) => userDownloads.includes(n.id));
    }

    if (activeFilterPill === "recent")
      filtered = filtered.filter((n) => n.recent);
    else if (activeFilterPill === "trending")
      filtered = filtered.filter((n) => n.trending);

    if (activeCategory !== "all") {
      filtered = filtered.filter(
        (n) => n.category.toLowerCase() === activeCategory.toLowerCase(),
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q),
      );
    }

    if (activeSemester !== "all") {
      filtered = filtered.filter(
        (n) => n.semester.toLowerCase() === activeSemester.toLowerCase(),
      );
    }

    if (subjectSelect && subjectSelect.value !== "all") {
      filtered = filtered.filter(
        (n) => n.category.toLowerCase() === subjectSelect.value.toLowerCase(),
      );
    }

    const sortBy = sortBySelect ? sortBySelect.value : "latest";
    if (sortBy === "a-z")
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "z-a")
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    // "latest" — leave in API order (most recently uploaded first)

    return filtered;
  };

  // 13. Render Notes Grid
  const renderNotes = async () => {
    if (!notesGrid) return;

    const allNotes = await getAllNotes();
    const filtered = applyFilters(allNotes);

    if (filtered.length === 0) {
      notesGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="folder-open"></i>
          <h3>No Notes Found</h3>
          <p>We couldn't find any notes matching your current criteria. Try adjusting your filters or search query.</p>
        </div>
      `;
      if (typeof lucide !== "undefined") lucide.createIcons();
      if (paginationText) paginationText.innerText = "Showing 0 of 0 notes";
      updatePaginationControls(0);
      return;
    }

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / cardsPerPage);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, totalItems);
    const paginatedNotes = filtered.slice(startIndex, endIndex);

    notesGrid.innerHTML = paginatedNotes
      .map((note) => {
        const isFav = userFavs.includes(note.id);
        const isDownloaded = userDownloads.includes(note.id);
        return `
          <div class="note-card">
            <div class="note-card-header">
              <div class="pdf-badge">
                <i data-lucide="file-text"></i>
              </div>
              <button class="btn-fav ${isFav ? "active" : ""}" onclick="toggleFavorite(${escAttr(note.id)})" aria-label="Favourite note">
                <i data-lucide="heart"></i>
              </button>
            </div>
            <div class="note-card-body">
              <span class="category-tag ${note.catClass}">${note.category}</span>
              <h3 class="note-title" onclick="viewNoteDetails(${escAttr(note.id)})">${note.title}</h3>
              <div class="note-author-info">
                <div class="author-avatar">${note.author.charAt(0)}</div>
                <span class="author-name">${note.author}</span>
                <span class="upload-time">${note.uploaded}</span>
              </div>
            </div>
            <div class="note-card-footer">
              <button class="card-action-btn" onclick="viewNoteDetails(${escAttr(note.id)})">
                <i data-lucide="eye"></i> View
              </button>
              <button class="card-action-btn download-btn" onclick="triggerDownload(${escAttr(note.id)})">
                <i data-lucide="${isDownloaded ? "check-circle" : "download"}"></i>
                ${isDownloaded ? "Downloaded" : "Download"}
              </button>
              <button class="card-action-btn" onclick="shareNote(${escAttr(note.id)})">
                <i data-lucide="share-2"></i> Share
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    if (typeof lucide !== "undefined") lucide.createIcons();
    if (paginationText) {
      paginationText.innerText = `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} notes`;
    }
    updatePaginationControls(totalPages);
  };

  // 14. Pagination Controls
  const updatePaginationControls = (totalPages) => {
    if (!paginationNumbers) return;

    if (totalPages <= 1) {
      if (prevPageBtn) prevPageBtn.classList.add("disabled");
      if (nextPageBtn) nextPageBtn.classList.add("disabled");
      paginationNumbers.innerHTML = `<button class="page-btn active">1</button>`;
      return;
    }

    if (prevPageBtn)
      prevPageBtn.classList.toggle("disabled", currentPage === 1);
    if (nextPageBtn)
      nextPageBtn.classList.toggle("disabled", currentPage === totalPages);

    let buttonsHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      if (
        totalPages > 5 &&
        Math.abs(i - currentPage) > 1 &&
        i !== 1 &&
        i !== totalPages
      ) {
        if (i === 2 && currentPage > 3)
          buttonsHTML += `<span style="padding:0 0.5rem;color:var(--text-light)">...</span>`;
        if (i === totalPages - 1 && currentPage < totalPages - 2)
          buttonsHTML += `<span style="padding:0 0.5rem;color:var(--text-light)">...</span>`;
        continue;
      }
      buttonsHTML += `<button class="page-btn ${currentPage === i ? "active" : ""}" onclick="changePage(${i})">${i}</button>`;
    }
    paginationNumbers.innerHTML = buttonsHTML;
  };

  window.changePage = async (page) => {
    currentPage = page;
    await renderNotes();
    const wrapper = document.querySelector(".main-wrapper");
    if (wrapper) wrapper.scrollTop = 0;
  };

  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) changePage(currentPage - 1);
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", async () => {
      const allNotes = await getAllNotes();
      const filtered = applyFilters(allNotes);
      const totalPages = Math.ceil(filtered.length / cardsPerPage);
      if (currentPage < totalPages) changePage(currentPage + 1);
    });
  }

  // 15. Filter & Search Event Listeners
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      currentPage = 1;
      renderNotes();
    });
  }

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeFilterPill = pill.dataset.filter;
      currentPage = 1;
      renderNotes();
    });
  });

  if (subjectSelect) {
    subjectSelect.addEventListener("change", () => {
      currentPage = 1;
      renderNotes();
    });
  }

  if (semesterSelect) {
    semesterSelect.addEventListener("change", (e) => {
      activeSemester = e.target.value;
      currentPage = 1;
      renderNotes();
    });
  }

  if (sortBySelect) {
    sortBySelect.addEventListener("change", () => renderNotes());
  }

  // Load subjects from backend and render sidebar links — also binds click handlers
  console.log("[dashboard] Initializing: calling fetchSubjects() on page load");
  fetchSubjects();

  // 16. Deep Link (open note modal from URL ?id=)
  const handleDeepLink = async () => {
    const params = new URLSearchParams(window.location.search);
    const pdfId = params.get("id");
    if (!pdfId) return;
    const notes = await getAllNotes();
    const note = notes.find((n) => n.id === pdfId);
    if (note) viewNoteDetails(pdfId);
  };

await renderNotes();
   await handleDeepLink();

    // Close modals on overlay click
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        document.querySelectorAll(".modal.active").forEach((modal) => {
          modal.classList.remove("active");
        });
        document.body.style.overflow = "";
      }
    });

    // Feedback Logic
    const feedbackSidebarBtn = document.getElementById("feedbackSidebarBtn");
    const feedbackModal = document.getElementById("feedbackModal");
    const feedbackForm = document.getElementById("feedbackForm");
    const feedbackName = document.getElementById("feedbackName");

    window.closeFeedbackModal = () => {
      if (feedbackModal) feedbackModal.classList.remove("active");
      document.body.style.overflow = "";
      if (feedbackForm) feedbackForm.reset();
    };

    if (feedbackSidebarBtn && feedbackModal) {
      feedbackSidebarBtn.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".sidebar-link").forEach(l => l.classList.remove("active"));
        feedbackSidebarBtn.classList.add("active");
        
        if (feedbackName) {
          feedbackName.value = studentName; // auto-fill name
        }
        feedbackModal.classList.add("active");
        document.body.style.overflow = "hidden";
        const sidebar = document.getElementById("sidebar");
        if (window.innerWidth <= 900 && sidebar) sidebar.classList.remove("active");
      });
    }

    if (feedbackForm) {
      feedbackForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const desc = document.getElementById("feedbackDesc").value;
        const name = document.getElementById("feedbackName").value;
        
        try {
          const res = await fetch(window.API_BASE_URL + "/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name, rollno: studentRollNo, description: desc })
          });
          const data = await safeJsonParse(res);
          if (data && data.success) {
            showNotification("Feedback sent successfully!", "success");
            window.closeFeedbackModal();
          } else {
            showNotification(data?.error || "Failed to send feedback", "error");
          }
        } catch (err) {
          console.error(err);
          showNotification("Error sending feedback.", "error");
        }
      });
    }

});

// Toast Notification
function showNotification(message, type = "success") {
  const old = document.querySelector(".toast-notification");
  if (old) old.remove();

  const toast = document.createElement("div");
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i data-lucide="${type === "success" ? "check-circle" : "alert-circle"}"></i>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  if (typeof lucide !== "undefined") lucide.createIcons();

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
