import { handleModalCreation } from "./utils";

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
        updateElements: decideLanguageInsertion
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
        updateElements: updateAddressElements, // Funcion que actualiza el select de phones
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

