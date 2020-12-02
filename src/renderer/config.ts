import env from '../env.json';
import _config from '../config.json';
export const config = Object.freeze(Object.assign({}, _config, env));
