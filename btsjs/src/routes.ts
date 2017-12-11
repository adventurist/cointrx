import 'babel-polyfill'
import 'core-js/fn/object/entries';
import { Router } from 'express'
import { transaction, jiggaloo } from './transaction'
import {isNullOrUndefined} from "util";

const router: Router = Router();


// placeholder route handler
router.get('/', (req, res, next) => {
    res.render('../templates/home.html', {jigga:'jiggga'})
});


router.post('/transaction', (req, res, next) => {
    var txIn = [], txOut = [], txAmount

    for (const [key, value] of Object.entries(req.body)) {
        console.log(`${key} ${value}`)
        for (const [k, v] of Object.entries(JSON.parse(key))) {
            console.log(`${k} ::: ${v}`)
            switch (k) {
                case 'txIn':
                    v.forEach((v) => {
                        txIn.push({id: v.output, key: v.address, value: v.value})
                    })
                    break

                case 'txOut':
                    v.forEach((v) => {
                        txOut.push({key: v.address, value: v.value})
                    })
                    break
            }
        }
    }
    let txId = 69
    const transactionResult = transaction(txIn, txOut)
    let number = jiggaloo()
    res.json({
        message: 'Hello Jigga number ' + number
    });
});

export const routes: Router = router;