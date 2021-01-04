<template>
  <div class="state-indicators">
    <div class="priority" v-if="requirePriority">
      <input type="number" min="1" @keypress="onKeyPress" @blur="priorityInput" :value="props.priority" v-bind="{[USE_NATIVE_CLIPBOARD]: '1'}">
      <PriorityIcon />
    </div>
    <ParallelIcon v-if="isParallel" />
    <HistoricIcon v-if="isHistoric" />
  </div>
</template>

<script>
import { MY_EVENTS } from '../../my-diagram/my-events';
import { StateDecomposition } from '../../my-diagram/state';
import { USE_NATIVE_CLIPBOARD } from '../../symbols';
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
  data: () => ({
    USE_NATIVE_CLIPBOARD: USE_NATIVE_CLIPBOARD
  }),
  computed: {
    props(){
      return this.state.properties;
    },
    isHistoric(){
      return this.props.historic;
    },
    isParallel(){
      return this.props.decomposition == StateDecomposition.Parallel;
    },
    requirePriority(){
      const p = this.state._parent;
      return p && p.properties.decomposition == StateDecomposition.Parallel;
    }
  },
  methods: {
    onKeyPress(e){
      if(e.keyCode == 13){
        this.priorityInput(e);
      }
    },
    /**
     * Submits the new priority from the input box to the State's properties
     */
    priorityInput(e){
      const prevPriority = this.props.priority;
      const value = e.target.value;
      let priority = parseInt(value || '1');
      this.props.priority = priority;

      const store = this.state.store;
      if(prevPriority !== priority && store){
        store.emit(MY_EVENTS.NODE_PRIORITY_CHANGED_BY_USER, {
          node: this.state,
          data: prevPriority
        })
      }
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
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}
</style>
