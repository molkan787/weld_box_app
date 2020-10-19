<template>
  <div class="panel" :class="{ [side]: true, open }">
    <div @click="open = !open" class="activator">{{ text }}</div>
    <slot name="default"></slot>
  </div>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: 'Panel'
    },
    side: {
      type: String,
      default: 'right'
    }
  },
  data: () => ({
    open: false
  })
}
</script>

<style lang="less" scoped>
.panel{
  position: fixed;
  z-index: 10;
  top: 50px;
  height: calc(100% - 50px);
  width: 300px;
  transition: margin 0.5s;
  transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
  &.right{
    left: 100%;
    &.open{
      margin-left: -300px;
    }
  }
  &.left{
    left: 0;
    margin-left: -300px;
    &.open{
      margin-left: 0px;
    }
  }
  & > .activator{
    @w: 27px;
    position: absolute;
    top: 0;
    left: -@w;
    box-sizing: border-box;
    width: @w;
    padding: 16px 4px;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    border-bottom-right-radius: 6px;
    border-top-right-radius: 6px;
    background-color: #048346;
    color: white;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
  }
}
</style>
