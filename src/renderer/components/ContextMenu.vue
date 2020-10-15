<template>
  <ContextMenu ref="menu">
      <li @click.prevent="node.isSubTask = !node.isSubTask" :disabled="isOpen">
          Sub-task <CheckedIcon class="checked-icon" v-if="node.isSubTask" />
      </li>
      <li class="separator"></li>
      <li @click="node.decomposition = StDe.Parallel">
        Parallel <CheckedIcon class="checked-icon" v-if="node.decomposition === StDe.Parallel" />
      </li>
      <li @click="node.decomposition = StDe.Serial">
        Serial <CheckedIcon class="checked-icon" v-if="node.decomposition === StDe.Serial" />
      </li>
      <li class="separator"></li>
      <li @click="node.isHistoric = !node.isHistoric">
        Historic <CheckedIcon class="checked-icon" v-if="node.isHistoric" />
      </li>
  </ContextMenu>
</template>

<script>
import ContextMenu from 'vue-context-menu'
import CheckedIcon from './icons/Checked.vue';
import { StateDecomposition } from '../my-diagram/state';
export default {
  components: {
    CheckedIcon,
    ContextMenu
  },
  data: () => ({
    node: {},
    StDe: StateDecomposition,
  }),
  computed: {
    isOpen(){
      return this.node.props && this.node.props.isOpen;
    }
  },
  methods: {
    handle(e){
      this.node = e.node;
      this.$refs.menu.open(e.sourceEvent);
    },
    onClick(){

    }
  }
}
</script>

<style lang="less" scoped>
.checked-icon{
  float: right;
  margin-top: 4px;
}
</style>

<style lang="less">
.ctx-menu-container{
  border: none !important;
  ul.ctx-menu{
    background-color: #000000 !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    & > li{
      color: white !important;
      cursor: default !important;
      padding: 10px;
      &:hover:not(.separator){
        background-color: #23BB7290 !important;
      }
      &.separator{
        padding: 6px;
      }
      &[disabled]{
        pointer-events: none;
        opacity: 0.5;
      }
    }
  }
}
</style>
