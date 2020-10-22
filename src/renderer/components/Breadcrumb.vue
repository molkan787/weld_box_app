<template>
  <div class="breadcrumb">
    <template v-for="(node, idx) in nodes">
      <div @click="$emit('item-click', node)" :key="'btn-' + ((node && node.id) || 'root')" class="item blured-bg" :class="{ locked: idx == nodes.length - 1 }">
        {{ node ? node.name : 'Diagram' }}
      </div>
      <ArrowRightIcon v-if="idx < nodes.length - 1" :key="'arrow' + ((node && node.id) || 'root')" :width="7.5" :height="12" />
    </template>
  </div>
</template>

<script>
import ArrowRightIcon from './icons/ArrowRight';
export default {
  components: {
    ArrowRightIcon
  },
  props: {
    nodes: {
      type: Array,
      required: true
    }
  },
  data: () => ({
    items: [
      {
        text: 'Chart',
        value: null,
      },
      {
        text: 'State 1',
        value: 1
      },
      {
        text: 'State 23',
        value: 23
      }
    ]
  })
}
</script>

<style lang="less" scoped>
.breadcrumb{
  position: fixed;
  width: fit-content;
  top: 60px;
  left: 64px;
  .item{
    display: inline-block;
    border-radius: 10px;
    color: #797A7C;
    font-weight: bold;
    font-size: 14px;
    padding: 4px 14px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    &:hover:not(.locked){
      background: rgba(255, 255, 255, 0.2);
      color: rgb(230, 230, 230);
    }
    &.locked{
      cursor: default;
    }
  }
  svg{
    margin: 0 5px 0 2px;
  }
}
</style>
