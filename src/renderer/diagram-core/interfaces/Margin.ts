export interface Margin{
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const ZeroMargin: Margin = Object.freeze({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});
