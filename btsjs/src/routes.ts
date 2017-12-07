import { Router } from 'express'
import { jiggaloo } from './transaction'

const router: Router = Router();


// placeholder route handler
router.get('/', (req, res, next) => {
    res.render('../templates/home.html', {jigga:'jiggga'})
});


router.post('/transaction', (req, res, next) => {
    if (req.body.hasOwnProperty('privateKey')) {
        console.log(req.body['privateKey']);
    }


    let number = jiggaloo()
    res.json({
        message: 'Hello Jigga number ' + number
    });
});

export const routes: Router = router;