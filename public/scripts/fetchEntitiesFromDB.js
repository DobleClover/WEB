import { userLogged } from "./checkForUserLogged.js";

export let paymentTypesFromDB = [];
export async function setPaymentTypes() {
  try {
    let array =
      (await (await fetch(`${window.location.origin}/api/type/payment`)).json())
        .data || [];
    paymentTypesFromDB = array;
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let shippingTypesFromDB = [];
export async function setShippingTypes() {
  try {
    let array =
      (
        await (
          await fetch(`${window.location.origin}/api/type/shipping`)
        ).json()
      ).data || [];
    shippingTypesFromDB = array;
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let couponPrefixesFromDB = [];
export async function setCouponPrefixes() {
  try {
    let array =
      (
        await (
          await fetch(`${window.location.origin}/api/type/coupon-prefix`)
        ).json()
      ).data || [];
    couponPrefixesFromDB = array;
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let countriesFromDB = [];
export async function setCountries() {
  try {
    let array =
      (await (await fetch(`${window.location.origin}/api/type/country`)).json())
        .data || [];
    countriesFromDB = array;
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let provincesFromDB = [];
export async function setProvinces() {
  try {
    let array =
      (
        await (
          await fetch(`${window.location.origin}/api/type/province`)
        ).json()
      ).data || [];
    provincesFromDB = array;
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let sizesFromDB = [];
export async function setSizes() {
  try {
    let array =
      (await (await fetch(`${window.location.origin}/api/type/size`)).json())
        .data || [];
    sizesFromDB = array;
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let categoriesFromDB = [];
export async function setCategories() {
  try {
    let array =
      (
        await (
          await fetch(`${window.location.origin}/api/type/category`)
        ).json()
      ).data || [];
    categoriesFromDB = array;
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let gendersFromDB = [];
export async function setGenders() {
  try {
    let array =
      (await (await fetch(`${window.location.origin}/api/type/gender`)).json())
        .data || [];
    gendersFromDB = array;
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let statusesFromDB = [];
export async function setOrderStatuses() {
  try {
    const orderStatusesResponse = await fetch(
      `${window.location.origin}/api/type/order-statuses`
    );
    const orderStatusesJson = await orderStatusesResponse.json();
    statusesFromDB = orderStatusesJson.data || [];
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let colorsFromDB = [];
export async function setColors() {
  try {
    const colorsResponse = await fetch(`${window.location.origin}/api/color`);
    const colorsJson = await colorsResponse.json();
    colorsFromDB = colorsJson.data || [];
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let brandsFromDB = [];
export async function setBrands(withProductImages = false, onlyIsotype = false) {
  try {
    const params = new URLSearchParams();

    if (withProductImages) {
      params.append("withProductImages", "true");
      params.append("onlyMainImages", "true");
    }

    if (onlyIsotype) {
      params.append("onlyIsotype", "true");
    }

    const url = `${window.location.origin}/api/brand${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await fetch(url);
    const json = await response.json();
    brandsFromDB = json.data || [];
  } catch (error) {
    console.log("Falle");
    console.log(error);
  }
}


export let dropsFromDB = [];
export async function setDrops() {
  try {
    const response = await fetch(`${window.location.origin}/api/drop`);
    const json = await response.json();
    dropsFromDB = json.data || [];
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let settingsFromDB = [];
export async function setSettings() {
  try {
    const response = await fetch(`${window.location.origin}/api/setting`);
    const json = await response.json();
    settingsFromDB = json.data || [];
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}

export let coupons = [];
export let appliedCoupon = null; // definida afuera
export async function setCoupons() {
  try {
    const res = await fetch("/api/coupon");
    coupons = (await res.json())?.data || [];
  } catch (error) {
    console.log("Falle");
    return console.log(error);
  }
}
export function setAppliedCoupon(coupon = null) {
  return (appliedCoupon = coupon);
}

export async function setUserCoupons() {
  if (!userLogged?.id) return;
  const res = await fetch(`/api/coupon/user?users_id=${userLogged?.id}`);
  coupons = (await res.json())?.data || [];
  userLogged.coupons = coupons;
}
