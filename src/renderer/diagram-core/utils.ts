export function clone<T>(think: T): T{
  if(typeof think == 'object'){
    if(think instanceof Array){
      return <T><unknown>cloneArray(think);
    }else{
      return cloneObject(think);
    }
  }else{
    return think;
  }
}

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

export function patchObject(target: any, patch: any, props: string[]){
  for(let i = 0; i < props.length; i++){
    const p = props[i];
    target[p] = patch[p];
  }
  return target;
}
