<template>
  <ContextMenu ref="menu">
    <template v-if="!node.isThread">
      <li @click.prevent="subtaskClick" :disabled="isOpen">
          Sub-task <CheckedIcon class="checked-icon" v-if="node.isSubTask" />
      </li>
      <li class="separator"></li>
    </template>
    <li @click="props.decomposition = StDe.Parallel">
      Parallel <CheckedIcon class="checked-icon" v-if="props.decomposition === StDe.Parallel" />
    </li>
    <li @click="props.decomposition = StDe.Serial">
      Serial <CheckedIcon class="checked-icon" v-if="props.decomposition === StDe.Serial" />
    </li>
    <li class="separator"></li>
    <li @click="props.historic = !props.historic">
      Historic <CheckedIcon class="checked-icon" v-if="props.historic" />
    </li>
  </ContextMenu>
</template>

<script>
import ContextMenu from 'vue-context-menu'
import CheckedIcon from './icons/Checked.vue';
import { StateDecomposition } from '../my-diagram/state';
import { ObjectType } from '../interfaces/ObjectType';
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
      return this.node.isOpen;
    },
    props(){
      return this.node.properties || {};
    }
  },
  methods: {
    subtaskClick(){
      if(this.node.isSubChart){
        this.node.convertToNormal();
      }else{
        this.node.convertToSubChart();
      }
    },
    handle({ node, sourceEvent }){
      if(node.what == ObjectType.State || node.what == ObjectType.Thread){
        this.node = node;
        this.$refs.menu.open(sourceEvent);
      }
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
