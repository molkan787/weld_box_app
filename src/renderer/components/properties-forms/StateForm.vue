<template>
  <BaseForm :object="object">

    <FormField label="Priority">
      <input type="number" v-model="props.priority">
    </FormField>

    <FormField label="Type">
      <RadioButtonGroup :items="decompositionItems" v-model="props.decomposition" />
      <div class="checkbox">
        <input type="checkbox" v-model="props.historic" id="isHistoric">
        <label for="isHistoric">Historic</label>
      </div>
    </FormField>

  </BaseForm>
</template>

<script>
import BaseForm from './base';
import FormField from '../skeletons/FormField';
import RadioButtonGroup from '../skeletons/RadioButtonGroup';
export default {
  components: {
    BaseForm,
    FormField,
    RadioButtonGroup,
  },
  props:{
    object: {
      type: Object,
      required: true,
    }
  },
  computed:{
    props(){
      return this.object.properties;
    },
    needsPriority(){
      const o = this.object;
      return o && o._parent && o._parent.properties.decomposition === StateDecomposition.Parallel;
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
