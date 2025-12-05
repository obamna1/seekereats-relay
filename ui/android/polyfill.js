import 'react-native-get-random-values'
import { Buffer } from 'buffer'
import QuickCrypto from 'react-native-quick-crypto'

global.Buffer = Buffer
global.process = require('process')
global.crypto = QuickCrypto

// Debug verification
console.log('[POLYFILL] Loaded successfully')
console.log('[POLYFILL] Buffer:', typeof global.Buffer)
console.log('[POLYFILL] crypto:', typeof global.crypto)
console.log('[POLYFILL] process:', typeof global.process)
