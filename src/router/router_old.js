import Router from 'express';
const controller=require('../controller/controller');
import middileware from '../middleware/verifySignup';
import session from '../middleware/session'
const router = Router();
router.get('/',controller.baseUrl);
router.get('/callback',controller.callbackurl);
router.get('/getUser',controller.getUser);
router.post('/createConatct',controller.createConatct);
router.put('/updateConatct',controller.updateConatct);
router.put('/deleteConatct',controller.deleteConatct);
router.get('/getConatcts',[session],controller.getConatcts);
router.post('/signUp',[middileware.verifySignup],controller.signUp);
router.post('/signIn',[session],controller.signin);
// router.get('/getdata',controller.getdata);
export default router