import _config from '../config.json';
/**
 * Main application's configuration loaded from a json file (sort of envirenment variables)
 */
export const config = Object.freeze(Object.assign({}, _config));
