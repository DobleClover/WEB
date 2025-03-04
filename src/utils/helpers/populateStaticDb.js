import sizes from '../staticDB/sizes.js'

export const populateSize = (sizeId) => {
    return sizes.find(size => size.id === sizeId);
}