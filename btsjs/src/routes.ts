import { Router } from 'express'

const router: Router = Router();


// placeholder route handler
router.get('/', (req, res, next) => {
    res.json({
        message: 'Hello World!'
    });
});

router.post('/transaction', (req, res, next) => {
    console.dir(req.body);
    res.json({
        message: 'Hello Jigga!'
    });
});

export const routes: Router = router;