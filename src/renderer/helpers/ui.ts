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
