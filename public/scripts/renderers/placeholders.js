export function renderProfilePlaceholder() {
  const div = document.createElement("div");
  div.className = "placeholder user_info_placeholder";
  div.innerHTML = `
      <div class="ui placeholder image_placeholder">
            <div class="image"></div>
          </div>
          <div class="ui placeholder">
            <div class="paragraph">
              <div class="line"></div>
            </div>
            <div class="paragraph">
              <div class="line"></div>
              <div class="line"></div>
              <div class="line"></div>
              <div class="line"></div>
            </div>
            <div class="paragraph">
              <div class="line"></div>
              <div class="line"></div>
            </div>
            <div class="paragraph">
              <div class="line"></div>
              <div class="line"></div>
            </div>
          </div>
    `;
  return div;
}

export function renderUserAddressesPlaceholder() {
  const div = document.createElement("div");
  div.className = "ui card user_addresses_placeholder placeholder";
  div.innerHTML = `
      <div class="content">
        <div class="ui placeholder">
          <div class="rectangular image"></div>
        </div>
      </div>
    `;
  return div;
}

export function renderUserPhonesPlaceholder() {
  const div = document.createElement("div");
  div.className = "ui card user_phones_placeholder placeholder";
  div.innerHTML = `
      <div class="content">
        <div class="ui placeholder">
          <div class="rectangular image"></div>
        </div>
      </div>
    `;
  return div;
}

export function renderUserOrdersPlaceholder() {
  const div = document.createElement("div");
  div.className = "ui placeholder user_orders_placeholder";
  div.innerHTML = `
      <div class="image header">
        <div class="line"></div>
        <div class="line"></div>
      </div>
    `;
  return div;
}
