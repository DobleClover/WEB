export function listenToCouponConditionalFields() {
    // Prefijo: mostrar input si es "otro"
    const prefixSelect = document.querySelector('select[name="coupon_prefix"]');
    const prefixInput = document.querySelector('input[name="coupon_prefix_input"]');
  
    const prefixSelectField = prefixSelect?.closest(".field");
    const prefixInputField = prefixInput?.closest(".field");
  
    if (prefixSelect && prefixInput && prefixSelectField && prefixInputField) {
      const handlePrefixChange = () => {
        const value = prefixSelect.value;
  
        if (!value) {
          prefixInputField.classList.remove("hidden");
          prefixInputField.classList.add("required");
          prefixInput.setAttribute("required", "required");
  
          prefixSelectField.classList.remove("required");
          prefixSelect.removeAttribute("required");
        } else {
          prefixInputField.classList.add("hidden");
          prefixInputField.classList.remove("required");
          prefixInput.removeAttribute("required");
          prefixInput.value = "";
  
          prefixSelectField.classList.add("required");
          prefixSelect.setAttribute("required", "required");
        }
      };
  
      prefixSelect.addEventListener("change", handlePrefixChange);
      handlePrefixChange();
    }
  
    // Tipo de cupón: mostrar fecha o usos
    const couponTypeSelect = document.querySelector('select[name="coupon_type"]');
    const expirationInput = document.querySelector('input[name="coupon_expiration_date"]');
    const maxUsesInput = document.querySelector('input[name="coupon_max_uses"]');
  
    const expirationField = expirationInput?.closest(".field");
    const maxUsesField = maxUsesInput?.closest(".field");
  
    if (couponTypeSelect && expirationInput && maxUsesInput && expirationField && maxUsesField) {
      const handleCouponTypeChange = () => {
        const selectedType = parseInt(couponTypeSelect.value);
  
        if (selectedType === 1) {
          // Expiración
          expirationField.classList.remove("hidden");
          expirationField.classList.add("required");
          expirationInput.setAttribute("required", "required");
  
          maxUsesField.classList.add("hidden");
          maxUsesField.classList.remove("required");
          maxUsesInput.removeAttribute("required");
          maxUsesInput.value = "";
        } else if (selectedType === 2) {
          // Máximo de usos
          expirationField.classList.add("hidden");
          expirationField.classList.remove("required");
          expirationInput.removeAttribute("required");
          expirationInput.value = "";
  
          maxUsesField.classList.remove("hidden");
          maxUsesField.classList.add("required");
          maxUsesInput.setAttribute("required", "required");
        }
      };
  
      couponTypeSelect.addEventListener("change", handleCouponTypeChange);
      handleCouponTypeChange();
    }
  }
  