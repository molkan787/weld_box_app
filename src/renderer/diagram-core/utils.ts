export function cloneObject<T>(obj: T): T{
  if(typeof obj === 'undefined') return <T><unknown>undefined;
  return <T>Object.assign({}, obj);
}

export function cloneArray<T>(arr: T[]): T[]{
  const narr: T[] = [];
  if(typeof arr[0] == 'object'){
    for(let i = 0; i < arr.length; i++){
      narr.push(cloneObject(arr[i]));
    }
  }else{
    narr.push(...arr);
  }
  return narr;
}
