<template>
  <div class="state-indicators">
    <div class="priority" v-if="requirePriority">
      <input type="text" v-model="state.priority">
      <PriorityIcon />
    </div>
    <ParallelIcon v-if="isParallel" />
    <HistoricIcon v-if="isHistoric" />
  </div>
</template>

<script>
import { StateDecomposition } from '../../my-diagram/state';
import HistoricIcon from '../icons/Historic';
import ParallelIcon from '../icons/Parallel';
import PriorityIcon from '../icons/Priority';
export default {
  components: {
    HistoricIcon,
    ParallelIcon,
    PriorityIcon
  },
  props: {
    state: {
      type: Object,
      required: true
    }
  },
  computed: {
    isHistoric(){
      return this.state.isHistoric;
    },
    isParallel(){
      return this.state.decomposition == StateDecomposition.Parallel;
    },
    requirePriority(){
      const p = this.state._parent;
      return p && p.decomposition == StateDecomposition.Parallel;
    }
  }
}
</script>

<style lang="less" scoped>
.state-indicators{
  svg{
    float: right;
    padding: 6px;
    transform: scale(1.5);
  }
  .priority{
    float: right;
    background-color: #18191D;
    position: relative;
    top: 2px;
    margin-right: 2px;
    border-radius: 4px;
    input{
      border: none;
      background: none;
      outline: none;
      width: 24px;
      height: 20px;
      float: right;
      font-size: 16px;
      color: white;
      text-align: center;
      margin-right: 3px;
    }
  }
}
</style>
