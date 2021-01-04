<template>
  <textarea v-bind="{[USE_NATIVE_CLIPBOARD]: 1}" v-model="node.text" title="Comment"
  class="comment-node" :class="{'force-outline': forceOutline}" ></textarea>
</template>

<script>
import { EVENTS } from '../../diagram-core';
import { calcTextSize } from '../../helpers/ui';
import { USE_NATIVE_CLIPBOARD } from '../../symbols';
export default {
  props: {
    node: {
      type: Object,
      required: true,
    }
  },
  watch: {
    'node.text': {
      immediate: true,
      handler(){
        this.onTextChange();
      }
    }
  },
  computed: {
    forceOutline(){
      return !this.node.text.replace(/\s/g, '');
    }
  },
  data: () => ({
    USE_NATIVE_CLIPBOARD: USE_NATIVE_CLIPBOARD
  }),
  methods: {
    onTextChange(){
      this.adjustSize();
    },
    /**
     * Calculates the size if the text and use it as the input box size
     */
    adjustSize(){
      const node = this.node;
      let { width, height } = calcTextSize(node.text, {
        'font-size': '15px',
        'font-family': 'Jost',
      });
      width += 10;
      height += 6;
      if(width < 50) width = 50;
      if(height < 25) height = 25;
      node.size = { width, height, radius: 0 };
      node.store && node.store.emit(EVENTS.NODE_BBOX_CHANGED, { node });
    }
  }
}
</script>

<style lang="less" scoped>
textarea.comment-node{
  background: none;
  resize: none;
  font-family: inherit;
  font-size: 15px;
  color: white;
  width: 100%;
  height: 100%;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  padding: 0;
  margin: 0;
  white-space: nowrap;
  text-align: center;
  outline: none;
  border: none;
  &:focus, &.force-outline{
    outline: 1px solid #23BB72;
  }
}
</style>
