export function cloneObject<T>(obj: T): T{
  return <T>Object.assign({}, obj);
}
