import { buildAddressBodyData, buildBrandBodyData, buildColorBodyData, buildCouponBodyData, buildDropBodyData, buildPhoneBodyData, buildProductBodyData, buildUserLoginBodyData, buildUserSignUpBodyData, handleAddressFetch, handleBrandFetch, handleColorFetch, handleCouponFetch, handleDropFetch, handleModalCreation, handlePhoneFetch, handleProductFetch, handleUserLoginFetch, handleUserSignUpFetch, updateAddressElements, updateBrandTable, updateColorTable, updateCouponTable, updateDropTable, updatePhoneElements, updateProductTable } from "./utils.js";
import { setLocalStorageItem } from "./localStorage.js";
import { validateUserSignUpForm } from "./formValidators.js";
import { paintUserIconOrLetter } from "./header.js";
export async function handlePhoneModalActions(phone = undefined){
try {
    await handleModalCreation({
        entityType: 'phone',
        method: phone ? "PUT" : "POST",
        buildBodyData: buildPhoneBodyData,
        saveGuestEntity: (bodyData) => setLocalStorageItem("guestPhones", bodyData,  true), //El true es porque es array
        updateElements: updatePhoneElements, // Funcion que actualiza el select de phones,
        postToDatabase: handlePhoneFetch
      })//hago el fetch para crear ese telefono
} catch (error) {
    return console.log(error);
}
}
export async function handleUserLoginModal(){
try {
    await handleModalCreation({
        entityType: 'user',
        method: "POST",
        buildBodyData: buildUserLoginBodyData,
        postToDatabase: handleUserLoginFetch,
        updateElements: paintUserIconOrLetter
      })//hago el fetch para crear ese telefono
} catch (error) {
    return console.log(error);
}
}
export async function handleUserSignUpModal(){
try {
    await handleModalCreation({
        entityType: 'user',
        method: "POST",
        buildBodyData: buildUserSignUpBodyData,
        postToDatabase: handleUserSignUpFetch,
        validateFormFunction: validateUserSignUpForm
      })//hago el fetch para crear ese telefono
} catch (error) {
    return console.log(error);
}
}

export async function handleAddressModalActions(address = undefined){
try {
    await handleModalCreation({
        entityType: 'address',
        method: address ? "PUT" : "POST",
        buildBodyData: buildAddressBodyData,
        saveGuestEntity: (bodyData) => setLocalStorageItem("guestAddresses", bodyData, true), //El true es porque es array
        updateElements: updateAddressElements, // Funcion que actualiza el select de address
        postToDatabase: handleAddressFetch
      })//hago el fetch para crear esa address
} catch (error) {
    return console.log(error);
}
}

export async function handleProductModalActions(product = undefined){
try {
    await handleModalCreation({
        entityType: 'product',
        method: product ? "PUT" : "POST",
        buildBodyData: buildProductBodyData,
        saveGuestEntity: null, 
        updateElements: updateProductTable, // Funcion que actualiza la tabla de productos
        postToDatabase: handleProductFetch
      })//hago el fetch para crear esa address
} catch (error) {
    return console.log(error);
}
}

export async function handleBrandModalActions(brand = undefined){
try {
    await handleModalCreation({
        entityType: 'brand',
        method: brand ? "PUT" : "POST",
        buildBodyData: buildBrandBodyData,
        saveGuestEntity: null, 
        updateElements: updateBrandTable, // Funcion que actualiza la tabla de productos
        postToDatabase: handleBrandFetch
      })//hago el fetch para crear esa address
} catch (error) {
    return console.log(error);
}
}

export async function handleDropModalActions(drop = undefined){
try {
    await handleModalCreation({
        entityType: 'drop',
        method: drop ? "PUT" : "POST",
        buildBodyData: buildDropBodyData,
        saveGuestEntity: null, 
        updateElements: updateDropTable, // Funcion que actualiza la tabla de productos
        postToDatabase: handleDropFetch
      })//hago el fetch para crear esa address
} catch (error) {
    return console.log(error);
}
}

export async function handleColorModalActions(color = undefined){
try {
    await handleModalCreation({
        entityType: 'color',
        method: color ? "PUT" : "POST",
        buildBodyData: buildColorBodyData,
        saveGuestEntity: null, 
        updateElements: updateColorTable, // Funcion que actualiza la tabla de productos
        postToDatabase: handleColorFetch
      })//hago el fetch para crear esa address
} catch (error) {
    return console.log(error);
}
}

export async function handleCouponModalActions(coupon = undefined){
    try {
        await handleModalCreation({
            entityType: 'coupon',
            method: coupon ? "PUT" : "POST",
            buildBodyData: buildCouponBodyData,
            saveGuestEntity: null, 
            updateElements: updateCouponTable, // Funcion que actualiza la tabla de productos
            postToDatabase: handleCouponFetch
          })//hago el fetch para crear esa address
    } catch (error) {
        return console.log(error);
    }
    }