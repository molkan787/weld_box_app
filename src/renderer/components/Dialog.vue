<template>
  <modal name="dialog-modal" height="auto" width="400" :clickToClose="false">
    <div class="header">{{ title }}</div>
    <div class="body">
      {{ text }}
    </div>
    <div class="buttons dialog-modal">
      <template v-if="buttons">
        <button v-for="btn in buttons" :key="btn.value" @click="buttonClick(btn)"
           class="btn" :class="{ primary: btn.primary }">
          {{ btn.text }}
        </button>
      </template>
      <template v-else>
        <button v-if="!OkOnly" @click="cancelClick" style="width:120px" class="btn">Cancel</button>
        <button @click="okClick" style="width:120px" class="primary btn">Ok</button>
      </template>
    </div>
  </modal>
</template>

<script>
import { Dialog } from '../dialog';
export default {
  data: () => ({
    title: '',
    okText: '',
    cancelText: '',
    OkOnly: false,
    text: '',
    buttons: null,
    callback: null,
  }),
  methods: {
    okClick(){
      this.end(true);
    },
    cancelClick(){
      this.end(false);
    },
    buttonClick(btn){
      this.end(btn.value);
    },
    end(value){
      this.callback(value);
      this.$modal.hide('dialog-modal');
    },
    open(text, options){
      const { title, okText, cancelText, OkOnly, buttons } = options || {};
      this.text = text;
      this.title = title || (OkOnly ? 'Info' : 'Confirm');
      if(buttons){
        this.buttons = buttons;
      }else{
        this.okText = okText || 'Ok';
        this.cancelText = cancelText || 'Cancel';
        this.OkOnly = !!OkOnly;
        this.buttons = null;
      }
      this.$modal.show('dialog-modal');
      return new Promise(r => this.callback = r);
    },
    ask(text, options){
      return this.open(text, { ...options, OkOnly: false });
    },
    info(text, options){
      return this.open(text, { ...options, OkOnly: true });
    }
  },
  created(){
    Dialog._ask = (t, o) => this.ask(t, o);
    Dialog._info = (t, o) => this.info(t, o);
  }
}
</script>

<style lang="less" scoped>
.dialog-modal.buttons{
  .btn{
    margin-left: 5px;
    min-width: 100px;
  }
}
</style>
