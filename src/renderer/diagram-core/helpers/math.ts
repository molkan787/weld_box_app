/**
 * Caps a number between a minimum and maximum value
 * @param value
 * @param min
 * @param max
 */
export function capNumber(value: number, min: number, max: number){
  if(value < min) return min;
  else if(value > max) return max;
  else return value;
}
