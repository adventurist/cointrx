import 'babel-polyfill'
import 'core-js/fn/object/entries';
import { Router } from 'express'
import { transaction } from './transaction'

const router: Router = Router();


// placeholder route handler
router.get('/', (req, res, next) => {
    res.render('../templates/home.html', {jigga:'jiggga'})
});


router.post('/transaction', (req, res, next) => {
    var txIn = [], txOut = [], network = ''

    for (const [key, value] of Object.entries(req.body)) {
        console.log(`${key} ${value}`)
        for (const [k, v] of Object.entries(JSON.parse(key))) {
            console.log(`${k} ::: ${v}`)
            switch (k) {
                case 'txIn':
                    v.forEach((v) => {
                        txIn.push({id: v.output, idx: v.idx, address: v.address, value: v.value, key: v.wif})
                    })
                    break

                case 'txOut':
                    v.forEach((v) => {
                        txOut.push({address: v.address, value: v.value})
                    })
                    break

                case 'network':
                    network = v
            }
        }
    }

    res.json({ result:
        transaction(txIn, txOut, network)
    });
});

export const routes: Router = router;