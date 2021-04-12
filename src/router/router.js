import Router from 'express';
const controller=require('../controller/controller');
import middileware from '../middleware/verifySignup';
import session from '../middleware/session'
import verifyToken from '../middleware/verifyToken'
const router = Router();
router.get('/',controller.baseUrl);
router.get('/callback',controller.callbackurl);
// [verifyToken.verifyToken]
router.post('/getUser',controller.getUser);
router.post('/createConatct',controller.createConatct);
router.put('/updateConatct',controller.updateConatct);
router.put('/deleteConatct',controller.deleteConatct);
router.post('/getConatcts',controller.getConatcts);
router.post('/signUp',[middileware.verifySignup],controller.signUp);
router.post('/signIn',controller.signin);
router.get('/getValue',controller.getValue);
router.put('/userCredentialUpdate',controller.userCredentialUpdate)
// router.get('/getdata',controller.getdata);
export default router