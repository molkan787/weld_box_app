/**
 * Clone an Object or Array,
 * @param think
 */
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

/**
 * Clone an Object (nested objects will be copied by refference)
 * @param obj Object to clone
 */
export function cloneObject<T>(obj: T): T{
  if(typeof obj === 'undefined') return <T><unknown>undefined;
  return <T>Object.assign({}, obj);
}

/**
 * Clone an Object (all nested objects will be also cloned)
 * @param obj
 */
export function cloneNestedObject<T>(obj: T): T{
  if(typeof obj === 'undefined') return <T><unknown>undefined;
  const _obj = <any>obj;
  const clone: any = {};
  for(let p in _obj){
    if(_obj.hasOwnProperty(p)){
      const val = _obj[p];
      if(typeof val == 'object'){
        if(val instanceof Array){
          clone[p] = cloneArray(val);
        }else{
          clone[p] = cloneNestedObject(val);
        }
      }else{
        clone[p] = val;
      }
    }
  }
  return <T>clone;
}

/**
 * Clone an array, if the items of the array are Objects they will be cloned (not copied by refference)
 * @param arr
 */
export function cloneArray<T>(arr: T[]): T[]{
  const narr: T[] = [];
  if(typeof arr[0] == 'object'){
    for(let i = 0; i < arr.length; i++){
      narr.push(cloneNestedObject(arr[i]));
    }
  }else{
    narr.push(...arr);
  }
  return narr;
}

/**
 * Assigns the specfied list of properties `props` from the `patch` to the `target` object
 * @param target
 * @param patch
 * @param props
 */
export function patchObject(target: any, patch: any, props: string[]){
  for(let i = 0; i < props.length; i++){
    const p = props[i];
    target[p] = patch[p];
  }
  return target;
}
