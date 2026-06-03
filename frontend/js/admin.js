document.addEventListener("DOMContentLoaded", async () => {
  // 1. Authentication Guard
  const isAdminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
  const adminUsername = localStorage.getItem("adminUsername") || "Admin";

  if (!isAdminLoggedIn) {
    // Redirect back to root login page if not authenticated as Admin
    window.location.href = "/";
    return;
  }

  // Initialize Lucide Icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // 2. DOM Elements Cache
  const htmlEl = document.documentElement;
  const body = document.body;
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeIcon = document.getElementById("themeIcon");
  const userProfileBtn = document.getElementById("userProfileBtn");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeHeader = document.getElementById("welcomeHeader");
  const avatarLetter = document.getElementById("avatarLetter");
  const userNameDisplay = document.getElementById("userNameDisplay");

  // Stats elements
  const totalNotesStat = document.getElementById("totalNotesStat");
  const uploadedNotesStat = document.getElementById("uploadedNotesStat");
  const subjectsStat = document.getElementById("subjectsStat");

  // Filters & Notes Grid elements
  const searchInput = document.getElementById("searchInput");
  const filterPills = document.querySelectorAll(".filter-pill");
  const subjectSelect = document.getElementById("subjectSelect");
  const semesterSelect = document.getElementById("semesterSelect");
  const sortBySelect = document.getElementById("sortBySelect");
  const notesGrid = document.getElementById("notesGrid");

  // Sidebar items
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const homeSidebarBtn = document.getElementById("homeSidebarBtn");
  const allNotesSidebarBtn = document.getElementById("allNotesSidebarBtn");
  const uploadNotesSidebarBtn = document.getElementById(
    "uploadNotesSidebarBtn",
  );
  const favouritesSidebarBtn = document.getElementById("favouritesSidebarBtn");
  const downloadsSidebarBtn = document.getElementById("downloadsSidebarBtn");

  const welcomeSubheader = document.getElementById("welcomeSubheader");
  const statsContainer = document.getElementById("statsContainer");

  // Pagination elements
  const paginationText = document.getElementById("paginationText");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const paginationNumbers = document.getElementById("paginationNumbers");

  // Upload Modal elements
  const uploadModal = document.getElementById("uploadModal");
  const uploadModalOverlay = document.getElementById("uploadModalOverlay");
  const openUploadBtn = document.getElementById("openUploadBtn");
  const openUploadDropdownBtn = document.getElementById(
    "openUploadDropdownBtn",
  );
  const closeUploadModalBtn = document.getElementById("closeUploadModalBtn");
  const uploadNotesForm = document.getElementById("uploadNotesForm");

  // Subjects Modal elements
  const subjectsModal = document.getElementById("subjectsModal");
  const subjectsModalOverlay = document.getElementById("subjectsModalOverlay");
  const closeSubjectsModalBtn = document.getElementById(
    "closeSubjectsModalBtn",
  );
  const addSubjectBtn = document.getElementById("addSubjectBtn");
  const newSubjectInput = document.getElementById("newSubjectInput");
  const subjectsList = document.getElementById("subjectsList");
  const manageSubjectsSidebarBtn = document.getElementById(
    "manageSubjectsSidebarBtn",
  );

  // 3. Theme Toggle Implementation
  const currentTheme = localStorage.getItem("theme") || "light";
  if (currentTheme === "dark") {
    htmlEl.classList.add("dark-theme");
    if (themeIcon) themeIcon.setAttribute("data-lucide", "sun");
  } else {
    htmlEl.classList.remove("dark-theme");
    if (themeIcon) themeIcon.setAttribute("data-lucide", "moon");
  }
  if (typeof lucide !== "undefined") lucide.createIcons();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      htmlEl.classList.toggle("dark-theme");
      const isDark = htmlEl.classList.contains("dark-theme");
      localStorage.setItem("theme", isDark ? "dark" : "light");

      if (themeIcon) {
        themeIcon.setAttribute("data-lucide", isDark ? "sun" : "moon");
        lucide.createIcons();
      }
      showNotification(
        `Switched to ${isDark ? "Dark" : "Light"} theme`,
        "success",
      );
    });
  }

  // 4. Dynamic Welcome and User Info Setup
  const formatName = (str) => {
    return str
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formattedName = formatName(adminUsername);
  const firstLetter = adminUsername.trim().charAt(0).toUpperCase();

  if (welcomeHeader)
    welcomeHeader.innerText = `Welcome back, ${formattedName}! 👋`;
  if (avatarLetter) avatarLetter.innerText = firstLetter;
  if (userNameDisplay) userNameDisplay.innerText = formattedName;

  // 5. Profile Dropdown Menu & Logout
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
      // Clear local storage admin session info
      localStorage.removeItem("adminLoggedIn");
      localStorage.removeItem("adminUsername");

      showNotification("Logged out successfully. Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    });
  }

  // 6. Sidebar Hamburger Toggle (Mobile)
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // 6.1 Subject Management - Global state
  let subjects = [];

  async function fetchSubjects() {
    try {
      const response = await fetch("/api/subjects");
      const data = await response.json();
      if (data.success) {
        subjects = data.subjects;
        renderSubjectsList();
        renderCategorySidebar();
        populateSubjectSelects();
        // Cache subjects for other tabs (students) and notify via storage event
        try {
          localStorage.setItem("subjects_cache", JSON.stringify(subjects));
          localStorage.setItem("subjects_updated_at", Date.now().toString());
        } catch (e) {
          console.warn("Could not write subjects to localStorage:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  }

  async function addSubject() {
    const name = newSubjectInput.value.trim();
    if (!name) {
      showNotification("Please enter a subject name.", "error");
      return;
    }
    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (data.success) {
        newSubjectInput.value = "";
        showNotification("Subject added successfully!", "success");
        await fetchSubjects();
      } else {
        showNotification(data.error || "Failed to add subject.", "error");
      }
    } catch (error) {
      console.error("Error adding subject:", error);
      showNotification("Error adding subject.", "error");
    }
  }

  async function updateSubject(oldName, newName) {
    try {
      const response = await fetch(
        "/api/subjects/" + encodeURIComponent(oldName),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        },
      );
      const data = await response.json();
      if (data.success) {
        showNotification("Subject updated successfully!", "success");
        await fetchSubjects();
      } else {
        showNotification(data.error || "Failed to update subject.", "error");
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      showNotification("Error updating subject.", "error");
    }
  }

  window.deleteSubject = async function (name) {
    if (!confirm('Are you sure you want to delete "' + name + '"?')) return;
    try {
      const response = await fetch(
        "/api/subjects/" + encodeURIComponent(name),
        {
          method: "DELETE",
        },
      );
      const data = await response.json();
      if (data.success) {
        showNotification("Subject deleted successfully!", "success");
        await fetchSubjects();
      } else {
        showNotification(data.error || "Failed to delete subject.", "error");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      showNotification("Error deleting subject.", "error");
    }
  };

  function renderSubjectsList() {
    if (!subjectsList) return;
    subjectsList.innerHTML = subjects
      .map(function (subject) {
        return (
          '<li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--border);"><span>' +
          subject.name +
          '</span><div style="display: flex; gap: 0.5rem;"><button onclick="editSubject(\'' +
          subject.name +
          '\')" style="background: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.25rem 0.5rem; cursor: pointer;"><i data-lucide="edit-2" style="width: 1rem; height: 1rem;"></i></button><button onclick="deleteSubject(\'' +
          subject.name +
          '\')" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); padding: 0.25rem 0.5rem; cursor: pointer; color: #ef4444;"><i data-lucide="trash-2" style="width: 1rem; height: 1rem;"></i></button></div></li>'
        );
      })
      .join("");
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  function renderCategorySidebar() {
    var categoryList = document.getElementById("categoryList");
    if (!categoryList) return;
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
  }

  function populateSubjectSelects() {
    if (subjectSelect) {
      subjectSelect.innerHTML =
        '<option value="all">All Subjects</option>' +
        subjects
          .map(function (s) {
            return '<option value="' + s.name + '">' + s.name + "</option>";
          })
          .join("");
    }
    var uploadSubject = document.getElementById("uploadSubject");
    if (uploadSubject) {
      uploadSubject.innerHTML = subjects
        .map(function (s) {
          return '<option value="' + s.name + '">' + s.name + "</option>";
        })
        .join("");
    }
  }

  window.editSubject = function (oldName) {
    var newName = prompt("Enter new subject name:", oldName);
    if (newName && newName.trim() && newName !== oldName) {
      updateSubject(oldName, newName.trim());
    }
  };

  // 7. Mock Notes Data Provider
  const notesData = [];

  // 8. Session Storage/LocalStorage State
  const favKey = "userFavs_admin";
  const downloadKey = "userDownloads_admin";
  const seededFavsKey = "seededFavs_admin";
  const seededDownloadsKey = "seededDownloads_admin";

  let userFavs = JSON.parse(localStorage.getItem(favKey) || "[]");
  let userDownloads = JSON.parse(localStorage.getItem(downloadKey) || "[]");

  // If empty in localStorage, seed with starting entries
  if (userFavs.length === 0 && localStorage.getItem(seededFavsKey) !== "true") {
    userFavs = [];
    localStorage.setItem(favKey, JSON.stringify(userFavs));
    localStorage.setItem(seededFavsKey, "true");
  }

  if (
    userDownloads.length === 0 &&
    localStorage.getItem(seededDownloadsKey) !== "true"
  ) {
    userDownloads = [];
    localStorage.setItem(downloadKey, JSON.stringify(userDownloads));
    localStorage.setItem(seededDownloadsKey, "true");
  }

  // Load custom notes uploaded by admin from backend API
  let uploadedNotesCache = [];
  let uploadedNotesTimestamp = 0;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async function fetchUploadedNotes() {
    try {
      const response = await fetch("/api/uploaded-pdfs");
      if (!response.ok) {
        throw new Error("Failed to fetch uploaded notes");
      }
      const data = await response.json();
      if (data.success) {
        const merged = data.files.map((file) => {
          return {
            id: file.filename,
            title: file.title || file.original_name.replace(".pdf", ""),
            category: file.category || "Uploaded Notes",
            catClass: file.catClass || "cs",
            author: file.author || "Admin",
            uploaded: file.uploaded,
            recent: true,
            semester: file.semester || "N/A",
            fileName: file.filename,
          };
        });

        return merged;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error fetching uploaded notes:", error);
      return Date.now() - uploadedNotesTimestamp < CACHE_DURATION
        ? uploadedNotesCache
        : [];
    }
  }

  const getCombinedNotes = async () => {
    if (
      Date.now() - uploadedNotesTimestamp < CACHE_DURATION &&
      uploadedNotesCache.length > 0
    ) {
      return [...uploadedNotesCache, ...notesData];
    }

    const fetchedNotes = await fetchUploadedNotes();
    uploadedNotesCache = fetchedNotes;
    uploadedNotesTimestamp = Date.now();

    return [...fetchedNotes, ...notesData];
  };

  // 9. Update Dashboard Stats Cards
  const updateStats = async () => {
    const allNotes = await getCombinedNotes();

    let totalPdfCount = 0;
    try {
      const response = await fetch("/api/total-pdfs-count");
      const data = await response.json();
      if (data.success) {
        totalPdfCount = data.total_pdfs;
      }
    } catch (error) {
      console.error("Error fetching total PDF count:", error);
      totalPdfCount = allNotes.filter((n) => n.fileName).length;
    }

    if (totalNotesStat) {
      totalNotesStat.innerText = totalPdfCount;
    }
    if (uploadedNotesStat) {
      uploadedNotesStat.innerText = allNotes.filter((n) => n.fileName).length;
    }
    if (subjectsStat) {
      subjectsStat.innerText = subjects.length;
    }
  };

  await updateStats();

  // 10. Core Interactions (Downloads, Share, View, Delete, Favorites)
  window.toggleFavorite = async (id) => {
    const index = userFavs.indexOf(id);
    const notes = await getCombinedNotes();
    const note = notes.find((n) => n.id === id);
    if (index > -1) {
      userFavs.splice(index, 1);
      showNotification(`Removed "${note.title}" from Favourites`, "success");
    } else {
      userFavs.push(id);
      showNotification(`Added "${note.title}" to Favourites`, "success");
    }
    localStorage.setItem(favKey, JSON.stringify(userFavs));
    renderNotes();
  };

  window.triggerDownload = async (id) => {
    const notes = await getCombinedNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const isUploadedWithPDF = Boolean(note.fileName);

    if (!userDownloads.includes(id)) {
      userDownloads.push(id);
      localStorage.setItem(downloadKey, JSON.stringify(userDownloads));
    }

    if (isUploadedWithPDF) {
      // For uploaded PDFs, redirect to the actual file
      window.open(`/uploads/${note.fileName}`, "_blank");
      showNotification(`Downloading "${note.title}" PDF...`, "success");
    } else {
      // Create virtual download file for premium feel
      const noteContent =
        `==============================================\n` +
        `          NOTES LIBRARY STUDY DOCUMENT        \n` +
        `==============================================\n\n` +
        `Title: ${note.title}\n` +
        `Subject/Category: ${note.category}\n` +
        `Semester: ${note.semester}\n` +
        `Uploader: ${note.author}\n` +
        `Downloaded By: Admin\n\n` +
        `----------------------------------------------\n` +
        `STUDY CONTENT MODULES:\n` +
        `1. Introduction and Core Definitions\n` +
        `2. Essential Theorems and Mathematical Formulae\n` +
        `3. Practical Application Models and Case Studies\n` +
        `4. Practice Problems and Solved Explanations\n\n` +
        `Notes Library Copyright (c) 2026. All rights reserved.\n`;

      const blob = new Blob([noteContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title.replace(/\s+/g, "_")}_Notes.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification(`Downloading "${note.title}" as PDF Note...`, "success");
    }

    renderNotes();
  };

  window.shareNote = async (id) => {
    const notes = await getCombinedNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const shareLink = `${window.location.origin}/Dashboard/AllNotes.html?id=${id}`;
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

  // Delete custom uploaded notes
  window.deleteNote = async (id) => {
    const notes = await getCombinedNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) {
      showNotification("Note not found.", "error");
      return;
    }

    if (!note.fileName) {
      showNotification("System notes cannot be deleted.", "error");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/delete-pdf/${encodeURIComponent(note.fileName)}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        showNotification(
          `Failed to delete: ${data.error || "Unknown error"}`,
          "error",
        );
        return;
      }

      showNotification("PDF deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting file:", error);
      showNotification("Error deleting file. Please try again.", "error");
      return;
    }

    uploadedNotesTimestamp = 0; // Invalidate cache

    if (userFavs.includes(id)) {
      userFavs = userFavs.filter((fid) => fid !== id);
      localStorage.setItem(favKey, JSON.stringify(userFavs));
    }
    if (userDownloads.includes(id)) {
      userDownloads = userDownloads.filter((did) => did !== id);
      localStorage.setItem(downloadKey, JSON.stringify(userDownloads));
    }

    updateStats();
    renderNotes();
  };

  // View Modal Preview Setup
  window.viewNoteDetails = async (id) => {
    const notes = await getCombinedNotes();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    // Create modal container dynamically
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "previewModal";

    const isUploadedWithPDF = Boolean(note.fileName);

    modal.innerHTML = `
            <div class="modal-overlay" onclick="closePreviewModal()"></div>
            <div class="modal-content" style="max-width: 800px; padding: 2rem; background-color: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); max-height: calc(100vh - 80px); overflow-y: auto;">
                <button class="modal-close" onclick="closePreviewModal()">&times;</button>
                <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
                     <div class="pdf-badge">
                        <i data-lucide="file-text" style="width:1.75rem; height:1.75rem;"></i>
                    </div>
                    <div>
                        <span class="category-tag ${note.catClass}" style="margin-bottom:0.35rem;">${note.category}</span>
                        <h2 style="font-size: 1.35rem; line-height: 1.3;">${note.title}</h2>
                    </div>
                </div>
                ${
                  isUploadedWithPDF
                    ? `
                <div style="background-color: var(--bg-main); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; max-height: calc(100vh - 240px); overflow-y: auto;">
                    <h4 style="font-size: 0.9rem; text-transform: uppercase; color: var(--text-light); margin-bottom: 0.5rem; letter-spacing: 0.05em;">PDF Preview</h4>
                    <iframe src="/uploads/${note.fileName}" width="100%" height="500" scrolling="yes" style="border: 1px solid var(--border); border-radius: var(--radius-md); min-height: 400px; max-height: 500px; overflow: auto;"></iframe>
                </div>
                `
                    : ""
                }
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                    <div><strong>Uploader:</strong> ${note.author}</div>
                    <div><strong>Sem/Class:</strong> ${note.semester}</div>
                    <div><strong>Added:</strong> ${note.uploaded}</div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-primary" style="flex:1;" onclick='closePreviewModal(); triggerDownload(${JSON.stringify(note.id)})'>
                        <i data-lucide="download" style="width:1.2rem; height:1.2rem;"></i> Download PDF
                    </button>
                    <button class="btn btn-outline" onclick='shareNote(${JSON.stringify(note.id)})'>
                        <i data-lucide="share-2" style="width:1.2rem; height:1.2rem;"></i> Share Link
                    </button>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
    if (typeof lucide !== "undefined") lucide.createIcons();
    document.body.style.overflow = "hidden";
  };

  window.closePreviewModal = () => {
    const modal = document.getElementById("previewModal");
    if (modal) {
      modal.remove();
    }
    document.body.style.overflow = "";
  };

  // 11. Search & Filter Parameters State & View State
  let currentPage = 1;
  const cardsPerPage = 8;
  let activeFilterPill = "all"; // all, recent
  let activeCategory = "all"; // all, Computer Science, Mathematics, etc.
  let searchQuery = "";
  let activeSemester = "all";
  let viewState = "home"; // home, all_notes, my_fav, my_downloads

  // Sidebar navigation active highlight
  const updateSidebarActive = (activeBtn) => {
    if (homeSidebarBtn) homeSidebarBtn.classList.remove("active");
    if (allNotesSidebarBtn) allNotesSidebarBtn.classList.remove("active");
    if (favouritesSidebarBtn) favouritesSidebarBtn.classList.remove("active");
    if (downloadsSidebarBtn) downloadsSidebarBtn.classList.remove("active");
    const sfBtn = document.getElementById("studentFeedbackSidebarBtn");
    if (sfBtn) sfBtn.classList.remove("active");

    const categoryLinks = document.querySelectorAll(
      ".sidebar-link[data-category]",
    );
    categoryLinks.forEach((link) => link.classList.remove("active"));

    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  };

  const changeView = async (newViewState) => {
    viewState = newViewState;
    currentPage = 1;

    // Reset category and search filters when switching main views for clean UX
    activeCategory = "all";
    searchQuery = "";
    activeSemester = "all";
    if (searchInput) searchInput.value = "";
    if (subjectSelect) subjectSelect.value = "all";
    if (semesterSelect) semesterSelect.value = "all";

    if (viewState === "home") {
      if (welcomeHeader)
        welcomeHeader.innerText = `Welcome back, ${formattedName}! 👋`;
      if (welcomeSubheader)
        welcomeSubheader.innerText =
          "Access the administrative dashboard to manage study materials.";
      if (statsContainer) statsContainer.style.display = "flex";
      updateSidebarActive(homeSidebarBtn);
    } else if (viewState === "all_notes") {
      if (welcomeHeader) welcomeHeader.innerText = "All Study Notes";
      if (welcomeSubheader)
        welcomeSubheader.innerText =
          "Browse through the complete list of academic PDFs uploaded by your professors.";
      if (statsContainer) statsContainer.style.display = "none";
      updateSidebarActive(allNotesSidebarBtn);
    } else if (viewState === "my_fav") {
      if (welcomeHeader) welcomeHeader.innerText = "My Favourites";
      if (welcomeSubheader)
        welcomeSubheader.innerText =
          "Your handpicked selection of key study guides and reference sheets.";
      if (statsContainer) statsContainer.style.display = "none";
      updateSidebarActive(favouritesSidebarBtn);
    } else if (viewState === "my_downloads") {
      if (welcomeHeader) welcomeHeader.innerText = "My Downloads";
      if (welcomeSubheader)
        welcomeSubheader.innerText =
          "Access your offline-saved PDFs and study materials.";
      if (statsContainer) statsContainer.style.display = "none";
      updateSidebarActive(downloadsSidebarBtn);
    } else if (viewState === "student_feedback") {
      if (welcomeHeader) welcomeHeader.innerText = "Student Feedback";
      if (welcomeSubheader) welcomeSubheader.innerText = "View what students are saying.";
      if (statsContainer) statsContainer.style.display = "none";
      updateSidebarActive(document.getElementById("studentFeedbackSidebarBtn"));
    }

    const filterBar = document.querySelector(".filter-bar");
    const paginationContainer = document.querySelector(".pagination-container");
    const feedbackView = document.getElementById("feedbackView");

    if (viewState === "student_feedback") {
      if (filterBar) filterBar.style.display = "none";
      if (notesGrid) notesGrid.style.display = "none";
      if (paginationContainer) paginationContainer.style.display = "none";
      if (feedbackView) {
        feedbackView.style.display = "block";
        loadFeedbackData();
      }
    } else {
      if (filterBar) filterBar.style.display = "flex";
      if (notesGrid) notesGrid.style.display = "grid";
      if (paginationContainer) paginationContainer.style.display = "flex";
      if (feedbackView) feedbackView.style.display = "none";
    }

    await renderNotes();
  };

  // 12. Render notes grid matching filters and pagination
  const renderNotes = async () => {
    if (!notesGrid) return;

    let filtered = await getCombinedNotes();

    // Filter by View State
    if (viewState === "my_fav") {
      filtered = filtered.filter((note) => userFavs.includes(note.id));
    } else if (viewState === "my_downloads") {
      filtered = filtered.filter((note) => userDownloads.includes(note.id));
    }

    // Filter by Pill (All, Recent)
    if (activeFilterPill === "recent") {
      filtered = filtered.filter((note) => note.recent);
    }

    // Filter by Sidebar Category
    if (activeCategory !== "all") {
      filtered = filtered.filter(
        (note) => note.category.toLowerCase() === activeCategory.toLowerCase(),
      );
    }

    // Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.category.toLowerCase().includes(query),
      );
    }

    // Filter by Semester Select
    if (activeSemester !== "all") {
      filtered = filtered.filter(
        (note) => note.semester.toLowerCase() === activeSemester.toLowerCase(),
      );
    }

    // Filter by Subject Dropdown (if selected)
    if (subjectSelect && subjectSelect.value !== "all") {
      filtered = filtered.filter(
        (note) =>
          note.category.toLowerCase() === subjectSelect.value.toLowerCase(),
      );
    }

    // Sort Notes
    const sortBy = sortBySelect ? sortBySelect.value : "latest";
    if (sortBy === "a-z") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "z-a") {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else {
      filtered.sort((a, b) => {
        const getSortKey = (item) => {
          if (typeof item.id === "number") return item.id;
          const parts = item.id.split("_");
          const timestamp = Number(parts[0]);
          return Number.isFinite(timestamp) ? timestamp : item.id;
        };
        const aKey = getSortKey(a);
        const bKey = getSortKey(b);
        if (typeof aKey === "number" && typeof bKey === "number") {
          return bKey - aKey;
        }
        return bKey.toString().localeCompare(aKey.toString());
      });
    }

    // Handle empty state
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

    // Paginate
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / cardsPerPage);

    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, totalItems);
    const paginatedNotes = filtered.slice(startIndex, endIndex);

    // Render Cards with Student UI Style (favorite and downloads sync)
    notesGrid.innerHTML = paginatedNotes
      .map((note) => {
        const isCustom = Boolean(note.fileName);
        const isFav = userFavs.includes(note.id);
        const isDownloaded = userDownloads.includes(note.id);
        return `
                <div class="note-card">
                    <div class="note-card-header">
                        <div class="pdf-badge">
                            <i data-lucide="file-text"></i>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            ${
                              isCustom
                                ? `
                                <button class="btn-fav" onclick='deleteNote(${JSON.stringify(note.id)})' aria-label="Delete uploaded note" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05);" onmouseover="this.style.background='rgba(239,68,68,0.15)'" onmouseout="this.style.background='rgba(239,68,68,0.05)'>
                                  <i data-lucide="trash-2"></i>
                                </button>`
                                : ""
                            }
                                <button class="btn-fav ${isFav ? "active" : ""}" onclick='toggleFavorite(${JSON.stringify(note.id)})' aria-label="Favourite note">
                                <i data-lucide="heart"></i>
                            </button>
                        </div>
                    </div>
                    <div class="note-card-body">
                        <span class="category-tag ${note.catClass}">${note.category}</span>
                        <h3 class="note-title" onclick='viewNoteDetails(${JSON.stringify(note.id)})'>${note.title}</h3>
                        <div class="note-author-info">
                            <div class="author-avatar" style="background-color: var(--primary); color: white;">${note.author.charAt(0)}</div>
                            <span class="author-name">${note.author}</span>
                            <span class="upload-time">${note.uploaded}</span>
                        </div>
                    </div>
                    <div class="note-card-footer">
                        <button class="card-action-btn" onclick='viewNoteDetails(${JSON.stringify(note.id)})'>
                            <i data-lucide="eye"></i> View
                        </button>
                        <button class="card-action-btn download-btn" onclick='triggerDownload(${JSON.stringify(note.id)})'>
                            <i data-lucide="${isDownloaded ? "check-circle" : "download"}"></i> 
                            ${isDownloaded ? "Downloaded" : "Download"}
                        </button>
                        <button class="card-action-btn" onclick='shareNote(${JSON.stringify(note.id)})'>
                            <i data-lucide="share-2"></i> Share
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");

    if (typeof lucide !== "undefined") lucide.createIcons();

    // Update Pagination Text
    if (paginationText) {
      if (
        (viewState === "home" || viewState === "all_notes") &&
        searchQuery === "" &&
        activeCategory === "all" &&
        activeSemester === "all" &&
        (!subjectSelect || subjectSelect.value === "all")
      ) {
        const allNotes = await getCombinedNotes();
        paginationText.innerText = `Showing ${startIndex + 1} to ${endIndex} of ${allNotes.length} notes`;
      } else {
        paginationText.innerText = `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} notes`;
      }
    }

    updatePaginationControls(totalPages);
  };

  // 13. Pagination controls drawing
  const updatePaginationControls = (totalPages) => {
    if (!paginationNumbers) return;

    if (totalPages <= 1) {
      if (prevPageBtn) prevPageBtn.classList.add("disabled");
      if (nextPageBtn) nextPageBtn.classList.add("disabled");
      paginationNumbers.innerHTML = `<button class="page-btn active">1</button>`;
      return;
    }

    if (prevPageBtn) {
      if (currentPage === 1) prevPageBtn.classList.add("disabled");
      else prevPageBtn.classList.remove("disabled");
    }

    if (nextPageBtn) {
      if (currentPage === totalPages) nextPageBtn.classList.add("disabled");
      else nextPageBtn.classList.remove("disabled");
    }

    let buttonsHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      if (
        totalPages > 5 &&
        Math.abs(i - currentPage) > 1 &&
        i !== 1 &&
        i !== totalPages
      ) {
        if (i === 2 && currentPage > 3)
          buttonsHTML += `<span style="padding:0 0.5rem; color:var(--text-light)">...</span>`;
        if (i === totalPages - 1 && currentPage < totalPages - 2)
          buttonsHTML += `<span style="padding:0 0.5rem; color:var(--text-light)">...</span>`;
        continue;
      }
      buttonsHTML += `<button class="page-btn ${currentPage === i ? "active" : ""}" onclick="changePage(${i})">${i}</button>`;
    }

    paginationNumbers.innerHTML = buttonsHTML;
  };

  window.changePage = async (page) => {
    currentPage = page;
    await renderNotes();
    document.querySelector(".main-wrapper").scrollTop = 0;
  };

  if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) changePage(currentPage - 1);
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", async () => {
      let filtered = await getCombinedNotes();
      if (viewState === "my_fav")
        filtered = filtered.filter((n) => userFavs.includes(n.id));
      else if (viewState === "my_downloads")
        filtered = filtered.filter((n) => userDownloads.includes(n.id));
      if (activeFilterPill === "recent")
        filtered = filtered.filter((n) => n.recent);
      if (activeCategory !== "all")
        filtered = filtered.filter(
          (n) => n.category.toLowerCase() === activeCategory.toLowerCase(),
        );
      if (searchQuery)
        filtered = filtered.filter((n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      if (activeSemester !== "all")
        filtered = filtered.filter(
          (n) => n.semester.toLowerCase() === activeSemester.toLowerCase(),
        );
      if (subjectSelect && subjectSelect.value !== "all")
        filtered = filtered.filter(
          (n) => n.category.toLowerCase() === subjectSelect.value.toLowerCase(),
        );

      const totalPages = Math.ceil(filtered.length / cardsPerPage);
      if (currentPage < totalPages) changePage(currentPage + 1);
    });
  }

  // 14. Event Listeners for Filters & Search
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
    subjectSelect.addEventListener("change", (e) => {
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
    sortBySelect.addEventListener("change", () => {
      renderNotes();
    });
  }

  // Sidebar Category Filter
  const categoryLinks = document.querySelectorAll(
    ".sidebar-link[data-category]",
  );
  categoryLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      updateSidebarActive(link);
      activeCategory = link.dataset.category;
      currentPage = 1;

      if (subjectSelect) {
        subjectSelect.value = activeCategory;
      }

      renderNotes();

      if (window.innerWidth <= 900) {
        sidebar.classList.remove("active");
      }
    });
  });

  // Control Panel Button Handlers
  if (homeSidebarBtn) {
    homeSidebarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      changeView("home");
    });
  }

  if (allNotesSidebarBtn) {
    allNotesSidebarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      changeView("all_notes");
    });
  }

  if (uploadNotesSidebarBtn) {
    uploadNotesSidebarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (favouritesSidebarBtn) {
    favouritesSidebarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      changeView("my_fav");
    });
  }

  if (downloadsSidebarBtn) {
    downloadsSidebarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      changeView("my_downloads");
    });
  }

  if (manageSubjectsSidebarBtn) {
    manageSubjectsSidebarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openSubjectsModal();
    });
  }

  const sfBtn = document.getElementById("studentFeedbackSidebarBtn");
  if (sfBtn) {
    sfBtn.addEventListener("click", (e) => {
      e.preventDefault();
      changeView("student_feedback");
    });
  }

  // Load Feedback Data
  async function loadFeedbackData() {
    const container = document.getElementById("feedbackChatContainer");
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">Loading feedback...</div>';
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      if (data.success) {
        if (data.feedback.length === 0) {
          container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">No feedback received yet.</div>';
          return;
        }
        
        container.innerHTML = data.feedback.map(fb => {
          const isMe = false; // Add your logic if needed
          const dateStr = new Date(fb.timestamp).toLocaleString();
          return `
            <div class="chat-bubble ${isMe ? 'admin' : ''}">
              <div class="chat-header">
                <span class="chat-name">${fb.name}</span>
                <span class="chat-rollno">${fb.rollno || 'Unknown'}</span>
                <span class="chat-time">${dateStr}</span>
              </div>
              <div class="chat-body">${fb.description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
            </div>
          `;
        }).join("");
        // scroll to bottom
        container.scrollTop = container.scrollHeight;
      } else {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">Failed to load feedback.</div>';
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">Error loading feedback.</div>';
    }
  }

  const openSubjectsModal = () => {
    if (subjectsModal) subjectsModal.classList.add("active");
    body.style.overflow = "hidden";
  };

  const closeSubjectsModal = () => {
    if (subjectsModal) subjectsModal.classList.remove("active");
    body.style.overflow = "";
  };

  if (closeSubjectsModalBtn) {
    closeSubjectsModalBtn.addEventListener("click", closeSubjectsModal);
  }
  if (subjectsModalOverlay) {
    subjectsModalOverlay.addEventListener("click", closeSubjectsModal);
  }
  if (addSubjectBtn) {
    addSubjectBtn.addEventListener("click", addSubject);
  }

  // Escape Key Modal Dismissal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closePreviewModal();
      closeSubjectsModal();
    }
  });
  const openModal = () => {
    uploadModal.classList.add("active");
    body.style.overflow = "hidden";
  };

  const closeModal = () => {
    uploadModal.classList.remove("active");
    body.style.overflow = "";
    uploadNotesForm.reset();
  };

  if (openUploadBtn) openUploadBtn.addEventListener("click", openModal);
  if (openUploadDropdownBtn)
    openUploadDropdownBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  if (closeUploadModalBtn)
    closeUploadModalBtn.addEventListener("click", closeModal);
  if (uploadModalOverlay)
    uploadModalOverlay.addEventListener("click", closeModal);

  // Escape Key Modal Dismissal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closePreviewModal();
    }
  });

  // Subject mapping to CSS tags - dynamic based on subjects
  const getCategoryClass = (subject) => {
    const subjectObj = subjects.find((s) => s.name === subject);
    return subjectObj
      ? subjectObj.class
      : subject.toLowerCase().replace(/\s+/g, "-");
  };

  // Upload Form Submit Handler
  if (uploadNotesForm) {
    uploadNotesForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("uploadTitle").value.trim();
      const subject = document.getElementById("uploadSubject").value;
      const semester = document.getElementById("uploadSemester").value;
      const fileInput = document.getElementById("uploadFile");

      if (
        !title ||
        !subject ||
        !semester ||
        !fileInput.files.length
      ) {
        showNotification(
          "Please fill in all fields and select a PDF file.",
          "error",
        );
        return;
      }

      const file = fileInput.files[0];

      // Show loading state
      const submitBtn = uploadNotesForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i data-lucide="loader" style="width:1rem; height:1rem;"></i> Uploading...';
      if (typeof lucide !== "undefined") lucide.createIcons();

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("subject", subject);
        formData.append("semester", semester);

        // Upload to backend API
        const response = await fetch("/api/upload-pdf", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Upload failed");
        }

        // Create upload notes object with backend filename
        const newNote = {
          id: result.filename,
          title: title,
          category: subject,
          catClass: getCategoryClass(subject),
          author: "Admin",
          uploaded: "Just now",
          recent: true,
          semester: semester,
          fileName: result.filename, // Use the filename from backend
        };

        // Invalidate cache so the newly uploaded file is fetched from the backend immediately
        uploadedNotesTimestamp = 0;

        showNotification(`Notes "${title}" uploaded successfully!`, "success");
        closeModal();
        await updateStats();
        await renderNotes();
      } catch (error) {
        console.error("Upload error:", error);
        showNotification(
          error.message || "Failed to upload PDF. Please try again.",
          "error",
        );
      } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    });
  }

  // Initialize Notes Render
  await fetchSubjects();
  await updateStats();
  await renderNotes();
});

// Premium toast notification helper
function showNotification(message, type = "success") {
  const oldNotify = document.querySelector(".toast-notification");
  if (oldNotify) oldNotify.remove();

  const toast = document.createElement("div");
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
        <div class="toast-content">
            <i data-lucide="${type === "success" ? "check-circle" : "alert-circle"}"></i>
            <span>${message}</span>
        </div>
    `;
  document.body.appendChild(toast);

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Animate slide-in
  setTimeout(() => toast.classList.add("show"), 100);

  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
