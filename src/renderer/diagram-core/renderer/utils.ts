/**
 * Converts class name to a css selector, actually it just prepend a dot '.' to the class name string
 * @param classname
 */
export function cs(classname: string){
  return '.' + classname;
}
