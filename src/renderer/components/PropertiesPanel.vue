<template>
  <Panel text="Properties" ref="panel">
    <div class="properties-panel" v-bind="{[USE_NATIVE_CLIPBOARD]: '1'}">
      <template v-if="object">
        <StateForm v-if="what == 'state' || what == 'thread'" :object="object" />
        <MessageForm v-else-if="what == 'message'" :object="object" />
        <EventForm v-else-if="what == 'event'" :object="object" />
        <VariableForm v-else-if="what == 'var'" :object="object" />
        <EdgeForm v-else-if="what == 'edge'" :object="object" />
        <BaseForm v-else :object="object" :showNameField="false" />
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
import StateForm from './properties-forms/StateForm';
import MessageForm from './properties-forms/MessageForm';
import EventForm from './properties-forms/EventForm';
import EdgeForm from './properties-forms/EdgeForm';
import VariableForm from './properties-forms/VariableForm';
import BaseForm from './properties-forms/base';
import { ObjectType } from '../interfaces/ObjectType';
import { EdgeType } from '../my-diagram/my-edge';
import { USE_NATIVE_CLIPBOARD } from '../symbols';
export default {
  components: {
    Panel,
    StateForm,
    MessageForm,
    EventForm,
    EdgeForm,
    BaseForm,
    VariableForm
  },
  props: {
    object: {
      type: Object,
      default: null
    }
  },
  data: () => ({
    USE_NATIVE_CLIPBOARD: USE_NATIVE_CLIPBOARD,
  }),
  computed: {
    what(){
      return this.object.what;
    }
  },
  watch: {
    object(val){
      if(val == null){
        this.$refs.panel.hide();
      }
    }
  },
  methods: {
    show(){
      this.$refs.panel.show();
    }
  }
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

</style>
