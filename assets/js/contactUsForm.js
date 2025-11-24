const emailAddressSmtp = "techvivanta.app@gmail.com"

document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------
     Step & Progress Handling
  ------------------------- */
  const steps = document.querySelectorAll(".step");
  const stepContents = document.querySelectorAll(".step-content");
  const nextBtn = document.querySelector(
    ".controls .btn-outline-primary:nth-of-type(2)"
  );
  const prevBtn = document.querySelector(
    ".controls .btn-outline-primary:nth-of-type(1)"
  );

  let currentStep = 1;

  const updateSteps = () => {
    steps.forEach((el, index) => {
      el.classList.toggle("active", index + 1 === currentStep);
    });
    stepContents.forEach((content, index) => {
      content.style.display = index + 1 === currentStep ? "block" : "none";
    });

    prevBtn.style.display = currentStep === 1 ? "none" : "inline-block";
    nextBtn.textContent = currentStep === steps.length ? "Submit" : "Next";
  };

  updateSteps();

  /* -------------------------
     Step 1: Service Selection
  ------------------------- */
  const serviceCards = document.querySelectorAll(
    "#serviceSection .custom-select-1"
  );
  let selectedServices = [];

  serviceCards.forEach((card) => {
    card.addEventListener("click", () => {
      const checkbox = card.querySelector("input[type='checkbox']");
      const serviceName = card
        .querySelector("p.text-center:last-child")
        .innerText.trim();

      checkbox.checked = !checkbox.checked;
      card.classList.toggle("selected", checkbox.checked);

      if (checkbox.checked) {
        selectedServices.push(serviceName);
      } else {
        selectedServices = selectedServices.filter((s) => s !== serviceName);
      }
      checkStepValidity();
    });
  });

  /* -------------------------
     Step 2: Project Stage
  ------------------------- */
  const stageCards = document.querySelectorAll(
    "#serviceSection2 .custom-select-2"
  );
  let selectedStage = "";

  stageCards.forEach((card) => {
    card.addEventListener("click", () => {
      stageCards.forEach((c) => {
        c.classList.remove("selected");
        c.querySelector("input[type='radio']").checked = false;
      });
      const radio = card.querySelector("input[type='radio']");
      const name = card.querySelector("p.user-select-none").innerText.trim();
      radio.checked = true;
      card.classList.add("selected");
      selectedStage = name;
      checkStepValidity();
    });
  });

  /* -------------------------
     Step 3: Project Description + Files
  ------------------------- */
  const textarea = document.getElementById("textarea-input");
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  let uploadedFiles = [];

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () =>
    dropZone.classList.remove("dragover")
  );
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

  const handleFiles = (files) => {
    fileList.innerHTML = "";
    uploadedFiles = [];
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds 10MB limit.`);
        return;
      }
      uploadedFiles.push(file);
      const li = document.createElement("li");
      li.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(
        2
      )} MB)`;
      fileList.appendChild(li);
    });
    checkStepValidity();
  };

  /* -------------------------
     Step 4: Form Fields (Fixed selectors)
  ------------------------- */
  const form = document.querySelector("#contactForm");
  const nameInput = document.getElementById("name");
  const company = document.getElementById("company");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const country = document.getElementById("country");
  const budget = document.getElementById("budget");

  const validateForm = () => {
    let valid = true;
    const resetError = (el) => {
      if (el) {
        el.classList.remove("is-invalid");
        const errorDiv = el.parentElement.querySelector(".invalid-feedback");
        if (errorDiv) errorDiv.remove();
      }
    };

    const showError = (el, message) => {
      if (el) {
        el.classList.add("is-invalid");
        valid = false;

        let errorDiv = el.parentElement.querySelector(".invalid-feedback");
        if (!errorDiv) {
          errorDiv = document.createElement("div");
          errorDiv.className = "invalid-feedback";
          el.parentElement.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
      }
    };

    [nameInput, company, email, phone, country, budget].forEach(resetError);

    if (!nameInput.value.trim() || !/^[a-zA-Z\s]{2,50}$/.test(nameInput.value.trim())) {
      showError(nameInput, "Name must be 2-50 characters and contain only letters");
    }

    if (!company.value.trim() || company.value.trim().length < 2 || company.value.trim().length > 100) {
      showError(company, "Company name must be 2-100 characters");
    }

    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showError(email, "Please enter a valid email address");
    }

    if (!phone.value.trim() || !/^[0-9]{7,15}$/.test(phone.value.trim())) {
      showError(phone, "Phone number must be 7-15 digits");
    }

    if (!country.value.trim() || country.value.trim().length < 2) {
      showError(country, "Please enter your country");
    }

    if (!budget.value.trim() || !/^[0-9]+(\.[0-9]{1,2})?$/.test(budget.value.trim())) {
      showError(budget, "Please enter a valid budget amount");
    }
    return valid;
  };

  /* -------------------------
     Validation Check per Step
  ------------------------- */
  const checkStepValidity = () => {
    let valid = false;
    switch (currentStep) {
      case 1:
        valid = selectedServices.length > 0;
        break;
      case 2:
        valid = !!selectedStage;
        break;
      case 3:
        valid = textarea.value.trim().length >= 10;
        break;
      case 4:
        valid = validateForm();
        break;
    }
    nextBtn.disabled = !valid;
  };

  if (textarea) textarea.addEventListener("input", checkStepValidity);
  if (form) {
    form.addEventListener("input", checkStepValidity);
    form.addEventListener("change", checkStepValidity);
  };

  /* -------------------------
     Step Navigation and Submission
  ------------------------- */
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      return false;
    });
  }

  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep === steps.length) {
      if (validateForm()) {
        // Build mail body and subject for mailto link
        let body = "";
        body += "Name: " + nameInput.value.trim() + "%0D%0A";
        body += "Company: " + company.value.trim() + "%0D%0A";
        body += "Email: " + email.value.trim() + "%0D%0A";
        body += "Phone: " + phone.value.trim() + "%0D%0A";
        body += "Country: " + country.value.trim() + "%0D%0A";
        body += "Budget: " + budget.value.trim() + "%0D%0A";
        body += "Services: " + selectedServices.join(", ") + "%0D%0A";
        body += "Project Stage: " + selectedStage + "%0D%0A";
        body += "Project Description: " + textarea.value.trim() + "%0D%0A";
        if (uploadedFiles && uploadedFiles.length > 0) {
          body += "Uploaded Files: " + uploadedFiles.map(f => f.name).join(", ") + "%0D%0A";
        }

        const subject = "Contact Form Submission";
        const mailtoUrl = `mailto:${emailAddressSmtp}?subject=${encodeURIComponent(subject)}&body=${body}`;

        window.location.href = mailtoUrl;

        // Reset form after "sending"
        if (form) form.reset();
        selectedServices = [];
        selectedStage = "";
        if (textarea) textarea.value = "";
        uploadedFiles = [];
        if (fileList) fileList.innerHTML = "";
        serviceCards.forEach(card => {
          card.classList.remove("selected");
          const checkbox = card.querySelector("input[type='checkbox']");
          if (checkbox) checkbox.checked = false;
        });
        stageCards.forEach(card => {
          card.classList.remove("selected");
          const radio = card.querySelector("input[type='radio']");
          if (radio) radio.checked = false;
        });
        currentStep = 1;
        updateSteps();
        checkStepValidity();
      }
    } else if (!nextBtn.disabled) {
      currentStep++;
      updateSteps();
      checkStepValidity();
    }
  });

  prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep > 1) {
      currentStep--;
      updateSteps();
      checkStepValidity();
    }
  });

  checkStepValidity();
});
