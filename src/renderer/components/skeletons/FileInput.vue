<template>
  <div class="file-input">
    <input :value="value" readonly type="text" :placeholder="placeholder">
    <button @click="browseClick" class="btn">{{ buttonText }}</button>
  </div>
</template>

<script>
import { promptDirectory, promptFile, promptSaveFile } from '../../helpers/fs';
export default {
  props: {
    value: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'open',
    },
    placeholder: {
      type: String,
      default: '',
    },
    buttonText: {
      type: String,
      default: 'Browse'
    }
  },
  methods: {
    async browseClick(){
      let filename;
      if(this.type == 'open'){
        filename = await promptFile();
      }else if(this.type == 'save'){
        filename = await promptSaveFile();
      }else if(this.type == 'directory'){
        filename = await promptDirectory();
      }
      if(filename){
        this.$emit('input', filename);
      }
    }
  }
}
</script>

<style lang="less" scoped>
.file-input{
  input{
    padding-right: 30% !important;
  }
  button{
    position: relative;
    float: right;
    margin-top: -30px;
    margin-right: 2px;
    padding: 6px 28px;
  }
}
</style>
