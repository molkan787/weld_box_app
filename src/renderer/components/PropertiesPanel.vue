<template>
  <Panel text="Properties">
    <div class="properties-panel">
      <template v-if="object">
        <div class="form">

          <div class="field disabled">
            <label>Object</label>
            <input type="text" :value="object.what">
          </div>

          <div class="field">
            <label>Name</label>
            <input type="text" v-model="object.title">
          </div>

          <div class="field" v-if="needsPriority">
            <label>Priority</label>
            <input type="number" v-model="object.priority">
          </div>

          <div class="field">
            <label>Type</label>
            <RadioButtonGroup :items="decompositionItems" v-model="object.decomposition" />
            <div class="checkbox">
              <input type="checkbox" v-model="object.isHistoric" id="isHistoric">
              <label for="isHistoric">Historic</label>
            </div>
          </div>

        </div>
      </template>
      <template v-else>
        <div class="placeholder">
          <span>Select an Object to see and change properties</span>
        </div>
      </template>
    </div>
  </Panel>
</template>

<script>
import { StateDecomposition } from '../my-diagram/state';
import Panel from './skeletons/Panel';
import RadioButtonGroup from './skeletons/RadioButtonGroup';
export default {
  components: {
    Panel,
    RadioButtonGroup
  },
  props: {
    object: {
      type: Object,
      default: null
    }
  },
  computed:{
    needsPriority(){
      const o = this.object;
      return o && o._parent && o._parent.decomposition === StateDecomposition.Parallel;
    }
  },
  data: () => ({
    decompositionItems: [
      { text: 'Serial', value: 'serial' },
      { text: 'Parallel', value: 'parallel' }
    ]
  })
}
</script>

<style lang="less" scoped>
.properties-panel{
  width: 100%;
  height: 100%;
  background-color: #2C2D33;
  color: white;
  .placeholder{
    width: 100%;
    height: 100%;
    display: table;
    box-sizing: border-box;
    padding: 30px;
    text-align: center;
    span{
      display: table-cell;
      vertical-align: middle;
      opacity: 0.5;
      pointer-events: none;
      user-select: none;
    }
  }
}
.form{
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  .field{
    &:not(:last-child){
      margin-bottom: 16px;
    }
    label{
      padding-left: 2px;
      font-size: 14px;
    }
    input:not([type="checkbox"]){
      width: 100%;
      box-sizing: border-box;
      border-radius: 6px;
      border: none;
      background: #141519;
      color: white;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: bold;
      outline: none;
      margin-top: 4px;
    }
    &.disabled{
      input{
        background: #3B3D44;
        pointer-events: none;
      }
    }
  }
  .checkbox{
    margin-top: 4px;
    label{
      cursor: pointer;
    }
  }
}
</style>
