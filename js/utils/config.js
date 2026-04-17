// ==========================
// Constantes et configurations
// ==========================
export const BASE_URL = 'http://localhost:3000/api/decoder';
export const API_URL = 'http://localhost:3000/api';
export const DECODER_ADDRESSES = Array.from({ length: 12 }, (_, i) => `127.0.10.${i + 1}`);
export const ACTIONS = ['info', 'reset', 'reinit', 'shutdown'];
