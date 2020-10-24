export function cloneObject<T>(obj: T): T{
  if(typeof obj === 'undefined') return <T><unknown>undefined;
  return <T>Object.assign({}, obj);
}
