import 'babel-polyfill'
import 'core-js/fn/object/entries';
import { Router } from 'express'
import { transaction } from './transaction'
import { convertWifToPrivate } from './keytool'

const router: Router = Router();

router.post('/transaction', (req, res, next) => {
    var txIn = [], txOut = [], network = ''
    const time = new Date()

    console.log(time.getTime() + ' - TX REQUEST - ' + req.host + ' \n Body: ' + JSON.stringify(req.body));

    for (const [key, value] of Object.entries(req.body)) {
        for (const [k, v] of Object.entries(JSON.parse(key))) {
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
    const result = transaction(txIn, txOut, network)
    console.log(time.getTime() + ' - TX RESULT - ' + result !== 'error' ? 'Success' : 'Failure');
    const error = false
    res.json({
        result,
        error
    });
});

router.post('/key/from-wif', (req, res, next) => {
  console.log(req.body)
    const body = JSON.parse(Object.keys(req.body)[0])
    const wif = body.wif
    if (wif) {
        res.json({ result: convertWifToPrivate({wif: wif, multi: false})})
    }
})

export const routes: Router = router;
