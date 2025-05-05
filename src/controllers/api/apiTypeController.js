import systemMessages from '../../utils/staticDB/systemMessages.js';
import { paymentTypes } from '../../utils/staticDB/paymentTypes.js';
import { shippingTypes } from '../../utils/staticDB/shippingTypes.js';
import countries from '../../utils/staticDB/countries.js';
import sizes from '../../utils/staticDB/sizes.js';
import genders from '../../utils/staticDB/genders.js';
import ordersStatuses from '../../utils/staticDB/ordersStatuses.js';
import { categories } from '../../utils/staticDB/categories.js';
import { HTTP_STATUS } from '../../utils/staticDB/httpStatusCodes.js';
import provinces from '../../utils/staticDB/provinces.js';



const {productMsg} = systemMessages;
const { fetchFailed, notFound, fetchSuccessfull, createFailed, updateFailed, deleteSuccess, createSuccessfull, deleteFailed } = productMsg;

const controller = {
    getPaymentTypes: async (req, res) => {
        try {
            return res.status(HTTP_STATUS.OK.code).json({
                ok: true,
                data: paymentTypes
            })
        } catch (error) {
            console.log(`error in getPaymentTypes:`);
            console.log(error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
                ok: false,
                msg: fetchFailed
            })
        }
    },
    getShippingTypes: async (req, res) => {
        try {
            return res.status(HTTP_STATUS.OK.code).json({
                ok: true,
                data: shippingTypes
            })
        } catch (error) {
            console.log(`error in getShippingTypes:`);
            console.log(error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
                ok: false,
                msg: fetchFailed
            })
        }
    },
    getCountries: async (req, res) => {
        try {
            return res.status(HTTP_STATUS.OK.code).json({
                ok: true,
                data: countries
            })
        } catch (error) {
            console.log(`error in getCountries:`);
            console.log(error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
                ok: false,
                msg: fetchFailed
            })
        }
    },
    getProvinces: async (req, res) => {
        try {
            return res.status(HTTP_STATUS.OK.code).json({
                ok: true,
                data: provinces
            })
        } catch (error) {
            console.log(`error in getProvinces:`);
            console.log(error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
                ok: false,
                msg: fetchFailed
            })
        }
    },
    getSizes: async (req, res) => {
        try {
            
            return res.status(HTTP_STATUS.OK.code).json({
                ok: true,
                data: sizes
            })
        } catch (error) {
            console.log(`error in getSizes:`);
            console.log(error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
                ok: false,
                msg: fetchFailed
            })
        }
    },
    getCategories: async (req, res) => {
        try {
            return res.status(HTTP_STATUS.OK.code).json({
                ok: true,
                data: categories
            })
        } catch (error) {
            console.log(`error in getSizes:`);
            console.log(error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
                ok: false,
                msg: fetchFailed
            })
        }
    },
    getGenders: async (req, res) => {
        try { 
            return res.status(HTTP_STATUS.OK.code).json({
                ok: true,
                data: genders
            })
        } catch (error) {
            console.log(`error in getGenders:`);
            console.log(error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
                ok: false,
                msg: fetchFailed
            })
        }
    },
    getOrderStatuses: async (req, res) => {
        try {
            return res.status(HTTP_STATUS.OK.code).json({
                ok: true,
                data: ordersStatuses
            })
        } catch (error) {
            console.log(`error in getOrderStatuses:`);
            console.log(error);
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.code).json({
                ok: false,
                msg: fetchFailed
            })
        }
    }
};

export default controller;
