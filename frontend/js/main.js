document.addEventListener("DOMContentLoaded", () => {
  // ── Session Guard (works on Vercel — uses localStorage, no server session needed) ──
  // If student is already logged in, send them straight to the dashboard.
  const _loggedIn  = localStorage.getItem("studentLoggedIn") === "true";
  const _rollNo    = localStorage.getItem("studentRollNo");
  const _name      = localStorage.getItem("studentName");
  if (_loggedIn && _rollNo && _name) {
    // Use replace() so the home page is NOT added to browser history.
    window.location.replace("/Dashboard/dashboard.html");
    return; // Stop all remaining JS — we are navigating away.
  }

  // Initialize Lucide Icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Cache elements
  const header = document.getElementById("header");
  const mobileToggle = document.getElementById("mobileToggle");
  const navMenu = document.getElementById("navMenu");
  const menuIcon = document.getElementById("menuIcon");
  const navLinks = document.querySelectorAll(".nav-link");

  // Modal elements
  const adminModal = document.getElementById("adminModal");
  const studentModal = document.getElementById("studentModal");
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const studentLoginBtn = document.getElementById("studentLoginBtn");
  const studentTriggers = document.querySelectorAll(".student-trigger");
  const closeBtns = document.querySelectorAll(".modal-close");
  const overlays = document.querySelectorAll(".modal-overlay");

  // Contact Form & Login Forms
  const contactForm = document.getElementById("contactForm");
  const studentLoginForm = document.getElementById("studentLoginForm");
  const adminLoginForm = document.getElementById("adminLoginForm");

  /* 1. Sticky Header & Elevation */
  const handleScroll = () => {
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };
  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Run once in case page loaded mid-way

  /* 2. Mobile Menu Toggle */
  mobileToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");

    // Toggle Lucide Menu/Close Icon
    if (navMenu.classList.contains("active")) {
      menuIcon.setAttribute("data-lucide", "x");
    } else {
      menuIcon.setAttribute("data-lucide", "menu");
    }
    lucide.createIcons();
  });

  // Close mobile menu when clicking nav link
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      menuIcon.setAttribute("data-lucide", "menu");
      lucide.createIcons();
    });
  });

  /* 3. Active Nav Scroll Spy */
  const sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    let scrollY = window.pageYOffset + 120; // offset header height

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop;
      const sectionId = current.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        document
          .querySelector(`.nav-link[href*=${sectionId}]`)
          ?.classList.add("active");
      } else {
        document
          .querySelector(`.nav-link[href*=${sectionId}]`)
          ?.classList.remove("active");
      }
    });
  });

  /* 4. Modals Open/Close Logic */
  const openModal = (modal) => {
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
  };

  const closeModal = (modal) => {
    modal.classList.remove("active");
    document.body.style.overflow = ""; // Restore scrolling
  };

  adminLoginBtn.addEventListener("click", () => openModal(adminModal));
  studentLoginBtn.addEventListener("click", () => openModal(studentModal));
  studentTriggers.forEach((btn) => {
    btn.addEventListener("click", () => openModal(studentModal));
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal(adminModal);
      closeModal(studentModal);
    });
  });

  overlays.forEach((overlay) => {
    overlay.addEventListener("click", () => {
      closeModal(adminModal);
      closeModal(studentModal);
    });
  });

  // Close modals on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(adminModal);
      closeModal(studentModal);
    }
  });

  // Auto-open student modal if a shared link redirected the user here
  if (localStorage.getItem("returnUrl")) {
    openModal(studentModal);
  }

  /* 5. Form Submission Handling with Premium Notifications */
  const showNotification = (message, type = "success") => {
    // Remove existing notification if present
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
    lucide.createIcons();

    // Animate in
    setTimeout(() => toast.classList.add("show"), 100);

    // Remove after 4s
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // Inject Toast CSS styles dynamically
  const style = document.createElement("style");
  style.innerHTML = `
        .toast-notification {
            position: fixed;
            bottom: -100px;
            right: 2rem;
            background: #ffffff;
            border-left: 5px solid var(--primary);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            z-index: 9999;
            transition: bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
            opacity: 0;
        }
        .toast-notification.show {
            bottom: 2rem;
            opacity: 1;
        }
        .toast-notification.error {
            border-left-color: var(--color-red);
        }
        .toast-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
        }
        .toast-content i {
            width: 1.25rem;
            height: 1.25rem;
        }
        .toast-notification.success i { color: var(--color-green); }
        .toast-notification.error i { color: var(--color-red); }
    `;
  document.head.appendChild(style);

  // Form submits
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName").value;
    showNotification(
      `Thank you, ${name}! Your message has been sent successfully.`,
    );
    contactForm.reset();
  });

  // Student Auth Logic
  const studentAuthForm = document.getElementById("studentAuthForm");
  const rollNoField = document.getElementById("rollNo");
  const studentNameField = document.getElementById("studentName");
  const studentPassword = document.getElementById("studentPassword");
  const studentConfirmPassword = document.getElementById("studentConfirmPassword");
  const nameGroup = document.getElementById("nameGroup");
  const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");
  const passwordRequirements = document.getElementById("passwordRequirements");
  const authModalTitle = document.getElementById("authModalTitle");
  const authModalSubtitle = document.getElementById("authModalSubtitle");
  const authSubmitBtnText = document.getElementById("authSubmitBtnText");
  const toggleAuthModeBtn = document.getElementById("toggleAuthMode");
  const authToggleText = document.getElementById("authToggleText");
  
  let isLoginMode = false;

  // ── Reusable function: switch the modal UI to Login mode ─────────────────────
  const switchToLoginMode = () => {
    isLoginMode = true;
    authModalTitle.textContent = "Welcome Back!";
    authModalSubtitle.textContent = "Login to access your account";
    nameGroup.style.display = "none";
    confirmPasswordGroup.style.display = "none";
    passwordRequirements.classList.remove("show");
    authSubmitBtnText.textContent = "Login";
    authToggleText.textContent = "Don't have an account?";
    toggleAuthModeBtn.textContent = "Create one here";
    studentNameField.removeAttribute("required");
    studentConfirmPassword.removeAttribute("required");
  };

  // ── Reusable function: switch the modal UI to Sign-up mode ───────────────────
  const switchToSignupMode = () => {
    isLoginMode = false;
    authModalTitle.textContent = "Create Account";
    authModalSubtitle.textContent = "Fill in your details to create your account";
    nameGroup.style.display = "block";
    confirmPasswordGroup.style.display = "block";
    if (studentPassword.value.length > 0) passwordRequirements.classList.add("show");
    authSubmitBtnText.textContent = "Create Account";
    authToggleText.textContent = "Already have an account?";
    toggleAuthModeBtn.textContent = "Login here";
    studentNameField.setAttribute("required", "required");
    studentConfirmPassword.setAttribute("required", "required");
  };

  // Toggle Auth Mode (Signup vs Login) via the link at the bottom
  if (toggleAuthModeBtn) {
    toggleAuthModeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (isLoginMode) {
        switchToSignupMode();
      } else {
        switchToLoginMode();
      }
    });
  }

  // Password Show/Hide Toggle
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.previousElementSibling;
      const icon = this.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye-off');
      }
      lucide.createIcons();
    });
  });

  // Password Requirements Logic
  if (studentPassword) {
    studentPassword.addEventListener('input', () => {
      if (!isLoginMode) {
        if (studentPassword.value.length > 0) {
          passwordRequirements.classList.add('show');
        } else {
          passwordRequirements.classList.remove('show');
        }
        
        const val = studentPassword.value;
        const reqLength = document.getElementById('req-length');
        const reqNumber = document.getElementById('req-number');
        const reqSpecial = document.getElementById('req-special');
        
        if (val.length >= 6) reqLength.classList.remove('invalid');
        else reqLength.classList.add('invalid');
        
        if (/[0-9]/.test(val)) reqNumber.classList.remove('invalid');
        else reqNumber.classList.add('invalid');
        
        if (/[!@#$%^&*(),.?":{}|<>]/.test(val)) reqSpecial.classList.remove('invalid');
        else reqSpecial.classList.add('invalid');
      }
    });
  }

  const postJson = async (path, payload) => {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }
    return data;
  };

  // Fetch Student Name by Roll No — also auto-switches to Login mode if account exists
  const fetchStudentNameByRoll = async (rollNo) => {
    if (!rollNo) return;
    // In login mode we still fill in the name for a nicer UX, but skip the password check
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/student/${encodeURIComponent(rollNo.trim())}`);
      if (!response.ok) {
        if (!isLoginMode) studentNameField.value = "";
        return;
      }
      const student = await response.json();
      // Always populate the name field (hidden in login mode, but harmless)
      studentNameField.value = student.name || "";

      if (student.hasPassword && !isLoginMode) {
        // ── This student already has an account → auto-switch to Login mode ──
        switchToLoginMode();
        showNotification(
          `Welcome back, ${student.name.trim()}! Please enter your password to login.`,
          "success"
        );
        // Move focus to the password field so the student can type immediately
        if (studentPassword) studentPassword.focus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (rollNoField) {
    rollNoField.addEventListener("blur", () => {
      fetchStudentNameByRoll(rollNoField.value.trim());
    });
  }

  // Form Submit
  if (studentAuthForm) {
    studentAuthForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const rollNo = rollNoField.value.trim();
      const password = studentPassword.value;
      const confirmPassword = studentConfirmPassword.value;

      if (!rollNo || !password) {
        showNotification("Please fill all required fields.", "error");
        return;
      }

      if (!isLoginMode) {
        // Signup Validation
        if (password !== confirmPassword) {
          showNotification("Passwords do not match.", "error");
          return;
        }
        if (password.length < 6 || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          showNotification("Password does not meet requirements.", "error");
          return;
        }

        try {
          const result = await postJson("/api/student/signup", { rollno: rollNo, password: password });
          showNotification("Account created successfully! Logging you in...", "success");
          
          localStorage.setItem("studentRollNo", rollNo);
          localStorage.setItem("studentName", result.name);
          localStorage.setItem("studentLoggedIn", "true");
          localStorage.removeItem("adminLoggedIn");
          localStorage.removeItem("adminUsername");
          
          closeModal(studentModal);
          
          const returnUrl = localStorage.getItem("returnUrl");
          if (returnUrl) {
            localStorage.removeItem("returnUrl");
            setTimeout(() => window.location.href = returnUrl, 1000);
          } else {
            setTimeout(() => window.location.href = "/Dashboard/dashboard.html", 1000);
          }
        } catch(error) {
          showNotification(error.message, "error");
        }
      } else {
        // Login Logic
        try {
          const result = await postJson("/api/student/login", { rollno: rollNo, password: password });
          showNotification("Login successful!", "success");
          
          localStorage.setItem("studentRollNo", result.rollno);
          localStorage.setItem("studentName", result.name);
          localStorage.setItem("studentLoggedIn", "true");
          localStorage.removeItem("adminLoggedIn");
          localStorage.removeItem("adminUsername");
          
          closeModal(studentModal);
          
          const returnUrl = localStorage.getItem("returnUrl");
          if (returnUrl) {
            localStorage.removeItem("returnUrl");
            setTimeout(() => window.location.href = returnUrl, 1000);
          } else {
            setTimeout(() => window.location.href = "/Dashboard/dashboard.html", 1000);
          }
        } catch(error) {
          showNotification(error.message, "error");
        }
      }
    });
  }

  adminLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("adminEmail").value;
    localStorage.setItem("adminLoggedIn", "true");
    localStorage.setItem("adminUsername", username || "Admin");
    localStorage.removeItem("studentRollNo");
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentLoggedIn");
    closeModal(adminModal);
    showNotification(
      `Welcome Admin! Redirecting to admin dashboard...`,
      "success",
    );
    adminLoginForm.reset();
    window.location.href = "/AdminDashboard/dashboard.html";
  });

  /* 6. Fetch and display actual PDF count on home page */
  const updateSubjectNoteCounts = async () => {
    try {
      const response = await fetch(window.API_BASE_URL + "/api/total-pdfs-count");
      const data = await response.json();

      if (data.success && data.total_pdfs !== undefined) {
        const totalPdfs = data.total_pdfs;

        // Base distribution of notes across subjects
        // This distributes the total PDFs proportionally across subjects
        const baseDistribution = {
          "Computer Science": 120,
          Mathematics: 98,
          Physics: 76,
          Chemistry: 64,
          Electronics: 58,
          Mechanical: 42,
        };

        const baseTotal = Object.values(baseDistribution).reduce(
          (a, b) => a + b,
          0,
        );

        // Update each subject card with proportional counts
        const subjectCards = document.querySelectorAll(".subject-card");
        subjectCards.forEach((card, index) => {
          const heading = card.querySelector("h3")?.textContent?.trim();
          const notesCountEl = card.querySelector(".notes-count");

          if (notesCountEl && heading && baseDistribution[heading]) {
            // Calculate proportional count
            const proportion = baseDistribution[heading] / baseTotal;
            const adjustedCount = Math.round(12 + totalPdfs * proportion);
            notesCountEl.textContent = `${adjustedCount} Notes`;
          }
        });
      }
    } catch (error) {
      console.error("Error fetching PDF count:", error);
      // Fallback: keep existing hardcoded values if API fails
    }
  };

  // Update counts on page load
  updateSubjectNoteCounts();

  /* 7. Dynamic Mouse Parallax / Move effect on subject cards */
  const subjectCards = document.querySelectorAll(".subject-card");
  subjectCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Subtly rotate and translate
      card.style.transform = `translateY(-5px) rotateX(${-y / 15}deg) rotateY(${x / 15}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
});
