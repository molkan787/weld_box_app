/**
 * Makes a `<textarea>` height automatically fit its text height
 * @param textarea
 */
export function textareaFitContentHeight(textarea: HTMLTextAreaElement): void{
  const ta = <any>textarea;
  textarea.style.height = '';
  textarea.style.height = textarea.scrollHeight + 'px';
  if(ta.fch_applied) return;
  ta.fch_applied = true;
  textarea.addEventListener('input', function(){
    this.style.height = '';
    this.style.height = this.scrollHeight + 'px';
  });
}

/**
 * Calculate visual text size
 * @param text
 * @param style The style to apply to the text
 * @param options
 */
export function calcTextSize(text: string, style: any, options?: { maxWidth: number }){
  const { maxWidth } = options || {};
  const el = prepareTextCalcElement();
  let styleString = styleObjectToString(style);
  styleString += 'width:fit-content;height:auto;visibility:hidden;line-height: normal;white-space: pre-wrap;';
  if(maxWidth) styleString += `max-width:${maxWidth}px`;
  el.setAttribute('style', styleString);
  // Append 'space' char if the text ends with a line-break, otherwise it will be ignored
  if(text.charAt(text.length - 1) == '\n'){
      text = text + ' ';
  }
  el.innerText = text;
  const { width, height } = el.getClientRects()[0];
  return { width, height };
}

let textSizeCalcElement: HTMLDivElement | null = null;
function prepareTextCalcElement(){
    if(textSizeCalcElement) return textSizeCalcElement;
    const id = 'helper_text_calc_el';
    let el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    textSizeCalcElement = el;
    return el;
}

function styleObjectToString(style: any){
    let result = '';
    for(let prop in style){
        result += `${prop}:${style[prop]};`;
    }
    return result;
}
