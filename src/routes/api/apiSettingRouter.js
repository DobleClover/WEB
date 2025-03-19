import express from 'express';
import apiSettingController from '../../controllers/api/apiSettingController.js';
import formValidations from '../../middlewares/formValidations.js';
import adminCredentialsMiddleware from '../../middlewares/adminCredentialsMiddleware.js';

const router = express.Router();

router.get('/', apiSettingController.getSettings);
router.put('/:id', formValidations.settingFields, apiSettingController.updateSetting);

export default router;
