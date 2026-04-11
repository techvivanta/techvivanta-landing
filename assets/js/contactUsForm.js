// Load CryptoJS dynamically if not already loaded
(function() {
  if (typeof CryptoJS === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js';
    script.onload = function() {
      console.log('CryptoJS loaded successfully');
      initContactForm();
    };
    script.onerror = function() {
      console.error('Failed to load CryptoJS');
      alert('Failed to load required libraries. Please refresh the page.');
    };
    document.head.appendChild(script);
  } else {
    initContactForm();
  }
})();

// Main initialization function
function initContactForm() {
  // Configuration
  const CONFIG = {
    baseUrl: 'https://kiroapi.techvivanta.com', // ⚠️ UPDATE THIS
    encryptionKey: 'a65cdf44d994399f95f8c51837c1bf87e4bc33d080848892c495833447e27028',
    clientEmail: 'techvivanta.app@gmail.com'
  };

  // Encrypt email using AES
  function encryptEmail(email) {
    try {
      const encrypted = CryptoJS.AES.encrypt(email, CONFIG.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  // Convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Show loading overlay
  function showLoading() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                  background: rgba(0,0,0,0.5); z-index: 9999; display: flex; 
                  align-items: center; justify-content: center;">
        <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mb-0">Sending your enquiry...</p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.remove();
  }

  // Show alert
  function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
    alertDiv.innerHTML = `
      <i class="ai-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForm);
  } else {
    initForm();
  }

  function initForm() {
    console.log('Initializing form...');
    
    /* -------------------------
       Step & Progress Handling
    ------------------------- */
    const steps = document.querySelectorAll(".step");
    const stepContents = document.querySelectorAll(".step-content");
    const controls = document.querySelector(".controls");
    
    if (!controls) {
      console.error('Controls not found!');
      return;
    }
    
    const buttons = controls.querySelectorAll("button");
    const prevBtn = buttons[0];
    const nextBtn = buttons[1];

    if (!prevBtn || !nextBtn) {
      console.error('Navigation buttons not found!');
      return;
    }

    console.log('Found', steps.length, 'steps');
    console.log('Found', stepContents.length, 'step contents');

    let currentStep = 1;

    const updateSteps = () => {
      console.log('Updating to step', currentStep);
      
      steps.forEach((el, index) => {
        el.classList.toggle("active", index + 1 === currentStep);
      });
      
      stepContents.forEach((content, index) => {
        content.style.display = index + 1 === currentStep ? "block" : "none";
      });

      prevBtn.style.display = currentStep === 1 ? "none" : "inline-block";
      nextBtn.textContent = currentStep === steps.length ? "Submit" : "Next";
      
      checkStepValidity();
    };

    /* -------------------------
       Step 1: Service Selection
    ------------------------- */
    const serviceCards = document.querySelectorAll("#serviceSection .custom-select-1");
    let selectedServices = [];

    console.log('Found', serviceCards.length, 'service cards');

    serviceCards.forEach((card) => {
      card.addEventListener("click", () => {
        const checkbox = card.querySelector("input[type='checkbox']");
        const serviceName = card.querySelector("p.text-center:last-child").innerText.trim();

        checkbox.checked = !checkbox.checked;
        card.classList.toggle("selected", checkbox.checked);

        if (checkbox.checked) {
          selectedServices.push(serviceName);
        } else {
          selectedServices = selectedServices.filter((s) => s !== serviceName);
        }
        console.log('Selected services:', selectedServices);
        checkStepValidity();
      });
    });

    /* -------------------------
       Step 2: Project Stage
    ------------------------- */
    const stageCards = document.querySelectorAll("#serviceSection2 .custom-select-2");
    let selectedStage = "";

    console.log('Found', stageCards.length, 'stage cards');

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
        console.log('Selected stage:', selectedStage);
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
    let uploadedFile = null;

    if (dropZone && fileInput) {
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
    }

    const handleFiles = (files) => {
      if (files.length === 0) return;
      
      const file = files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        showAlert('danger', `${file.name} exceeds 10MB limit.`);
        return;
      }
      
      uploadedFile = file;
      if (fileList) {
        fileList.innerHTML = `
          <li class="d-flex align-items-center justify-content-between p-2 border rounded">
            <span><i class="ai-file-earmark me-2"></i>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.removeFile()">
              <i class="ai-trash"></i>
            </button>
          </li>
        `;
      }
      checkStepValidity();
    };

    window.removeFile = () => {
      uploadedFile = null;
      if (fileList) fileList.innerHTML = '';
      if (fileInput) fileInput.value = '';
      checkStepValidity();
    };

    /* -------------------------
       Step 4: Form Fields
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

      if (!nameInput || !nameInput.value.trim() || !/^[a-zA-Z\s]{2,50}$/.test(nameInput.value.trim())) {
        showError(nameInput, "Name must be 2-50 characters and contain only letters");
      }

      if (!company || !company.value.trim() || company.value.trim().length < 2 || company.value.trim().length > 100) {
        showError(company, "Company name must be 2-100 characters");
      }

      if (!email || !email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showError(email, "Please enter a valid email address");
      }

      if (!phone || !phone.value.trim() || !/^[0-9]{7,15}$/.test(phone.value.trim())) {
        showError(phone, "Phone number must be 7-15 digits");
      }

      if (!country || !country.value.trim() || country.value.trim().length < 2) {
        showError(country, "Please enter your country");
      }

      if (!budget || !budget.value.trim() || !/^[0-9]+(\.[0-9]{1,2})?$/.test(budget.value.trim())) {
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
          valid = textarea && textarea.value.trim().length >= 10;
          break;
        case 4:
          valid = validateForm();
          break;
      }
      nextBtn.disabled = !valid;
      console.log('Step', currentStep, 'valid:', valid);
    };

    if (textarea) textarea.addEventListener("input", checkStepValidity);
    if (form) {
      form.addEventListener("input", checkStepValidity);
      form.addEventListener("change", checkStepValidity);
    }

    /* -------------------------
       Step Navigation and Submission
    ------------------------- */
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        return false;
      });
    }

    nextBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (currentStep === steps.length) {
        if (validateForm()) {
          showLoading();
          
          try {
            const encryptedEmail = encryptEmail(email.value.trim());
            const encryptedClientEmail = encryptEmail(CONFIG.clientEmail);

            let documentUrl = null;
            if (uploadedFile) {
              documentUrl = await fileToBase64(uploadedFile);
            }

            const extra_fields = [
              { key: "Services", value: selectedServices.join(", ") },
              { key: "Project Stage", value: selectedStage },
              { key: "Project Description", value: textarea.value.trim() },
              { key: "Company", value: company.value.trim() },
              { key: "Budget", value: budget.value.trim() }
            ];

            const payload = {
              name: nameInput.value.trim(),
              email: encryptedEmail,
              phone: phone.value.trim() || null,
              subject: `Project Enquiry from ${nameInput.value.trim()}`,
              message: textarea.value.trim(),
              country: country.value.trim(),
              document: documentUrl,
              client_email: encryptedClientEmail,
              extra_fields: extra_fields
            };

            console.log('Sending payload:', payload);

            const response = await fetch(`${CONFIG.baseUrl}/mail/contact-us`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            const result = await response.json();
            hideLoading();

            if (response.ok && result.status) {
              showAlert('success', 'Your enquiry has been sent successfully! We\'ll get back to you soon.');

              if (form) form.reset();
              selectedServices = [];
              selectedStage = "";
              if (textarea) textarea.value = "";
              uploadedFile = null;
              if (fileList) fileList.innerHTML = "";
              if (fileInput) fileInput.value = "";
              
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
            } else {
              showAlert('danger', result.message || 'Failed to send enquiry. Please try again.');
            }
          } catch (error) {
            hideLoading();
            console.error('Error sending enquiry:', error);
            showAlert('danger', 'An error occurred. Please try again later.');
          }
        }
      } else if (!nextBtn.disabled) {
        currentStep++;
        updateSteps();
      }
    });

    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentStep > 1) {
        currentStep--;
        updateSteps();
      }
    });

    updateSteps();
    console.log('Form initialized successfully');
  }
}
